"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";
import { getProfile, getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { MFA_COOKIE, MFA_TTL_SECONDS, signMfaToken } from "@/lib/security/mfa-token";
import { checkLoginCode, issueLoginCode } from "@/lib/security/otp";
import { isBreachedPassword, passwordProblems } from "@/lib/security/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { describeDevice, requestMeta } from "@/lib/security/request";
import { verifyHuman } from "@/lib/security/turnstile";
import { logSecurityEvent } from "@/lib/security/events";
import { formatDate } from "@/lib/utils";

export type FormState = { error?: string; message?: string; fields?: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const fullName = str(fd, "full_name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const country = str(fd, "country");
  const fields = { full_name: fullName, email, country };

  if (str(fd, "website")) return { message: "ok" }; // honeypot: bots fill hidden fields
  if (fullName.length < 2 || fullName.length > 80) return { error: "Enter your full legal name.", fields };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields };
  if (!country) return { error: "Select your country of residence.", fields };
  if (fd.get("terms") !== "on") return { error: "Please accept the Terms and Risk Disclosure.", fields };
  const pwProblem = passwordProblems(password);
  if (pwProblem) return { error: pwProblem, fields };
  if (password !== String(fd.get("confirm_password") ?? "")) return { error: "Passwords don't match.", fields };

  const { ip } = await requestMeta();
  if (!(await verifyHuman(str(fd, "cf-turnstile-response"), ip))) {
    return { error: "Please complete the security check.", fields };
  }
  if (!(await rateLimit(`register:ip:${ip}`, 5, 3600))) {
    return { error: "Too many sign-up attempts. Please try again later.", fields };
  }
  if (await isBreachedPassword(password)) {
    return { error: "This password has appeared in a data breach. Please choose a different one.", fields };
  }

  const db = createAdminClient();
  const { data: settings } = await db.from("app_settings").select("signups_enabled").eq("id", 1).maybeSingle();
  if (settings && (settings as { signups_enabled: boolean }).signups_enabled === false) {
    return { error: "New registrations are temporarily paused. Please check back soon.", fields };
  }

  const { data, error } = await db.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data: { full_name: fullName, country }, redirectTo: `${SITE_URL}/login` },
  });

  if (error) {
    // Don't reveal whether an email is registered (prevents account enumeration).
    if (!/already|registered|exists/i.test(error.message)) {
      console.error("[register]", error.message);
      return { error: "We couldn't create your account right now. Please try again.", fields };
    }
  } else if (data.properties?.hashed_token) {
    const url = `${SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=signup`;
    await sendEmail(email, templates.verifyEmail({ name: fullName, url }));
  }

  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

// ---------------------------------------------------------------------------
// Login step 1: password (+ robot check) -> emails a 6-digit code
// ---------------------------------------------------------------------------
export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = safeNext(str(fd, "next"));
  const fields = { email };

  if (str(fd, "website")) return { error: "Invalid email or password.", fields };
  if (!EMAIL_RE.test(email) || !password) return { error: "Enter your email and password.", fields };

  const { ip, userAgent } = await requestMeta();
  if (!(await verifyHuman(str(fd, "cf-turnstile-response"), ip))) {
    return { error: "Please complete the security check.", fields };
  }
  const [ipOk, emailOk] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 30, 900),
    rateLimit(`login:email:${email}`, 8, 900),
  ]);
  if (!ipOk || !emailOk) {
    return { error: "Too many sign-in attempts. Wait 15 minutes and try again.", fields };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error && /confirm/i.test(error.message)) {
      return { error: "Please verify your email first - check your inbox for the link.", fields };
    }
    await logSecurityEvent(null, "login_failed", { ip, userAgent, email });
    return { error: "Invalid email or password.", fields };
  }

  const profile = await getProfile(data.user.id);
  if (!profile || profile.status === "suspended") {
    await supabase.auth.signOut();
    return { error: "This account is suspended. Please email contact@lunobase.com.", fields };
  }

  try {
    await issueLoginCode(profile, ip, userAgent);
  } catch (err) {
    console.error("[login] issue code", err);
    await supabase.auth.signOut();
    return { error: "We couldn't send your verification code. Please try again.", fields };
  }

  redirect(next ? `/verify?next=${encodeURIComponent(next)}` : "/verify");
}

