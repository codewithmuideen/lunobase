import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Container, Faq, PageHero } from "@/components/marketing/section";
import { createAdminClient } from "@/lib/supabase/admin";
import { ButtonLink } from "@/components/ui/button";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Fees - Simple, Transparent Crypto Trading Fees",
  description: "No account fees, no deposit fees. One flat trading fee shown before you confirm every order on Lunobase.",
  alternates: { canonical: "/fees" },
};

async function getFees() {
  try {
    const { data } = await createAdminClient()
      .from("app_settings")
      .select("trading_fee_bps, min_deposit_usd, min_trade_usd")
      .eq("id", 1)
      .single();
    return data as { trading_fee_bps: number; min_deposit_usd: number; min_trade_usd: number };
  } catch {
    return { trading_fee_bps: 50, min_deposit_usd: 50, min_trade_usd: 5 };
  }
}

export default async function FeesPage() {
  const fees = await getFees();
  const pct = (fees.trading_fee_bps / 100).toFixed(2);

  const rows: [string, string][] = [
    ["Account opening", "Free"],
    ["Account maintenance", "Free"],
    ["Deposit (BTC, ETH, USDT)", "Free"],
    ["Buy / sell (market order)", `${pct}%`],
    ["With 1,000 LunoCoin", "20% off trading fees"],
    ["With 10,000 LunoCoin", "50% off trading fees"],
    ["Minimum order", `${fees.min_trade_usd} USDT`],
    ["Withdrawal", "Network fee only"],
  ];

  return (
    <>
      <PageHero
        eyebrow="Fees"
        title="Simple pricing. No surprises."
        description="One flat trading fee, shown before you confirm. Everything else is free."
      />
      <section className="py-20">
        <Container className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="card-raised relative overflow-hidden p-8 sm:p-10">
            <div aria-hidden className="absolute -right-20 -top-20 size-64 rounded-full bg-brand-600/25 blur-3xl" />
            <p className="eyebrow">Trading fee</p>
            <p className="num mt-4 font-display text-7xl font-extrabold tracking-tight text-white">{pct}%</p>
            <p className="mt-2 text-slate">per filled order, buy or sell</p>
            <ul className="mt-8 space-y-3">
              {["No monthly or inactivity fees", "No hidden spread markups", "Fee and total shown before every trade", "Free deposits"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-3 text-silver">
                    <span className="grid size-5 place-items-center rounded-full bg-up/15">
                      <Check className="size-3 text-up" />
                    </span>
                    {t}
                  </li>
                ),
              )}
            </ul>
            <ButtonLink href="/register" className="mt-9 w-full" size="lg">
              Start trading
            </ButtonLink>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead className="border-b border-white/5 bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-slate">Service</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate">Fee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-6 py-4 text-white">{k}</td>
                    <td className="num px-6 py-4 text-right font-semibold text-white">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
      <section className="pb-24">
        <Container className="max-w-3xl">
          <Faq
            items={[
              {
                q: "How is the trading fee calculated?",
                a: `When you buy, the fee is included in the amount you spend: spend 100 USDT and ${pct}% goes to fees, the rest buys crypto. When you sell, the fee is deducted from the USDT you receive.`,
              },
              {
                q: "Why might the executed price differ slightly from the quote?",
                a: "Crypto prices move every second. We fetch a fresh price the moment you confirm. If the price moved more than 2% since your quote, we cancel the order and ask you to review it.",
              },
              {
                q: "Are there withdrawal fees?",
                a: "We only pass on the blockchain network fee required to send your crypto. For any payment question, email payment@lunobase.com.",
              },
            ]}
          />
        </Container>
      </section>
    </>
  );
}
