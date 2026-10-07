/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { withUsers } from "@/lib/admin-data";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusTabs } from "@/components/admin/status-tabs";
import { KycReview } from "@/components/admin/kyc-review";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Identity verification" };

const TABS = ["pending", "approved", "rejected"];

type Row = {
  id: string;
  user_id: string;
  legal_name: string;
  date_of_birth: string;
  country: string;
  doc_type: string;
  doc_number: string;
  front_path: string;
  back_path: string | null;
  selfie_path: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

export default async function AdminKycPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = TABS.includes(raw ?? "") ? raw! : "pending";
  const db = createAdminClient();
  const { data, error } = await db
    .from("kyc_submissions")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(40);

  if (error) {
    return (
      <>
        <PageHeader title="Identity verification" />
        <div className="card p-6 text-sm text-silver">
          This feature needs the database update in <code className="text-brand-300">supabase/migrations/0003_kyc_referrals_demo.sql</code>. Run it in
          the Supabase SQL Editor, then reload this page.
        </div>
      </>
    );
  }

  const rows = await withUsers((data as Row[] | null) ?? []);
  // Documents are private: generate short-lived links (10 minutes) for this page view only.
  const paths = rows.flatMap((r) => [r.front_path, r.back_path, r.selfie_path].filter(Boolean) as string[]);
  const signed = paths.length ? await db.storage.from("kyc").createSignedUrls(paths, 600) : { data: [] };
  const url = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <>
      <PageHeader title="Identity verification" description="Check that the document is genuine, readable and matches the selfie and the name." />
      <StatusTabs base="/admin/kyc" current={status} tabs={TABS} />
      <div className="space-y-4">
        {rows.map((r) => (
          <article key={r.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-white">{r.legal_name}</p>
                <Link href={`/admin/users/${r.user_id}`} className="text-sm text-brand-400 hover:text-brand-300">
                  {r.user?.email ?? r.user_id}
                </Link>
                <p className="mt-1 text-xs text-muted">Submitted {formatDate(r.created_at)}</p>
              </div>
              {r.status === "pending" ? <KycReview id={r.id} name={r.legal_name} /> : <StatusBadge status={r.status} />}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ["Date of birth", r.date_of_birth],
                ["Country", r.country],
                ["Document", r.doc_type.replace("_", " ")],
                ["Number", r.doc_number],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium capitalize text-white">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Front", r.front_path],
                ["Back", r.back_path],
                ["Passport photo", r.selfie_path],
              ]
                .filter(([, p]) => p)
                .map(([label, p]) => (
                  <a key={label} href={url.get(p!) ?? "#"} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-xl border border-white/10">
                    {url.get(p!) ? (
                      <img src={url.get(p!) ?? undefined} alt={`${label} of document`} className="aspect-[4/3] w-full bg-ink-950 object-cover transition group-hover:opacity-90" />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center text-xs text-muted">Image unavailable</div>
                    )}
                    <span className="block bg-white/[0.03] px-3 py-2 text-xs text-slate">{label} · open full size</span>
                  </a>
                ))}
            </div>
            {r.admin_note && <p className="mt-4 text-sm text-slate">Note: {r.admin_note}</p>}
          </article>
        ))}
        {rows.length === 0 && <div className="card px-5 py-14 text-center text-sm text-slate">No {status} verifications.</div>}
      </div>
    </>
  );
}
