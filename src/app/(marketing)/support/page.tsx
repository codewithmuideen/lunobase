import type { Metadata } from "next";
import { Building2, Clock, CreditCard, LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { Container, Faq, PageHero } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Help Center & Support",
  description: "Get help with your Lunobase account, deposits, trading and withdrawals.",
  alternates: { canonical: "/support" },
};

const faq = [
  {
    q: "I didn't receive my login code",
    a: "Codes arrive within a minute. Check your spam folder and search for 'Lunobase'. You can request a new code after 45 seconds. Each code expires after 10 minutes.",
  },
  {
    q: "My deposit hasn't appeared yet",
    a: "Crypto deposits need network confirmations, which usually take a few minutes to an hour. Once confirmed, your balance updates automatically. If it's been longer, open a ticket with your transaction reference.",
  },
  {
    q: "How do withdrawals work?",
    a: "Withdrawal any time, there is no waiting period. Withdrawals is automatic. If your request is taking long, open a support ticket or email payment@lunobase.com.",
  },
  {
    q: "How do I secure my account?",
    a: "Use a unique password, set an anti-phishing code under Security, and review your login history regularly. If anything looks wrong, use 'Freeze account' to lock everything instantly.",
  },
  {
    q: "How do I close my account?",
    a: "Withdraw your funds, then open a support ticket with the category 'Account'. We'll confirm your identity and close the account.",
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHero eyebrow="Help center" title="How can we help?" description="Answers to common questions, and a real team when you need one." />
      <section className="py-20">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: MessageSquare, title: "Support tickets", text: "The fastest way to reach us. Sign in and open a ticket from your dashboard.", cta: { href: "/dashboard/support", label: "Open a ticket" } },
              { icon: Mail, title: "Email", text: "Prefer email? Write to info@lunobase.com from your registered address.", cta: { href: "mailto:info@lunobase.com", label: "Email support" } },
              { icon: LifeBuoy, title: "Security emergency", text: "Think your account is compromised? Freeze it instantly from Security settings.", cta: { href: "/dashboard/security", label: "Go to Security" } },
            ].map(({ icon: Icon, title, text, cta }) => (
              <div key={title} className="card flex flex-col p-7">
                <Icon className="size-6 text-brand-400" />
                <h2 className="mt-4 font-display text-lg font-semibold text-white">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{text}</p>
                <ButtonLink href={cta.href} variant="secondary" size="sm" className="mt-6 self-start">
                  {cta.label}
                </ButtonLink>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-slate">
            <Clock className="size-4" /> Our team typically replies within a few hours, 7 days a week.
          </p>

          <div className="mt-14">
            <h2 className="font-display text-2xl font-bold text-white">Contact directory</h2>
            <p className="mt-2 text-slate">Write to the right team and you&apos;ll get an answer faster. Always email us from your registered address.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { icon: CreditCard, title: "Payments", email: "payment@lunobase.com", text: "Deposits, transaction hashes and withdrawal payouts." },
                { icon: Building2, title: "Support & general enquiries", email: "info@lunobase.com", text: "Account access, login codes, trading questions, withdrawal requests and everything else." },
              ].map(({ icon: Icon, title, email, text }) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="group card flex flex-col p-6 transition duration-300 hover:-translate-y-0.5 hover:border-brand-500/35"
                >
                  <span className="grid size-11 place-items-center rounded-xl border border-brand-500/25 bg-brand-500/10">
                    <Icon className="size-5 text-brand-400" />
                  </span>
                  <p className="mt-4 font-semibold text-white">{title}</p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-slate">{text}</p>
                  <p className="mt-5 inline-flex items-center gap-2 break-all text-sm font-semibold text-brand-300 group-hover:text-brand-200">
                    <Mail className="size-4 shrink-0" /> {email}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </Container>
      </section>
      <section className="pb-24">
        <Container className="max-w-3xl">
          <h2 className="mb-6 font-display text-2xl font-bold text-white">Frequently asked questions</h2>
          <Faq items={faq} />
        </Container>
      </section>
    </>
  );
}
