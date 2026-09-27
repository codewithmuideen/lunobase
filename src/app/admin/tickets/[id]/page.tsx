import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Ticket, TicketMessage } from "@/lib/types";
import { formatDate, shortId } from "@/lib/utils";
import { Conversation } from "@/components/support/conversation";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Ticket" };

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();
  const { data: t } = await db.from("support_tickets").select("*").eq("id", id).maybeSingle();
  const ticket = t as Ticket | null;
  if (!ticket) notFound();
  const [{ data: msgs }, { data: u }] = await Promise.all([
    db.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at"),
    db.from("profiles").select("*").eq("id", ticket.user_id).single(),
  ]);
  const user = u as Profile;
  const locked = !user.withdrawals_enabled && new Date(user.withdrawal_unlock_at) > new Date();

  return (
    <>
      <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-white">
        <ArrowLeft className="size-4" /> All tickets
      </Link>
      <div className="mb-5 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-slate">
            #{shortId(ticket.id)} · <span className="capitalize">{ticket.category}</span> · opened {formatDate(ticket.created_at)}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Conversation
          ticketId={ticket.id}
          messages={(msgs as TicketMessage[] | null) ?? []}
          mode="admin"
          closed={ticket.status === "closed"}
          customerName={user.full_name ?? user.email}
        />
        <aside className="card h-fit p-5">
          <p className="text-xs text-muted">Customer</p>
          <p className="mt-1 font-semibold text-white">{user.full_name ?? "-"}</p>
          <p className="text-sm text-slate">{user.email}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate">Status</dt>
              <dd>
                <StatusBadge status={user.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Withdrawals</dt>
              <dd className={locked ? "text-warn" : "text-up"}>{locked ? `Locked to ${formatDate(user.withdrawal_unlock_at, false)}` : "Enabled"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Joined</dt>
              <dd className="text-white">{formatDate(user.created_at, false)}</dd>
            </div>
          </dl>
          <ButtonLink href={`/admin/users/${user.id}`} variant="secondary" size="sm" className="mt-5 w-full">
            Manage user &amp; withdrawal access
          </ButtonLink>
        </aside>
      </div>
    </>
  );
}
