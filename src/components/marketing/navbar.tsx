"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, CandlestickChart, ChevronRight, Info, LifeBuoy, Receipt, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/markets", label: "Markets", icon: BarChart3, desc: "Live prices for 100+ assets" },
  { href: "/dashboard/trade", label: "Trade", icon: CandlestickChart, desc: "Buy and sell in seconds" },
  { href: "/security", label: "Security", icon: ShieldCheck, desc: "How we protect your account" },
  { href: "/fees", label: "Fees", icon: Receipt, desc: "Simple, transparent pricing" },
  { href: "/about", label: "About", icon: Info, desc: "Our mission and values" },
  { href: "/support", label: "Support", icon: LifeBuoy, desc: "Help center and contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Lock page scroll + close on Escape while the mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <nav
          className={cn(
            "pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border px-3 transition-all duration-500 sm:px-4",
            scrolled || open
              ? "h-14 border-white/10 bg-ink-900/75 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur-xl lg:h-16"
              : "h-16 border-transparent bg-transparent lg:h-[72px]",
          )}
        >
          <Logo priority className={cn("-ml-2 w-auto transition-all duration-500", scrolled ? "h-10" : "h-11 lg:h-12")} />

          {/* Desktop pill */}
          <div className="hidden items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur lg:flex">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-brand-600 text-white shadow-[0_6px_18px_-6px_rgb(0_82_255/0.9)]"
                      : "text-slate hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <ButtonLink href="/login" variant="ghost" size="sm">
              Log in
            </ButtonLink>
            <ButtonLink href="/register" size="sm" className="rounded-full px-5">
              Get started <ArrowRight className="size-4" />
            </ButtonLink>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 lg:hidden">
            {!open && (
              <ButtonLink href="/register" size="sm" className="rounded-full px-4">
                Sign up
              </ButtonLink>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/10"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Menu</span>
              <span
                className={cn(
                  "absolute h-0.5 w-5 rounded-full bg-current transition-all duration-300",
                  open ? "rotate-45" : "-translate-y-[5px]",
                )}
              />
              <span
                className={cn(
                  "absolute h-0.5 rounded-full bg-current transition-all duration-300",
                  open ? "w-5 -rotate-45" : "w-3.5 translate-x-[3px] translate-y-[5px]",
                )}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Spacer so content starts below the fixed bar */}
      <div aria-hidden className="h-[76px] lg:h-[84px]" />

      {/* Mobile sheet */}
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/90 backdrop-blur-xl" onClick={() => setOpen(false)} />
          <div aria-hidden className="bg-radial-brand pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative flex h-full flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24">
            <ul className="flex-1 space-y-2 overflow-y-auto">
              {links.map(({ href, label, icon: Icon, desc }, i) => {
                const active = pathname === href;
                return (
                  <li key={href} className="animate-fade-up" style={{ animationDelay: `${60 + i * 45}ms` }}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border p-4 transition active:scale-[0.99]",
                        active ? "border-brand-500/40 bg-brand-600/15" : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]",
                      )}
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-brand-500/25 bg-brand-500/10">
                        <Icon className="size-5 text-brand-300" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-white">{label}</span>
                        <span className="block text-sm text-slate">{desc}</span>
                      </span>
                      <ChevronRight className="size-5 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid animate-fade-up grid-cols-2 gap-3" style={{ animationDelay: "380ms" }}>
              <ButtonLink href="/login" variant="secondary" size="lg" className="rounded-2xl">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="lg" className="rounded-2xl">
                Get started
              </ButtonLink>
            </div>
            <p className="mt-4 text-center text-xs text-muted">2-step verification on every login · Reviewed withdrawals</p>
          </div>
        </div>
      )}
    </>
  );
}
