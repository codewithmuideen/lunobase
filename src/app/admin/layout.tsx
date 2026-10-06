import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Lunobase Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const [d, w, t, k] = await Promise.all([
    db.from("deposits").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    db.from("kyc_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return (
    <AdminShell email={profile.email} counts={{ deposits: d.count ?? 0, withdrawals: w.count ?? 0, tickets: t.count ?? 0, kyc: k.count ?? 0 }}>
      {children}
    </AdminShell>
  );
}
