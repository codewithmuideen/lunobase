import type { FearGreed } from "@/lib/market";
import { Sparkline } from "@/components/market/sparkline";

function tone(v: number) {
  return v < 25 ? "Extreme fear" : v < 45 ? "Fear" : v < 55 ? "Neutral" : v < 75 ? "Greed" : "Extreme greed";
}

/** Semi-circular gauge. Status colours always come with a text label. */
export function FearGreedCard({ data }: { data: FearGreed | null }) {
  if (!data) {
    return (
      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-white">Fear &amp; Greed Index</h2>
        <p className="py-10 text-center text-sm text-slate">Market sentiment is temporarily unavailable.</p>
      </section>
    );
  }
  const v = Math.min(100, Math.max(0, data.value));
  // needle angle: 0 -> left (180deg), 100 -> right (0deg)
  const a = Math.PI * (1 - v / 100);
  const cx = 100, cy = 100, r = 78;
  const nx = cx + Math.cos(a) * (r - 14);
  const ny = cy - Math.sin(a) * (r - 14);
  const arc = (from: number, to: number) => {
    const p = (pct: number) => [cx + Math.cos(Math.PI * (1 - pct / 100)) * r, cy - Math.sin(Math.PI * (1 - pct / 100)) * r];
    const [x1, y1] = p(from), [x2, y2] = p(to);
    return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
  };
  const rows: [string, number | null][] = [["Yesterday", data.yesterday], ["Last week", data.lastWeek], ["Last month", data.lastMonth]];

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Fear &amp; Greed Index</h2>
        <span className="text-xs text-muted">Updated daily</span>
      </div>
      <div className="mt-4 grid items-center gap-6 sm:grid-cols-2">
        <div>
          <svg viewBox="0 0 200 112" className="mx-auto w-full max-w-[260px]" role="img" aria-label={`Fear and Greed index ${v}, ${tone(v)}`}>
            <path d={arc(0, 33)} fill="none" stroke="#F6465D" strokeWidth="12" strokeLinecap="round" />
            <path d={arc(36, 64)} fill="none" stroke="#F5B544" strokeWidth="12" strokeLinecap="round" />
            <path d={arc(67, 100)} fill="none" stroke="#1FCF8F" strokeWidth="12" strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="5" fill="#fff" />
          </svg>
          <p className="num -mt-2 text-center font-display text-4xl font-bold text-white">{v}</p>
          <p className="text-center text-sm font-medium text-silver">{tone(v)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Last 30 days</p>
          <div className="mt-2">
            <Sparkline data={data.history.map((h) => h.v)} width={260} height={64} positive={v >= 50} responsive />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {rows.map(([k, n]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-slate">{k}</dt>
                <dd className="num text-white">{n === null ? "-" : `${n} · ${tone(n)}`}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="mt-5 rounded-xl bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-slate">
        A measure of overall market mood, not a prediction. Extreme fear can mean prices are low; extreme greed can mean the market is
        overheated. This is not financial advice.
      </p>
    </section>
  );
}
