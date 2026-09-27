import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[44px] lg:leading-[1.1]">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-slate sm:text-lg">{description}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div aria-hidden className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
      <div aria-hidden className="bg-radial-brand absolute inset-0" />
      <Container className="relative py-16 sm:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">{description}</p>}
      </Container>
    </section>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-white/5 rounded-2xl border border-white/[0.06] bg-ink-850/60">
      {items.map((item) => (
        <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-medium text-white">
            {item.q}
            <ChevronDown className="size-5 shrink-0 text-slate transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 pr-10 text-sm leading-relaxed text-slate">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
