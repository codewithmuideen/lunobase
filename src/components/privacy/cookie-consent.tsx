"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Check, Cookie, Lock, Megaphone, SlidersHorizontal, X } from "lucide-react";
import { OPEN_SETTINGS_EVENT, readConsent, writeConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

type Prefs = { preferences: boolean; analytics: boolean; marketing: boolean };

const CATEGORIES: { key: keyof Prefs | "necessary"; title: string; text: string; icon: typeof Lock }[] = [
  {
    key: "necessary",
    title: "Strictly necessary",
    text: "Keep you signed in, protect your account (login verification, bot protection) and remember this choice. Always on.",
    icon: Lock,
  },
  {
    key: "preferences",
    title: "Preferences",
    text: "Remember display choices such as hiding your balance or your favourite markets.",
    icon: SlidersHorizontal,
  },
  {
    key: "analytics",
    title: "Analytics",
    text: "Help us understand how Lunobase is used so we can improve it. Aggregated and never sold.",
    icon: BarChart3,
  },
  {
    key: "marketing",
    title: "Marketing",
    text: "Measure our campaigns and show relevant Lunobase offers on other sites.",
    icon: Megaphone,
  },
];

export function CookieConsent() {
  const [banner, setBanner] = useState(false);
  const [panel, setPanel] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ preferences: true, analytics: false, marketing: false });

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setPrefs({ preferences: existing.preferences, analytics: existing.analytics, marketing: existing.marketing });
    } else {
      const t = setTimeout(() => setBanner(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const open = () => {
      const c = readConsent();
      if (c) setPrefs({ preferences: c.preferences, analytics: c.analytics, marketing: c.marketing });
      setPanel(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (!panel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const save = (p: Prefs) => {
    writeConsent(p);
    setPrefs(p);
    setBanner(false);
    setPanel(false);
  };

  return (
    <>
      {banner && !panel && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[60] animate-fade-up sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[420px]"
        >
          <div className="ring-gradient relative overflow-hidden rounded-3xl bg-ink-850/95 p-5 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] backdrop-blur-2xl sm:p-6">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand-600/25 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/25 to-brand-700/10 shadow-[0_0_24px_-6px_rgb(79_127_255/0.7)]">
                <Cookie className="size-5 text-brand-300" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-white">We value your privacy</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">
                  We use essential cookies to keep you signed in and secure. With your permission we&apos;d also use optional cookies to improve
                  Lunobase. Read our{" "}
                  <Link href="/legal/cookies" className="text-brand-400 underline-offset-2 hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => save({ preferences: false, analytics: false, marketing: false })}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Reject optional
              </button>
              <button
                onClick={() => save({ preferences: true, analytics: true, marketing: true })}
                className="btn-shine h-11 rounded-xl bg-gradient-to-b from-[#2a6bff] to-brand-600 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(0_82_255/0.8)] transition hover:shadow-[0_12px_30px_-8px_rgb(0_82_255/1)]"
              >
                Accept all
              </button>
            </div>
            <button
              onClick={() => setPanel(true)}
              className="relative mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-slate transition hover:text-white"
            >
              <SlidersHorizontal className="size-3.5" /> Customize choices
            </button>
          </div>
        </div>
      )}

      {panel && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-md" onClick={() => setPanel(false)} />
          <div className="ring-gradient relative flex max-h-[92dvh] w-full animate-fade-up flex-col overflow-hidden rounded-t-3xl bg-ink-850 shadow-2xl sm:max-w-xl sm:rounded-3xl">
            <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 size-64 rounded-full bg-brand-600/20 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4 border-b border-white/5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/15">
                  <Cookie className="size-5 text-brand-300" />
                </span>
                <div>
                  <h2 id="cookie-title" className="font-display text-lg font-bold text-white">
                    Privacy preferences
                  </h2>
                  <p className="text-xs text-slate">Choose which cookies Lunobase may use.</p>
                </div>
              </div>
              <button onClick={() => setPanel(false)} className="rounded-lg p-2 text-slate transition hover:bg-white/5 hover:text-white" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>

            <ul className="relative flex-1 space-y-2.5 overflow-y-auto p-5 sm:p-6">
              {CATEGORIES.map(({ key, title, text, icon: Icon }) => {
                const locked = key === "necessary";
                const on = locked || prefs[key as keyof Prefs];
                return (
                  <li
                    key={key}
                    className={cn(
                      "flex items-start gap-4 rounded-2xl border p-4 transition",
                      on ? "border-brand-500/25 bg-brand-500/[0.06]" : "border-white/[0.07] bg-white/[0.02]",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
                      <Icon className="size-4 text-brand-300" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
                        {title}
                        {locked && <span className="rounded-full bg-up/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-up">Always on</span>}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate">{text}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={on}
                      aria-label={title}
                      disabled={locked}
                      onClick={() => !locked && setPrefs((p) => ({ ...p, [key]: !p[key as keyof Prefs] }))}
                      className={cn(
                        "relative mt-1 h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed",
                        on ? "bg-brand-600 shadow-[0_0_16px_-2px_rgb(0_82_255/0.8)]" : "bg-white/15",
                        locked && "opacity-60",
                      )}
                    >
                      <span className={cn("absolute top-0.5 grid size-5 place-items-center rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")}>
                        {on && <Check className="size-3 text-brand-600" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="relative grid gap-2 border-t border-white/5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:grid-cols-3 sm:p-6">
              <button
                onClick={() => save({ preferences: false, analytics: false, marketing: false })}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Reject optional
              </button>
              <button onClick={() => save(prefs)} className="h-11 rounded-xl border border-brand-500/40 bg-brand-500/10 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/20">
                Save choices
              </button>
              <button
                onClick={() => save({ preferences: true, analytics: true, marketing: true })}
                className="btn-shine h-11 rounded-xl bg-gradient-to-b from-[#2a6bff] to-brand-600 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(0_82_255/0.8)]"
              >
                Accept all
              </button>
            </div>
            <p className="relative px-6 pb-5 text-center text-[11px] text-muted">
              You can change this any time from &ldquo;Cookie settings&rdquo; in the footer. See our{" "}
              <Link href="/legal/privacy" className="text-brand-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))} className={className}>
      Cookie settings
    </button>
  );
}
