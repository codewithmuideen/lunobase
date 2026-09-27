import { requireUser } from "@/lib/auth";
import { formatDate, shortId } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { PreferencesForm, ProfileForm } from "@/components/dashboard/settings-forms";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await requireUser();
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and notification preferences." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Profile</h2>
            <div className="mt-5">
              <ProfileForm profile={profile} />
            </div>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Notifications</h2>
            <div className="mt-2">
              <PreferencesForm loginAlerts={profile.login_alerts} tradeEmails={profile.trade_emails} />
            </div>
          </section>
        </div>
        <section className="card h-fit p-6">
          <h2 className="font-semibold text-white">Account</h2>
          <dl className="mt-4 divide-y divide-white/5 text-sm">
            {[
              ["Account ID", <span key="id" className="font-mono">LB-{shortId(profile.id)}</span>],
              ["Status", <StatusBadge key="s" status={profile.status} />],
              ["Verification", <StatusBadge key="k" status={profile.kyc_status} />],
              ["Member since", formatDate(profile.created_at, false)],
              ["Withdrawals unlock", profile.withdrawals_enabled ? "Enabled" : formatDate(profile.withdrawal_unlock_at, false)],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-slate">{k}</dt>
                <dd className="text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
