import type { Metadata } from "next";
import Image from "next/image";
import { Compass, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { Container, PageHero, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Lunobase - Our Mission",
  description: "Lunobase makes digital assets simple, secure and accessible for everyone.",
  alternates: { canonical: "/about" },
};

const values = [
  { icon: ShieldCheck, title: "Security first", text: "Every product decision starts with one question: does this keep our customers safe?" },
  { icon: Sparkles, title: "Radically simple", text: "Crypto is complex. Using it shouldn't be. We sweat the details so you don't have to." },
  { icon: HeartHandshake, title: "Honest by default", text: "Clear fees, clear risks, clear answers. No jargon, no fine-print surprises." },
  { icon: Compass, title: "Built for the long run", text: "We're building infrastructure people can rely on for decades, not hype for a season." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Making digital assets simple, secure and open to everyone."
        description="Lunobase exists to give people a trustworthy home for their crypto: a platform that's easy on day one and dependable every day after."
      />
      <section className="py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/10">
            <Image src="/brand/wave.png" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 grid place-items-center">
              <Image src="/brand/mark-white.png" alt="Lunobase" width={180} height={180} className="drop-shadow-2xl" />
            </div>
          </div>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our story"
              title="Built for trust, from the first line of code."
              description="We started Lunobase because buying crypto still felt harder and riskier than it should. So we built the platform we wanted: live prices, a clean dashboard, human support, and security that's on by default for every single account."
            />
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/register" size="lg">
                Join Lunobase
              </ButtonLink>
              <a href="mailto:info@lunobase.com" className="text-sm font-semibold text-brand-300 hover:text-brand-200">
                info@lunobase.com
              </a>
            </div>
          </div>
        </Container>
      </section>
      <section className="pb-24">
        <Container>
          <SectionHeading eyebrow="What we believe" title="Our values" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-7">
                <Icon className="size-6 text-brand-400" />
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
