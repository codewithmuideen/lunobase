"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  BadgeCheck,
  CandlestickChart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

export type AdminCounts = { deposits: number; withdrawals: number; tickets: number; kyc: number };

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine, count: "deposits" as const },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine, count: "withdrawals" as const },
  { href: "/admin/kyc", label: "Verification", icon: BadgeCheck, count: "kyc" as const },
  { href: "/admin/trades", label: "Trades", icon: CandlestickChart },
  { href: "/admin/tickets", label: "Support", icon: LifeBuoy, count: "tickets" as const },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/settings", label: "Platform settings", icon: Settings },
];

export function AdminShell({ email, counts, children }: { email: string; counts: AdminCounts; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Live queue: new deposits, withdrawal requests and tickets appear instantly.
  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };
    const channel = supabase
      .channel("admin-queue")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deposits" }, () => {
        toast("New deposit awaiting confirmation");
        refresh();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "withdrawals" }, () => {
        toast("New withdrawal request");
        refresh();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, () => {
        toast("New support ticket");
        refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets" }, refresh)
      .subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo href="/admin" className="-ml-2 h-10" />
        <span className="rounded-md bg-brand-600/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-300">Admin</span>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, icon: Icon, count }) => {
          const n = count ? counts[count] : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active(href) ? "bg-brand-600/12 text-white" : "text-slate hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon className={cn("size-[18px]", active(href) ? "text-brand-400" : "text-muted")} />
                <span className="flex-1">{label}</span>
                {n > 0 && <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-bold text-warn">{n}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1 border-t border-white/5 p-3">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate hover:bg-white/[0.04] hover:text-white">
          <ArrowLeft className="size-4" /> Back to app
        </Link>
        <form action={signOutAction}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-down hover:bg-down/10">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
        <p className="truncate px-3 pt-1 text-xs text-muted">{email}</p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh overflow-x-clip">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.05] bg-ink-950/70 lg:block">{nav}</aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[82%] max-w-80 animate-slide-in-left border-r border-white/10 bg-ink-900 shadow-2xl">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 p-2 text-slate" aria-label="Close menu">
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-x-0 border-t-0 px-4 lg:hidden">
          <button onClick={() => setDrawer(true)} className="p-2 text-silver" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Logo href="/admin" className="-ml-2 h-10" />
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
