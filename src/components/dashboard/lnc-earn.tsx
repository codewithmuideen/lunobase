"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, Check, Flame, MessageCircle, Send } from "lucide-react";
import { checkInAction, claimShareAction } from "@/actions/lnc";
import { LNC, type ShareChannel } from "@/lib/lunocoin";
import { cn } from "@/lib/utils";

const MESSAGE = "I trade crypto on Lunobase. Sign up with my link and earn LunoCoin rewards:";

/** Share buttons that pay 20 LNC per channel per day. */
export function LncShare({ link, claimed }: { link: string; claimed: ShareChannel[] }) {
  const router = useRouter();
  const [done, setDone] = useState<ShareChannel[]>(claimed);
  const [busy, setBusy] = useState<ShareChannel | null>(null);

  const url = encodeURIComponent(link);
  const msg = encodeURIComponent(MESSAGE);
  const channels: { id: ShareChannel; label: string; href: string; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${MESSAGE} ${link}`)}`, icon: MessageCircle, tone: "text-[#25D366]" },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, icon: FacebookIcon, tone: "text-[#4C8DFF]" },
    { id: "x", label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${msg}&url=${url}`, icon: XIcon, tone: "text-white" },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${url}&text=${msg}`, icon: Send, tone: "text-[#2AABEE]" },
  ];

  const share = async (id: ShareChannel, href: string) => {
    // Open first, inside the click, so mobile browsers don't block the new tab.
    window.open(href, "_blank", "noopener,noreferrer");
    if (done.includes(id)) return;
    setBusy(id);
    const res = await claimShareAction(id);
    setBusy(null);
    if (!res.ok) return void toast.error(res.error);
    setDone((d) => [...d, id]);
    if (res.data?.earned) toast.success(res.message);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-4">
      {channels.map(({ id, label, href, icon: Icon, tone }) => {
        const claimedToday = done.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => share(id, href)}
            disabled={busy === id}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-white/[0.06] disabled:opacity-60"
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06]", tone)}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{label}</span>
              {claimedToday ? (
                <span className="flex items-center gap-1 text-xs text-up">
                  <Check className="size-3.5" /> Earned today
                </span>
              ) : (
                <span className="text-xs font-medium text-brand-300">
                  +{LNC.rewards.share} {LNC.symbol}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Daily check-in with a 7 day streak tracker. */
export function LncCheckIn({ streak, checkedInToday }: { streak: number; checkedInToday: boolean }) {
  const router = useRouter();
  const [state, setState] = useState({ streak, checkedInToday });
  const [pending, start] = useTransition();
  const { streakDays, checkin, streakBonus } = LNC.rewards;
  const filled = state.streak === 0 ? 0 : ((state.streak - 1) % streakDays) + 1;

  const run = () =>
    start(async () => {
      const res = await checkInAction();
      if (!res.ok) return void toast.error(res.error);
      if (res.data?.earned) {
        toast.success(res.message);
        setState({ streak: res.data.streak, checkedInToday: true });
      } else setState((s) => ({ ...s, checkedInToday: true }));
      router.refresh();
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-silver">
          <Flame className={cn("size-4", state.streak > 0 ? "text-warn" : "text-muted")} />
          <span>
            <span className="font-semibold text-white">{state.streak}</span> day streak
          </span>
        </p>
        <button
          type="button"
          onClick={run}
          disabled={pending || state.checkedInToday}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
            state.checkedInToday ? "bg-up/10 text-up" : "btn-shine bg-gradient-to-b from-[#2a6bff] to-brand-600 text-white hover:-translate-y-px disabled:opacity-60",
          )}
        >
          {state.checkedInToday ? <Check className="size-4" /> : <CalendarCheck className="size-4" />}
          {state.checkedInToday ? "Checked in today" : `Check in, +${checkin} ${LNC.symbol}`}
        </button>
      </div>
      <ol className="mt-4 grid grid-cols-7 gap-1.5">
        {Array.from({ length: streakDays }, (_, i) => {
          const on = i < filled;
          const last = i === streakDays - 1;
          return (
            <li
              key={i}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border py-2 text-[11px] font-medium",
                on ? "border-brand-500/40 bg-brand-600/15 text-white" : "border-white/[0.06] bg-white/[0.02] text-muted",
              )}
            >
              <span>Day {i + 1}</span>
              <span className={cn("num font-semibold", on ? "text-brand-300" : last ? "text-warn" : "")}>+{last ? checkin + streakBonus : checkin}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2H21.5l-7.11 8.127L22.75 22h-6.555l-5.134-6.713L5.187 22H1.93l7.605-8.692L1.5 2h6.72l4.64 6.135L18.244 2Zm-1.142 18.05h1.804L7.01 3.847H5.074L17.102 20.05Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.56V4.63A20.6 20.6 0 0 0 14.25 4.5c-2.25 0-3.79 1.37-3.79 3.9v2.16H7.92v2.94h2.54V21h3.04Z" />
    </svg>
  );
}
