import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CookieSettingsLink } from "@/components/privacy/cookie-consent";

const columns = [
  {
    title: "Products",
    links: [
      { href: "/markets", label: "Markets" },
      { href: "/dashboard/trade", label: "Trade" },
      { href: "/dashboard/wallet", label: "Wallet" },
      { href: "/lunocoin", label: "LunoCoin rewards" },
      { href: "/fees", label: "Fees" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Lunobase" },
      { href: "/security", label: "Security" },
      { href: "/support", label: "Help center" },
      { href: "mailto:info@lunobase.com", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/cookies", label: "Cookie Policy" },
      { href: "/legal/risk", label: "Risk Disclosure" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo className="h-9" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate">
              Lunobase is a digital asset platform built for people who want to buy, hold and trade crypto with confidence.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                ["Payments", "payment@lunobase.com"],
                ["General", "info@lunobase.com"],
              ].map(([label, email]) => (
                <li key={email} className="flex items-center gap-3">
                  <span className="w-20 text-muted">{label}</span>
                  <a href={`mailto:${email}`} className="text-silver transition-colors hover:text-white">
                    {email}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-silver">
                <ShieldCheck className="size-3.5 text-brand-400" /> 2-step login on every sign-in
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-silver">
                <Lock className="size-3.5 text-brand-400" /> TLS 1.3 encrypted
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-white">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-slate transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/5 pt-8">
          <p className="text-xs leading-relaxed text-muted">
            <strong className="text-slate">Risk warning:</strong> Digital assets are highly volatile and can lose value. Past performance is
            not a reliable indicator of future results. Only invest what you can afford to lose, and make sure you understand the risks
            involved. Nothing on this website is financial advice. Market data is provided by third parties and may be delayed.
          </p>
          <div className="mt-6 flex flex-col justify-between gap-3 text-xs text-muted sm:flex-row">
            <p>© {new Date().getFullYear()} Lunobase. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <CookieSettingsLink className="transition-colors hover:text-white" />
              <Link href="/legal/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="/legal/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <a href="mailto:info@lunobase.com" className="transition-colors hover:text-white">
                info@lunobase.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
