import { CheckCircle2, Fingerprint, KeyRound, LogOut, MailCheck, MonitorSmartphone, ShieldAlert, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { describeDevice } from "@/lib/security/request";
import { signOutEverywhereAction } from "@/actions/auth";
import type { SecurityEvent } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { AntiPhishingForm, ChangePasswordForm, FreezeAccountButton } from "@/components/dashboard/security-forms";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Security" };

const EVENT_LABEL: Record<string, string> = {
  login: "Signed in",
  login_failed: "Failed sign-in",
  otp_failed: "Wrong verification code",
  logout: "Signed out",
  logout_all: "Signed out everywhere",
  password_changed: "Password changed",
  password_reset_requested: "Password reset requested",
  anti_phishing_set: "Anti-phishing code updated",
  account_frozen: "Account frozen",
  email_verified: "Email verified",
  withdrawal_requested: "Withdrawal requested",
};

export default async function SecurityPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("security_events")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(25);
  const events = (data as SecurityEvent[] | null) ?? [];

  const checks = [
    { ok: true, label: "Email verified", icon: MailCheck },
    { ok: true, label: "2-step login verification (always on)", icon: ShieldAlert },
    { ok: !!profile.anti_phishing_code, label: "Anti-phishing code set", icon: Fingerprint },
    { ok: profile.login_alerts, label: "New-device login alerts on", icon: MonitorSmartphone },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <>
      <PageHeader title="Security center" description="Manage how your account is protected." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Fingerprint className="size-5 text-brand-400" />
              <h2 className="font-semibold text-white">Anti-phishing code</h2>
            </div>
            <p className="mt-2 text-sm text-slate">
              This code appears in every email we send you. If an email claiming to be from Lunobase doesn&apos;t show it, it&apos;s fake.
            </p>
            <div className="mt-5">
              <AntiPhishingForm current={profile.anti_phishing_code} />
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <KeyRound className="size-5 text-brand-400" />
              <h2 className="font-semibold text-white">Change password</h2>
            </div>
            <p className="mt-2 text-sm text-slate">Changing your password signs you out of all other devices.</p>
            <div className="mt-5">
              <ChangePasswordForm />
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
              <div className="flex items-center gap-3">
                <MonitorSmartphone className="size-5 text-brand-400" />
                <h2 className="font-semibold text-white">Recent security activity</h2>
              </div>
              <form action={signOutEverywhereAction}>
                <Button variant="secondary" size="sm">
                  <LogOut className="size-4" /> Sign out all devices
                </Button>
              </form>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-y border-white/5 text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium sm:px-6">Event</th>
                    <th className="px-4 py-3 font-medium">Device</th>
                    <th className="px-4 py-3 font-medium">IP address</th>
                    <th className="px-5 py-3 text-right font-medium sm:px-6">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => {
                    const bad = e.event.includes("failed") || e.event === "account_frozen";
                    return (
                      <tr key={e.id} className="border-b border-white/[0.04] last:border-0">
                        <td className={cn("px-5 py-3 font-medium sm:px-6", bad ? "text-down" : "text-white")}>{EVENT_LABEL[e.event] ?? e.event}</td>
                        <td className="px-4 py-3 text-slate">{e.user_agent ? describeDevice(e.user_agent) : "-"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate">{e.ip ?? "-"}</td>
                        <td className="px-5 py-3 text-right text-slate sm:px-6">{formatDate(e.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-raised p-6">
            <p className="text-sm text-slate">Security score</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="num font-display text-5xl font-bold text-white">{score}</span>
              <span className="mb-1.5 text-slate">/ 100</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
              <div className={cn("h-full rounded-full", score === 100 ? "bg-up" : "bg-brand-500")} style={{ width: `${score}%` }} />
            </div>
            <ul className="mt-5 space-y-3">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-3 text-sm">
                  {c.ok ? <CheckCircle2 className="size-4 text-up" /> : <XCircle className="size-4 text-muted" />}
                  <span className={c.ok ? "text-silver" : "text-slate"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card border-down/20 p-6">
            <h2 className="font-semibold text-white">Emergency: freeze account</h2>
            <p className="mt-2 text-sm text-slate">
              Suspect unauthorized access? Freezing pauses trading and withdrawals instantly and signs out every session.
            </p>
            <div className="mt-5">
              <FreezeAccountButton />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
