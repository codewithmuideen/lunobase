import type { Metadata } from "next";
import {
  Activity,
  Bot,
  Database,
  Eye,
  Fingerprint,
  KeyRound,
  Lock,
  MailCheck,
  ScrollText,
  ServerCog,
  ShieldCheck,
  Snowflake,
} from "lucide-react";
import { Container, PageHero, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Security - How Lunobase Protects Your Account and Funds",
  description:
    "Two-step email verification on every login, anti-phishing codes, manually reviewed withdrawals, breached-password protection and instant account freeze.",
  alternates: { canonical: "/security" },
};

const layers = [
  {
    icon: MailCheck,
    title: "2-step verification on every login",
    text: "After your password, we email a single-use 6-digit code that expires in 10 minutes. Admin accounts follow exactly the same rule.",
  },
  {
    icon: Fingerprint,
    title: "Anti-phishing code",
    text: "Choose a secret phrase that appears in every genuine Lunobase email. If it's missing, you know the email isn't from us.",
  },
  {
    icon: Lock,
    title: "Reviewed withdrawals",
    text: "Every withdrawal requires your password and is checked by our security team before release. Funds stay on hold during review.",
  },
  {
    icon: Snowflake,
    title: "One-tap account freeze",
    text: "Suspect something? Freeze trading and withdrawals instantly and sign out of every device, then contact support to restore access.",
  },
  {
    icon: KeyRound,
    title: "Breached-password protection",
    text: "We check new passwords against billions of leaked credentials using k-anonymity, so your password never leaves our servers.",
  },
  {
    icon: Eye,
    title: "Login history & new-device alerts",
    text: "See every sign-in with device and IP address. We email you whenever a new device accesses your account.",
  },
  {
    icon: Bot,
    title: "Bot & abuse protection",
    text: "Human verification on sign-up and login, plus rate limits on every sensitive action to stop credential stuffing and brute force.",
  },
  {
    icon: Database,
    title: "Server-side money movement",
    text: "Balances can only change through audited server functions. Trade prices are fetched by our servers, never taken from your browser.",
  },
  {
    icon: ScrollText,
    title: "Immutable ledger & audit trail",
    text: "Every balance movement is written to a permanent ledger, and every staff action is recorded in an audit log.",
  },
  {
    icon: ServerCog,
    title: "Hardened infrastructure",
    text: "TLS everywhere, strict Content-Security-Policy, HSTS, clickjacking protection and row-level data isolation per customer.",
  },
  {
    icon: Activity,
    title: "Holding period for new accounts",
    text: "New accounts have a withdrawal holding period, a standard protection against fraud and account takeover.",
  },
  {
    icon: ShieldCheck,
    title: "We'll never ask for your code",
    text: "Lunobase staff will never ask for your password, login code or recovery phrase, by email, phone or chat.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Security that works as hard as you do."
        description="Lunobase is built around one principle: your money should only move when you want it to. Here's how we make sure of that."
      />
      <section className="py-20">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layers.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-7 transition-colors hover:border-brand-500/25">
                <div className="grid size-11 place-items-center rounded-xl border border-brand-500/25 bg-brand-500/10">
                  <Icon className="size-5 text-brand-400" />
                </div>
                <h2 className="mt-5 font-display text-lg font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="pb-24">
        <Container>
          <div className="card-raised grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.5fr_1fr]">
            <SectionHeading
              align="left"
              eyebrow="Found a vulnerability?"
              title="Help us keep Lunobase safe"
              description="We welcome responsible disclosure. Email info@lunobase.com with details and we'll respond within 48 hours."
            />
            <div className="flex lg:justify-end">
              <ButtonLink href="mailto:info@lunobase.com" size="lg">
                Report an issue
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
