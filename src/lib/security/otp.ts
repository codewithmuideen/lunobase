import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { describeDevice } from "./request";
import type { Profile } from "@/lib/types";

const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

function hashCode(challengeId: string, code: string) {
  return createHmac("sha256", process.env.AUTH_SECRET!).update(`${challengeId}:${code}`).digest("hex");
}

/** Creates a fresh 6-digit login code (invalidating older ones) and emails it. */
export async function issueLoginCode(profile: Pick<Profile, "id" | "email" | "full_name" | "anti_phishing_code">, ip: string, userAgent: string) {
  const db = createAdminClient();
  await db
    .from("login_challenges")
    .update({ consumed_at: new Date().toISOString() } as never)
    .eq("user_id", profile.id)
    .is("consumed_at", null);

  const id = crypto.randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await db.from("login_challenges").insert({
    id,
    user_id: profile.id,
    code_hash: hashCode(id, code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    ip,
    user_agent: userAgent,
  } as never);
  if (error) throw new Error(error.message);

  const sent = await sendEmail(
    profile.email,
    templates.loginCode({
      name: profile.full_name,
      code,
      device: describeDevice(userAgent),
      ip,
      antiPhishing: profile.anti_phishing_code,
    }),
  );
  if (!sent && process.env.NODE_ENV !== "production") {
    // Local development without a working email domain: print the code to the server console.
    console.info(`\n[dev] Login code for ${profile.email}: ${code}\n`);
  }
}

export type OtpCheck = "ok" | "invalid" | "expired" | "locked" | "missing";

export async function checkLoginCode(userId: string, code: string): Promise<OtpCheck> {
  const db = createAdminClient();
  const { data } = await db
    .from("login_challenges")
    .select("id, code_hash, expires_at, attempts")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ch = data as { id: string; code_hash: string; expires_at: string; attempts: number } | null;
  if (!ch) return "missing";
  if (new Date(ch.expires_at).getTime() < Date.now()) return "expired";
  if (ch.attempts >= MAX_OTP_ATTEMPTS) return "locked";

  const expected = Buffer.from(ch.code_hash, "hex");
  const actual = Buffer.from(hashCode(ch.id, code), "hex");
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!match) {
    await db.from("login_challenges").update({ attempts: ch.attempts + 1 } as never).eq("id", ch.id);
    return ch.attempts + 1 >= MAX_OTP_ATTEMPTS ? "locked" : "invalid";
  }
  await db.from("login_challenges").update({ consumed_at: new Date().toISOString() } as never).eq("id", ch.id);
  return "ok";
}
