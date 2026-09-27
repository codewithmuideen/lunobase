import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketMessage } from "@/lib/types";
import { shortId } from "@/lib/utils";
import { Conversation } from "@/components/support/conversation";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Support ticket" };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data: t } = await supabase.from("support_tickets").select("*").eq("id", id).eq("user_id", profile.id).maybeSingle();
  const ticket = t as Ticket | null;
  if (!ticket) notFound();
  const { data: msgs } = await supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/support" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-white">
        <ArrowLeft className="size-4" /> All tickets
      </Link>
      <div className="mb-5 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-slate">
            Ticket #{shortId(ticket.id)} · <span className="capitalize">{ticket.category}</span>
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <Conversation
        ticketId={ticket.id}
        messages={(msgs as TicketMessage[] | null) ?? []}
        mode="user"
        closed={ticket.status === "closed"}
        customerName={profile.full_name ?? "You"}
      />
    </div>
  );
}
