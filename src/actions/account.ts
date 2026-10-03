"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";
import { MFA_COOKIE } from "@/lib/security/mfa-token";
import { isBreachedPassword, passwordProblems } from "@/lib/security/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { requestMeta } from "@/lib/security/request";
import { logSecurityEvent } from "@/lib/security/events";
import { verifyPassword } from "@/lib/security/verify-password";
import { sendAdminAlert, sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import type { ActionResult } from "@/lib/types";

const EXPIRED = { ok: false as const, error: "Your session has expired. Please sign in again." };

export async function updateProfileAction(input: { full_name: string; phone: string; country: string }): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  const full_name = String(input.full_name ?? "").trim().slice(0, 80);
  const phone = String(input.phone ?? "").replace(/[^\d+\-\s()]/g, "").slice(0, 24);
  const country = String(input.country ?? "").trim().slice(0, 56);
  if (full_name.length < 2) return { ok: false, error: "Enter your full name." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ full_name, phone: phone || null, country: country || null } as never)
    .eq("id", ctx.profile.id);
  if (error) return { ok: false, error: "Could not save your profile." };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function updatePreferencesAction(input: { login_alerts: boolean; trade_emails: boolean }): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  await createAdminClient()
    .from("profiles")
    .update({ login_alerts: !!input.login_alerts, trade_emails: !!input.trade_emails } as never)
    .eq("id", ctx.profile.id);
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Preferences saved." };
}

export async function setAntiPhishingCodeAction(input: { code: string; password: string }): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  const code = String(input.code ?? "").trim();
  if (code && !/^[A-Za-z0-9_-]{4,20}$/.test(code)) {
    return { ok: false, error: "Use 4-20 letters, numbers, dashes or underscores." };
  }
  if (!(await rateLimit(`stepup:${ctx.profile.id}`, 5, 900))) return { ok: false, error: "Too many attempts. Try again later." };
  if (!(await verifyPassword(ctx.profile.email, input.password))) return { ok: false, error: "Incorrect password." };

  await createAdminClient().from("profiles").update({ anti_phishing_code: code || null } as never).eq("id", ctx.profile.id);
  const { ip, userAgent } = await requestMeta();
  await logSecurityEvent(ctx.profile.id, "anti_phishing_set", { ip, userAgent, removed: !code });
  revalidatePath("/dashboard/security");
  return { ok: true, message: code ? "Anti-phishing code saved. It will appear in every email we send you." : "Anti-phishing code removed." };
}

export async function changePasswordAction(input: { current: string; next: string; confirm: string }): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  if (input.next !== input.confirm) return { ok: false, error: "New passwords don't match." };
  const problem = passwordProblems(input.next);
  if (problem) return { ok: false, error: problem };
  if (input.next === input.current) return { ok: false, error: "Choose a password you haven't used here before." };
  if (!(await rateLimit(`stepup:${ctx.profile.id}`, 5, 900))) return { ok: false, error: "Too many attempts. Try again later." };
  if (!(await verifyPassword(ctx.profile.email, input.current))) return { ok: false, error: "Current password is incorrect." };
  if (await isBreachedPassword(input.next)) {
    return { ok: false, error: "This password has appeared in a data breach. Please choose a different one." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.next });
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut({ scope: "others" });

  const { ip, userAgent } = await requestMeta();
  await logSecurityEvent(ctx.profile.id, "password_changed", { ip, userAgent });
  return { ok: true, message: "Password changed. All other devices have been signed out." };
}

/** Emergency self-service lock: freezes trading and withdrawals, then signs out everywhere. */
export async function freezeAccountAction(input: { confirm: string }): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  if (String(input.confirm).trim().toUpperCase() !== "FREEZE") return { ok: false, error: 'Type FREEZE to confirm.' };

  const { profile } = ctx;
  await createAdminClient().from("profiles").update({ status: "frozen" } as never).eq("id", profile.id);
  const { ip, userAgent } = await requestMeta();
  await Promise.all([
    logSecurityEvent(profile.id, "account_frozen", { ip, userAgent, by: "user" }),
    sendEmail(profile.email, templates.accountStatus({ name: profile.full_name, status: "frozen", antiPhishing: profile.anti_phishing_code })),
    sendAdminAlert(
      templates.adminAlert({
        title: "User froze their account",
        lines: [["User", profile.email], ["IP", ip]],
        url: `${SITE_URL}/admin/users/${profile.id}`,
      }),
    ),
  ]);

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  (await cookies()).delete(MFA_COOKIE);
  redirect("/login?frozen=1");
}

export async function markNotificationsReadAction(): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  await createAdminClient()
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("user_id", ctx.profile.id)
    .is("read_at", null);
  return { ok: true };
}

export async function toggleWatchlistAction(coinId: string): Promise<ActionResult<{ watching: boolean }>> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  const id = String(coinId).slice(0, 80);
  const db = createAdminClient();
  const { data } = await db.from("watchlist").select("coin_id").eq("user_id", ctx.profile.id).eq("coin_id", id).maybeSingle();
  if (data) {
    await db.from("watchlist").delete().eq("user_id", ctx.profile.id).eq("coin_id", id);
  } else {
    await db.from("watchlist").insert({ user_id: ctx.profile.id, coin_id: id } as never);
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, data: { watching: !data } };
}

// ---------------------------------------------------------------------------
// Profile photo
// ---------------------------------------------------------------------------
const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_BYTES = 600 * 1024; // the browser resizes to 320px first, so real uploads are ~20-60 KB

/** Identify the image by its magic bytes; never trust the file name or declared type. */
function sniffImage(bytes: Uint8Array): { ext: string; mime: string } | null {
  const b = bytes;
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { ext: "webp", mime: "image/webp" };
  }
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  return null;
}

async function clearAvatarFiles(userId: string, keep?: string) {
  const storage = createAdminClient().storage.from(AVATAR_BUCKET);
  const { data } = await storage.list(userId);
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await storage.remove(stale);
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image first." };
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: "That image is too large. Please choose a smaller one." };
  if (!(await rateLimit(`avatar:${ctx.profile.id}`, 12, 3600))) {
    return { ok: false, error: "You've changed your photo a lot recently. Please try again later." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: "Only JPG, PNG or WebP images are allowed." };

  const db = createAdminClient();
  const path = `${ctx.profile.id}/${Date.now()}.${kind.ext}`;
  const { error } = await db.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: kind.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[avatar] upload", error.message);
    return { ok: false, error: "Could not upload your photo. Please try again." };
  }

  const url = db.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: metaError } = await db.auth.admin.updateUserById(ctx.profile.id, { user_metadata: { avatar_url: url } });
  if (metaError) {
    await db.storage.from(AVATAR_BUCKET).remove([path]);
    return { ok: false, error: "Could not save your photo. Please try again." };
  }
  await clearAvatarFiles(ctx.profile.id, path);

  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, data: { url }, message: "Profile photo updated." };
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  const db = createAdminClient();
  const { error } = await db.auth.admin.updateUserById(ctx.profile.id, { user_metadata: { avatar_url: null } });
  if (error) return { ok: false, error: "Could not remove your photo." };
  await clearAvatarFiles(ctx.profile.id);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile photo removed." };
}
