import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Notification } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100);
  const items = (data as Notification[] | null) ?? [];

  // Opening this page marks everything as read.
  if (items.some((n) => !n.read_at)) {
    await createAdminClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("user_id", profile.id)
      .is("read_at", null);
  }

  return (
    <>
      <PageHeader title="Notifications" />
      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {items.map((n) => (
              <li key={n.id}>
                <Link href={n.link ?? "#"} className="flex gap-4 px-5 py-4 transition hover:bg-white/[0.02] sm:px-6">
                  <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read_at ? "bg-white/10" : "bg-brand-500")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-slate">{n.body}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(n.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
