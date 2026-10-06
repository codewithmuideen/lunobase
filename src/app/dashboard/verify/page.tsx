import { BadgeCheck, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { KycForm } from "@/components/dashboard/kyc-form";

export const metadata = { title: "Verify identity" };

export default async function VerifyIdentityPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kyc_submissions")
    .select("status, admin_note, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = data as { status: string; admin_note: string | null; created_at: string } | null;
  const status = profile.kyc_status;

  return (
    <>
      <PageHeader title="Verify your identity" description="A one-time check that protects your account and keeps Lunobase safe for everyone." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card-raised p-5 sm:p-7">
          {error ? (
            <Notice icon={Clock} tone="info" title="Verification is being set up" text="This feature will be available shortly. Please check back soon." />
          ) : status === "verified" ? (
            <Notice icon={BadgeCheck} tone="up" title="You're verified" text="Your identity has been confirmed. Nothing more to do." />
          ) : status === "pending" ? (
            <Notice
              icon={Clock}
              tone="warn"
              title="Your documents are under review"
              text={`Submitted ${last ? formatDate(last.created_at) : "recently"}. We usually finish within 24 hours and will notify you here and by email.`}
            />
          ) : (
            <>
              {status === "rejected" && (
                <div className="mb-6">
                  <Notice
                    icon={ShieldAlert}
                    tone="down"
                    title="We couldn't verify your last submission"
                    text={last?.admin_note ? `Reason: ${last.admin_note}. Please submit again.` : "Please check your photos and submit again."}
                  />
                </div>
              )}
              <KycForm defaultName={profile.full_name ?? ""} defaultCountry={profile.country ?? ""} />
            </>
          )}
        </section>

        <aside className="card h-fit p-6">
          <h2 className="font-semibold text-white">Why we ask</h2>
          <ul className="mt-4 space-y-4 text-sm text-slate">
            {[
              ["Protects your money", "If someone gets into your account, they can't pass themselves off as you."],
              ["Required by law", "Financial platforms must know who their customers are."],
              ["Private and secure", "Your documents are encrypted, stored privately and never shared for marketing."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-400" />
                <span>
                  <span className="block font-medium text-white">{t}</span>
                  {d}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-white/5 pt-4 text-xs text-muted">
            Accepted: national ID card, passport or driver&apos;s licence. Questions? info@lunobase.com
          </p>
        </aside>
      </div>
    </>
  );
}

function Notice({ icon: Icon, tone, title, text }: { icon: typeof Clock; tone: "up" | "warn" | "down" | "info"; title: string; text: string }) {
  const tones = {
    up: "border-up/25 bg-up/[0.06] text-up",
    warn: "border-warn/25 bg-warn/[0.06] text-warn",
    down: "border-down/25 bg-down/[0.06] text-down",
    info: "border-brand-500/25 bg-brand-500/[0.06] text-brand-300",
  };
  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-5 ${tones[tone]}`}>
      <Icon className="mt-0.5 size-6 shrink-0" />
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-silver">{text}</p>
      </div>
    </div>
  );
}
