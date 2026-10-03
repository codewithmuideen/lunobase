import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MFA_COOKIE, verifyMfaToken } from "@/lib/security/mfa-token";
import type { Profile } from "@/lib/types";

export type Session = { userId: string; sessionId: string; email: string };

/** Verified Supabase session (JWT checked), or null. Cached per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    userId: claims.sub,
    sessionId: String(claims.session_id ?? ""),
    email: String(claims.email ?? ""),
  };
});

/** True if this browser has completed the email OTP step for the current session. */
export const hasPassedMfa = cache(async (): Promise<boolean> => {
  const session = await getSession();
  if (!session) return false;
  const token = (await cookies()).get(MFA_COOKIE)?.value;
  return verifyMfaToken(token, session.userId, session.sessionId);
});

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const db = createAdminClient();
  const [{ data }, auth] = await Promise.all([
    db.from("profiles").select("*").eq("id", userId).maybeSingle(),
    db.auth.admin.getUserById(userId),
  ]);
  if (!data) return null;
  const avatar = auth.data.user?.user_metadata?.avatar_url;
  return { ...(data as Profile), avatar_url: typeof avatar === "string" && avatar ? avatar : null };
});

/** Use in pages/layouts/actions that require a fully signed-in (password + OTP) user. */
export async function requireUser(): Promise<{ session: Session; profile: Profile }> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await hasPassedMfa())) redirect("/verify");
  const profile = await getProfile(session.userId);
  if (!profile) redirect("/login?error=profile");
  if (profile.status === "suspended") redirect("/login?error=suspended");
  return { session, profile };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile.role !== "admin") redirect("/dashboard");
  return ctx;
}

/** Same checks as requireUser, but returns null instead of redirecting (for server actions). */
export async function currentUser(): Promise<{ session: Session; profile: Profile } | null> {
  const session = await getSession();
  if (!session || !(await hasPassedMfa())) return null;
  const profile = await getProfile(session.userId);
  if (!profile || profile.status === "suspended") return null;
  return { session, profile };
}

export async function currentAdmin() {
  const ctx = await currentUser();
  return ctx && ctx.profile.role === "admin" ? ctx : null;
}
