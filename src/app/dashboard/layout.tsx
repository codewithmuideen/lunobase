import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Lunobase" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  const unread = await getUnreadCount(profile.id);
  return (
    <DashboardShell
      profile={{ id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role, status: profile.status }}
      unread={unread}
    >
      {children}
    </DashboardShell>
  );
}
