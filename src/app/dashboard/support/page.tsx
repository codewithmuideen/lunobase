import Link from "next/link";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/lib/types";
import { timeAgo, shortId } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { TicketForm } from "@/components/support/ticket-form";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Support" };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { profile } = await requireUser();
  const { new: preset } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("support_tickets").select("*").eq("user_id", profile.id).order("updated_at", { ascending: false });
  const tickets = (data as Ticket[] | null) ?? [];

  return (
    <>
      <PageHeader title="Support" description="Talk to the Lunobase team. We usually reply within a few hours." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 font-semibold text-white sm:px-6">Your tickets</h2>
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No tickets yet" text="Open a ticket and our team will get back to you." />
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.04]">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/dashboard/support/${t.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02] sm:px-6">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                      <MessageSquare className="size-4 text-slate" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{t.subject}</p>
                      <p className="text-xs text-muted">
                        #{shortId(t.id)} · <span className="capitalize">{t.category}</span> · updated {timeAgo(t.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card-raised p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-white">Open a new ticket</h2>
          <p className="mt-1 text-sm text-slate">Tell us what you need and we&apos;ll take it from there.</p>
          <div className="mt-5">
            <TicketForm defaultCategory={preset} />
          </div>
        </section>
      </div>
    </>
  );
}
