import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CalendarDays, Cookie, FileText, Mail, ShieldCheck } from "lucide-react";
import { Container } from "@/components/marketing/section";
import { CookieSettingsLink } from "@/components/privacy/cookie-consent";
import { cn } from "@/lib/utils";

// NOTE: Template legal copy. Have a qualified lawyer review it for every jurisdiction you serve before launch.

type Section = { id: string; h: string; p: string[]; table?: { head: string[]; rows: string[][] } };
type Doc = { title: string; short: string; description: string; icon: typeof FileText; intro: string; sections: Section[] };

const UPDATED = "September 27, 2026";

const docs: Record<string, Doc> = {
  terms: {
    title: "Terms of Service",
    short: "Terms",
    icon: FileText,
    description: "The terms that govern your use of Lunobase.",
    intro: "These Terms form a binding agreement between you and Lunobase. Please read them carefully before using our services.",
    sections: [
      { id: "agreement", h: "Agreement", p: ["By creating an account or using Lunobase you agree to these Terms, our Privacy Policy and our Risk Disclosure. If you do not agree, do not use the service."] },
      { id: "eligibility", h: "Eligibility", p: ["You must be at least 18 years old and legally able to enter into contracts in your country of residence. You may not use Lunobase where it is prohibited by law or if you are subject to sanctions."] },
      { id: "account", h: "Your account & security", p: ["You are responsible for keeping your password and email account secure. Every sign-in requires a one-time code sent to your email.", "Notify us immediately of any unauthorised access. You can freeze your account at any time from Security settings."] },
      { id: "deposits", h: "Deposits", p: ["Deposits are credited after confirmation by Lunobase. We may request proof of payment and may decline deposits that cannot be verified or that appear to breach these Terms or applicable law.", "Questions about a payment, deposit or withdrawal: payment@lunobase.com."] },
      { id: "trading", h: "Trading", p: ["Orders are executed at the live market price available when your order is processed. Prices are volatile and may differ slightly from the price displayed; orders that move more than 2% are cancelled for your protection.", "Filled orders are final. A trading fee applies as shown on the Fees page and before you confirm each order."] },
      { id: "withdrawals", h: "Withdrawals", p: ["To protect customers against fraud, new accounts are subject to a withdrawal holding period shown in your dashboard.", "All withdrawals are reviewed and may require additional verification. We may delay or refuse withdrawals where required by law or where we suspect fraud."] },
      { id: "prohibited", h: "Prohibited use", p: ["You may not use Lunobase for money laundering, terrorist financing, fraud, market manipulation or any unlawful activity, nor attempt to interfere with the platform's security."] },
      { id: "suspension", h: "Suspension & termination", p: ["We may freeze or suspend accounts to comply with law, investigate suspicious activity, or protect customers and the platform. You may close your account at any time after withdrawing your funds."] },
      { id: "liability", h: "Limitation of liability", p: ["To the maximum extent permitted by law, Lunobase is not liable for losses arising from market movements, your own actions, or events beyond our reasonable control."] },
      { id: "changes", h: "Changes to these Terms", p: ["We may update these Terms. Material changes will be notified by email or in-app at least 14 days before they take effect."] },
      { id: "contact", h: "Contact", p: ["Questions about these Terms: contact@lunobase.com."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    short: "Privacy",
    icon: ShieldCheck,
    description: "How Lunobase collects, uses, shares and protects your personal data.",
    intro: "Your privacy matters. This policy explains what personal data we collect, why we collect it, and the choices and rights you have.",
    sections: [
      { id: "controller", h: "Who we are", p: ["Lunobase (\"we\", \"us\") is the controller of the personal data described in this policy. Contact us at info@lunobase.com."] },
      {
        id: "data",
        h: "Data we collect",
        p: [
          "Account data: name, email address, country and optional phone number.",
          "Financial data: balances, deposits, trades, withdrawals, wallet addresses and bank details you provide.",
          "Security data: IP address, device and browser information, login history and verification events.",
          "Support data: messages you send to our support team.",
        ],
      },
      {
        id: "use",
        h: "How we use it",
        p: [
          "To provide and secure your account, verify logins, process deposits, trades and withdrawals, prevent fraud and abuse, comply with legal obligations, and communicate with you about your account.",
          "We process data on the basis of contract (providing the service), legal obligation, legitimate interests (security and fraud prevention) and, for optional cookies, your consent.",
        ],
      },
      { id: "emails", h: "Emails", p: ["We send transactional and security emails such as verification codes, trade confirmations and deposit or withdrawal updates. You can turn off non-essential emails in Settings; security emails cannot be disabled."] },
      {
        id: "sharing",
        h: "Who we share it with",
        p: [
          "Service providers that help us run Lunobase: hosting, database and authentication (Supabase), email delivery (Resend), bot protection (Cloudflare Turnstile) and market data. They process data only on our instructions.",
          "Authorities, where we are legally required to. We never sell your personal data.",
        ],
      },
      { id: "transfers", h: "International transfers", p: ["Our providers may process data outside your country. Where required, we rely on appropriate safeguards such as standard contractual clauses."] },
      { id: "security", h: "How we protect it", p: ["Data is encrypted in transit, access is isolated per customer at the database level, every sign-in requires a one-time code, and staff actions are recorded in an audit log."] },
      { id: "retention", h: "Retention", p: ["We keep account and transaction records for as long as your account is open and afterwards for as long as the law requires (typically 5-7 years for financial records)."] },
      {
        id: "rights",
        h: "Your rights",
        p: [
          "Depending on where you live (for example under GDPR, UK GDPR or CCPA) you may have the right to access, correct, delete, restrict or port your data, object to processing, and withdraw consent at any time.",
          "To exercise your rights, email info@lunobase.com. You may also complain to your local data protection authority.",
        ],
      },
      { id: "cookies", h: "Cookies", p: ["We use strictly necessary cookies to keep you signed in and secure, and optional cookies only with your consent. See our Cookie Policy for details and to change your choices."] },
      { id: "children", h: "Children", p: ["Lunobase is not intended for anyone under 18, and we do not knowingly collect their data."] },
      { id: "changes", h: "Changes", p: ["We will notify you of material changes to this policy by email or in-app."] },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    short: "Cookies",
    icon: Cookie,
    description: "Which cookies Lunobase uses, why, and how to control them.",
    intro: "Cookies are small files stored in your browser. We keep them to a minimum: essential cookies to run the platform securely, and optional ones only if you allow them.",
    sections: [
      {
        id: "necessary",
        h: "Strictly necessary cookies",
        p: ["These are required for Lunobase to work and to keep your account secure. They can't be switched off."],
        table: {
          head: ["Name", "Purpose", "Duration"],
          rows: [
            ["sb-*-auth-token", "Keeps you signed in (Supabase authentication session)", "Session, refreshed while active"],
            ["lb_2fa", "Proves you completed the email verification code for this session", "12 hours"],
            ["lb_consent", "Remembers your cookie choices", "6 months"],
          ],
        },
      },
      {
        id: "security",
        h: "Security & bot protection",
        p: ["Cloudflare Turnstile runs the \"I am not a robot\" check on sign-in and sign-up forms. It may set short-lived cookies on Cloudflare's own domain to detect automated abuse. This is necessary to protect accounts."],
      },
      {
        id: "preferences",
        h: "Preference storage (optional)",
        p: ["With your consent we remember display choices in your browser's local storage."],
        table: { head: ["Name", "Purpose", "Duration"], rows: [["lb-hide-balance", "Remembers whether you hid your balance", "Until cleared"]] },
      },
      { id: "analytics", h: "Analytics & marketing (optional)", p: ["Lunobase currently sets no analytics or marketing cookies. If we add them in future, they will only load after you opt in, and this page will list them."] },
      { id: "control", h: "Managing your choices", p: ["Use \"Cookie settings\" at any time to change your preferences. You can also delete cookies in your browser settings, but deleting necessary cookies will sign you out."] },
    ],
  },
  risk: {
    title: "Risk Disclosure",
    short: "Risk",
    icon: AlertTriangle,
    description: "Important information about the risks of digital assets.",
    intro: "Digital assets carry significant risk. Please make sure you understand these risks before buying, selling or holding crypto-assets.",
    sections: [
      { id: "volatility", h: "Volatility", p: ["Crypto-asset prices can rise or fall sharply in a short time. You could lose some or all of the money you invest."] },
      { id: "guarantees", h: "No guarantees or advice", p: ["Past performance is not a reliable indicator of future results. Lunobase does not provide investment, tax or legal advice."] },
      { id: "liquidity", h: "Liquidity", p: ["Markets may become illiquid, and you may not be able to buy or sell when you want at the price you want."] },
      { id: "technology", h: "Technology", p: ["Blockchain networks can experience congestion, forks or failures. Transactions sent to the wrong address or network cannot be reversed."] },
      { id: "regulation", h: "Regulation", p: ["Laws governing crypto-assets vary by country and may change, which could affect your ability to use or access your assets."] },
      { id: "afford", h: "Only invest what you can afford to lose", p: ["Consider your financial situation carefully and seek independent advice if you are unsure."] },
    ],
  },
};

const ORDER = ["terms", "privacy", "cookies", "risk"];

export function generateStaticParams() {
  return ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = docs[slug];
  if (!doc) return {};
  return { title: doc.title, description: doc.description, alternates: { canonical: `/legal/${slug}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = docs[slug];
  if (!doc) notFound();
  const Icon = doc.icon;

  return (
    <div className="relative">
      <div aria-hidden className="bg-radial-brand pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div aria-hidden className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-40" />

      <Container className="relative pb-24 pt-10 sm:pt-16">
        {/* Doc switcher */}
        <nav aria-label="Legal documents" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {ORDER.map((s) => (
            <Link
              key={s}
              href={`/legal/${s}`}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition",
                s === slug ? "border-brand-500/40 bg-brand-600/15 text-white" : "border-white/[0.07] text-slate hover:border-white/15 hover:text-white",
              )}
            >
              {docs[s].title}
            </Link>
          ))}
        </nav>

        {/* Header */}
        <header className="mt-10 max-w-3xl">
          <span className="grid size-14 place-items-center rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/25 to-brand-700/10 shadow-[0_0_32px_-8px_rgb(79_127_255/0.8)]">
            <Icon className="size-7 text-brand-300" />
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{doc.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate">{doc.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-silver">
              <CalendarDays className="size-4 text-brand-400" /> Last updated {UPDATED}
            </span>
            {slug === "cookies" && (
              <CookieSettingsLink className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-1.5 font-semibold text-white transition hover:bg-[#1a63ff]" />
            )}
          </div>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          {/* Table of contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">On this page</p>
              <ol className="mt-4 space-y-1 border-l border-white/[0.07]">
                {doc.sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-slate transition hover:border-brand-500 hover:text-white">
                      <span className="num mr-2 text-muted">{String(i + 1).padStart(2, "0")}</span>
                      {s.h}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-4">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="card scroll-mt-28 p-6 sm:p-8">
                <h2 className="flex items-baseline gap-3 font-display text-xl font-semibold text-white">
                  <span className="num text-sm font-bold text-brand-400">{String(i + 1).padStart(2, "0")}</span>
                  {s.h}
                </h2>
                <div className="mt-3 space-y-3">
                  {s.p.map((para, k) => (
                    <p key={k} className="leading-relaxed text-slate">
                      {para}
                    </p>
                  ))}
                </div>
                {s.table && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">
                    <table className="w-full text-left text-sm">
                      <thead className="hidden bg-white/[0.03] text-xs text-muted sm:table-header-group">
                        <tr>
                          {s.table.head.map((h) => (
                            <th key={h} className="px-4 py-3 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((row) => (
                          <tr key={row[0]} className="flex flex-col gap-1 border-t border-white/[0.05] p-4 first:border-t-0 sm:table-row sm:p-0 sm:first:border-t">
                            <td className="font-mono text-xs text-brand-200 sm:px-4 sm:py-3">{row[0]}</td>
                            <td className="text-silver sm:px-4 sm:py-3">{row[1]}</td>
                            <td className="text-xs text-slate sm:whitespace-nowrap sm:px-4 sm:py-3 sm:text-sm">
                              <span className="sm:hidden">Duration: </span>
                              {row[2]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}

            <div className="flex flex-col items-start gap-4 rounded-2xl border border-brand-500/20 bg-brand-600/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-brand-400" />
                <p className="text-sm text-silver">Questions about this document? Email us, we&apos;re happy to help.</p>
              </div>
              <a href="mailto:contact@lunobase.com" className="text-sm font-semibold text-brand-300 hover:text-brand-200">
                contact@lunobase.com →
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
