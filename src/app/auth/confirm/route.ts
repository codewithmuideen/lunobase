import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { logSecurityEvent } from "@/lib/security/events";

// Handles links from our branded verification / password-reset emails.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) return NextResponse.redirect(`${origin}/login?error=link`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=link`);

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // Email confirmed. Send welcome, then require a normal sign-in (password + OTP).
  const profile = await getProfile(data.user.id);
  await logSecurityEvent(data.user.id, "email_verified");
  if (profile) await sendEmail(profile.email, templates.welcome({ name: profile.full_name }));
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?verified=1`);
}