// ---------------------------------------------------------------------------
// Login step 2: email OTP (required for every user and admin, every sign-in)
// ---------------------------------------------------------------------------
export async function verifyCodeAction(_: FormState, fd: FormData): Promise<FormState> {
  const code = str(fd, "code").replace(/\D/g, "");
  const next = safeNext(str(fd, "next"));
  if (code.length !== 6) return { error: "Enter the 6-digit code from your email." };

  const session = await getSession();
  if (!session) redirect("/login");

  const { ip, userAgent } = await requestMeta();
  if (!(await rateLimit(`otp:${session.userId}`, 10, 900))) {
    return { error: "Too many attempts. Please sign in again in 15 minutes." };
  }

  const result = await checkLoginCode(session.userId, code);
  if (result !== "ok") {
    await logSecurityEvent(session.userId, "otp_failed", { ip, userAgent, result });
    const messages: Record<string, string> = {
      invalid: "That code isn't right. Check your email and try again.",
      expired: "This code has expired. Request a new one.",
      locked: "Too many incorrect attempts. Request a new code.",
      missing: "No active code. Request a new one.",
    };
    return { error: messages[result] };
  }

  const token = await signMfaToken(session.userId, session.sessionId);
  (await cookies()).set(MFA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MFA_TTL_SECONDS,
  });

  const db = createAdminClient();
  const profile = await getProfile(session.userId);

  // New-device detection: have we seen this browser for this user before?
  const { count } = await db
    .from("security_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .eq("event", "login")
    .eq("user_agent", userAgent);

  await Promise.all([
    db.from("profiles").update({ last_login_at: new Date().toISOString() } as never).eq("id", session.userId),
    logSecurityEvent(session.userId, "login", { ip, userAgent, device: describeDevice(userAgent) }),
  ]);

  if (profile && (count ?? 0) === 0 && profile.login_alerts && profile.last_login_at) {
    await sendEmail(
      profile.email,
      templates.newLogin({
        name: profile.full_name,
        device: describeDevice(userAgent),
        ip,
        when: formatDate(new Date()),
        antiPhishing: profile.anti_phishing_code,
      }),
    );
  }

  redirect(next ?? (profile?.role === "admin" ? "/admin" : "/dashboard"));
}

export async function resendCodeAction(): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");
  const [shortOk, longOk] = await Promise.all([
    rateLimit(`otp-resend-short:${session.userId}`, 1, 45),
    rateLimit(`otp-resend:${session.userId}`, 5, 3600),
  ]);
  if (!shortOk) return { error: "Please wait a moment before requesting another code." };
  if (!longOk) return { error: "Too many codes requested. Try again in an hour." };

  const profile = await getProfile(session.userId);
  if (!profile) redirect("/login");
  const { ip, userAgent } = await requestMeta();
  await issueLoginCode(profile, ip, userAgent);
  return { message: "A new code is on its way." };
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
export async function signOutAction() {
  await signOut("local");
}

/** Signs out every device/browser where this account is logged in. */
export async function signOutEverywhereAction() {
  await signOut("global");
}

async function signOut(scope: "local" | "global") {
  const session = await getSession();
  const supabase = await createClient();
  if (session) {
    const { ip, userAgent } = await requestMeta();
    await logSecurityEvent(session.userId, scope === "global" ? "logout_all" : "logout", { ip, userAgent });
  }
  await supabase.auth.signOut({ scope });
  (await cookies()).delete(MFA_COOKIE);
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  const { ip, userAgent } = await requestMeta();
  if (!(await verifyHuman(str(fd, "cf-turnstile-response"), ip))) return { error: "Please complete the security check." };
  if (!(await rateLimit(`forgot:ip:${ip}`, 5, 3600)) || !(await rateLimit(`forgot:email:${email}`, 3, 3600))) {
    return { error: "Too many requests. Please try again later." };
  }

  const db = createAdminClient();
  const { data } = await db.auth.admin.generateLink({ type: "recovery", email });
  if (data?.properties?.hashed_token && data.user) {
    const profile = await getProfile(data.user.id);
    const url = `${SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`;
    await sendEmail(email, templates.resetPassword({ name: profile?.full_name, url, antiPhishing: profile?.anti_phishing_code }));
    await logSecurityEvent(data.user.id, "password_reset_requested", { ip, userAgent });
  }
  // Same response whether or not the account exists.
  return { message: "If an account exists for that email, a reset link is on its way. It expires in 1 hour." };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (password !== String(fd.get("confirm_password") ?? "")) return { error: "Passwords don't match." };
  const problem = passwordProblems(password);
  if (problem) return { error: problem };
  if (await isBreachedPassword(password)) {
    return { error: "This password has appeared in a data breach. Please choose a different one." };
  }

  const session = await getSession();
  if (!session) return { error: "Your reset link has expired. Request a new one." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  const { ip, userAgent } = await requestMeta();
  await logSecurityEvent(session.userId, "password_changed", { ip, userAgent, via: "reset" });
  await supabase.auth.signOut({ scope: "global" });
  (await cookies()).delete(MFA_COOKIE);
  redirect("/login?reset=1");
}
