import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SecurityEventName =
  | "login"
  | "login_failed"
  | "otp_failed"
  | "logout"
  | "logout_all"
  | "password_changed"
  | "password_reset_requested"
  | "anti_phishing_set"
  | "account_frozen"
  | "email_verified"
  | "withdrawal_requested";

export async function logSecurityEvent(
  userId: string | null,
  event: SecurityEventName,
  meta: { ip?: string; userAgent?: string; [k: string]: unknown } = {},
) {
  const { ip, userAgent, ...rest } = meta;
  await createAdminClient()
    .from("security_events")
    .insert({ user_id: userId, event, ip: ip ?? null, user_agent: userAgent ?? null, meta: rest } as never);
}
