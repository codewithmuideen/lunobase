"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to this user's rows via Supabase Realtime (RLS-filtered) and refreshes the
 * server-rendered dashboard when anything changes, e.g. an admin confirms a deposit.
 */
export function RealtimeSync({ userId, onNotification }: { userId: string; onNotification?: () => void }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyRef = useRef(onNotification);
  notifyRef.current = onNotification;

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 250);
    };
    const filter = `user_id=eq.${userId}`;
    const channel = supabase
      .channel(`user-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "balances", filter }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits", filter }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals", filter }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter }, (payload: { new: unknown }) => {
        const n = payload.new as { title: string; body: string | null; kind: string };
        if (n.kind !== "trade") toast(n.title, { description: n.body ?? undefined });
        notifyRef.current?.();
        refresh();
      })
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
