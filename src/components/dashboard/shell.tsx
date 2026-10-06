"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ChevronDown, LogOut, Menu, Settings, ShieldCheck, ShieldHalf, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { MOBILE_TABS, NAV_SECTIONS } from "./nav-items";
import { NotificationBell } from "./notification-bell";
import { RealtimeSync } from "./realtime-sync";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  profile,
  unread: initialUnread,
  children,
}: {
  profile: Pick<Profile, "id" | "email" | "full_name" | "role" | "status" | "avatar_url">;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => setUnread(initialUnread), [initialUnread]);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5 lg:h-[72px]">
        <Logo href="/dashboard" className="-ml-2 h-11" />
      </div>
      <div className="flex-1 space-y-7 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{section.label}</p>
            <ul className="mt-2 space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active ? "bg-brand-600/12 text-white" : "text-slate hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand-500" />}
                      <Icon className={cn("size-[18px]", active ? "text-brand-400" : "text-muted group-hover:text-silver")} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {profile.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-500/[0.07] px-3 py-2.5 text-sm font-medium text-brand-200 hover:bg-brand-500/15"
          >
            <ShieldHalf className="size-[18px]" /> Admin panel
          </Link>
        )}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-brand-600/20 to-transparent p-4">
        <ShieldCheck className="size-5 text-brand-400" />
        <p className="mt-2 text-sm font-semibold text-white">Protect your account</p>
        <p className="mt-1 text-xs leading-relaxed text-slate">Set an anti-phishing code so you can spot fake emails instantly.</p>
        <Link href="/dashboard/security" className="mt-3 inline-block text-xs font-semibold text-brand-400 hover:text-brand-300">
          Open security center →
        </Link>
      </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh overflow-x-clip bg-ink-900">
      <RealtimeSync userId={profile.id} onNotification={() => setUnread((n) => n + 1)} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.05] bg-ink-950/60 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[82%] max-w-80 animate-slide-in-left border-r border-white/10 bg-ink-900 shadow-2xl">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-2 text-slate" aria-label="Close menu">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-silver lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </button>
              <Logo href="/dashboard" className="h-10 lg:hidden" />
            </div>
            <div className="flex items-center gap-2">
              {profile.status === "frozen" && (
                <span className="hidden rounded-full bg-warn/10 px-3 py-1 text-xs font-semibold text-warn sm:inline">Account frozen</span>
              )}
              <ButtonLink href="/dashboard/deposit" size="sm" className="hidden sm:inline-flex">
                <ArrowDownToLine className="size-4" /> Deposit
              </ButtonLink>
              <NotificationBell userId={profile.id} unread={unread} setUnread={setUnread} />
              <UserMenu profile={profile} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      {/* Mobile tab bar */}
      <nav className="glass fixed inset-x-0 bottom-0 z-30 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link href={href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-brand-400" : "text-muted")}>
                  <Icon className="size-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function UserMenu({ profile: p }: { profile: Pick<Profile, "id" | "email" | "full_name" | "role" | "status" | "avatar_url"> }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const onClick = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }, []);
    return (
      <div ref={ref} className="relative">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition hover:bg-white/5" aria-label="Account menu">
          <Avatar src={p.avatar_url} name={p.full_name} email={p.email} />
          <ChevronDown className="hidden size-4 text-muted sm:block" />
        </button>
        {open && (
          <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl animate-fade-up">
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
              <Avatar src={p.avatar_url} name={p.full_name} email={p.email} className="size-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{p.full_name ?? "Lunobase user"}</p>
                <p className="truncate text-xs text-slate">{p.email}</p>
              </div>
            </div>
            <div className="p-1.5">
              {[
                { href: "/dashboard/settings", label: "Settings", icon: Settings },
                { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
                ...(p.role === "admin" ? [{ href: "/admin", label: "Admin panel", icon: ShieldHalf }] : []),
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-silver hover:bg-white/5 hover:text-white">
                  <Icon className="size-4" /> {label}
                </Link>
              ))}
              <form action={signOutAction}>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-down hover:bg-down/10">
                  <LogOut className="size-4" /> Sign out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
}
