"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { replyTicketAction } from "@/actions/support";
import { adminReplyTicketAction } from "@/actions/admin";
import type { TicketMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { LogoMark } from "@/components/brand/logo";
import { cn, formatDate } from "@/lib/utils";

export function Conversation({
  ticketId,
  messages,
  mode,
  closed,
  customerName,
}: {
  ticketId: string;
  messages: TicketMessage[];
  mode: "user" | "admin";
  closed: boolean;
  customerName: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [messages.length]);

  // Live updates when the other side replies
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` }, () =>
        router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, router]);

  const send = (close = false) =>
    start(async () => {
      const res =
        mode === "admin"
          ? await adminReplyTicketAction({ ticketId, message: body, close })
          : await replyTicketAction({ ticketId, message: body });
      if (res.ok) {
        setBody("");
        if (res.message) toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="max-h-[60vh] min-h-72 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
        {messages.map((m) => {
          const mine = mode === "admin" ? m.is_staff : !m.is_staff;
          return (
            <div key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
              {m.is_staff ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600/15">
                  <LogoMark className="size-4" />
                </span>
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                  {customerName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className={cn("max-w-[80%]", mine && "text-right")}>
                <p className="text-xs text-muted">
                  {m.is_staff ? "Lunobase Support" : customerName} · {formatDate(m.created_at)}
                </p>
                <div
                  className={cn(
                    "mt-1 inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-left text-sm leading-relaxed",
                    mine ? "rounded-tr-md bg-brand-600 text-white" : "rounded-tl-md bg-white/[0.06] text-silver",
                  )}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="border-t border-white/5 p-4">
        {closed && mode === "user" ? (
          <p className="text-center text-sm text-slate">This ticket is closed. Reply below to reopen it.</p>
        ) : null}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mode === "admin" ? "Write a reply to the customer…" : "Write a message…"}
            rows={3}
            className="min-h-20 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && body.trim()) send();
            }}
          />
          <div className="flex gap-2">
            {mode === "admin" && (
              <Button variant="secondary" onClick={() => send(true)} loading={pending}>
                {body.trim() ? "Reply & close" : "Close ticket"}
              </Button>
            )}
            <Button onClick={() => send()} loading={pending} disabled={!body.trim()}>
              <Send className="size-4" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
