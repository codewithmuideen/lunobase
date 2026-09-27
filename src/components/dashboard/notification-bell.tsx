"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationsReadAction } from "@/actions/account";
import type { Notification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function NotificationBell({ userId, unread, setUnread }: { userId: string; unread: number; setUnread: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    createClient()
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }: { data: unknown }) => setItems((data as Notification[] | null) ?? []));
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, userId, unread]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-10 place-items-center rounded-xl text-silver transition hover:bg-white/5 hover:text-white"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl animate-fade-up">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="font-semibold text-white">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() =>
                  start(async () => {
                    await markNotificationsReadAction();
                    setUnread(0);
                    setItems((it) => it?.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) ?? null);
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
              >
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items === null ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-12" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/dashboard/notifications"}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 border-b border-white/[0.04] px-4 py-3 transition hover:bg-white/[0.03]"
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-brand-500")} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white">{n.title}</span>
                    {n.body && <span className="mt-0.5 block truncate text-xs text-slate">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-muted">{timeAgo(n.created_at)}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-white/5 px-4 py-3 text-center text-sm text-brand-400 hover:bg-white/[0.03]"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
