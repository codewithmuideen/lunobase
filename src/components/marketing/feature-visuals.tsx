import { ArrowDownLeft, Bell, CheckCircle2, Coins, ShieldCheck } from "lucide-react";

/* Illustrative product visuals for the marketing "Why Lunobase" section.
   All data is generated deterministically so server and client render identical markup. */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Candle = { o: number; h: number; l: number; c: number; v: number };

function makeCandles(count: number): Candle[] {
  const rand = seeded(42);
  const out: Candle[] = [];
  let price = 81200;
  for (let i = 0; i < count; i++) {
    const drift = i > count * 0.55 ? 90 : i > count * 0.3 ? -25 : 35; // dip, then a clean breakout
    const o = price;
    const c = o + drift * 1.4 + (rand() - 0.5) * 1100;
    const h = Math.max(o, c) + rand() * 380;
    const l = Math.min(o, c) - rand() * 380;
    out.push({ o, h, l, c, v: 0.35 + rand() * 0.65 + (Math.abs(c - o) / 1100) * 0.6 });
    price = c;
  }
  return out;
}

const CANDLES = makeCandles(38);
const UP = "#1FCF8F";
const DOWN = "#F6465D";

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Mini trading terminal: candles, volume, price axis, last-price line and an order ticket. */
export function TerminalPreview() {
  const W = 640;
  const H = 300;
  const axisW = 64;
  const chartH = 220;
  const volTop = 238;
  const volH = 52;
  const plotW = W - axisW;
  const min = Math.min(...CANDLES.map((c) => c.l));
  const max = Math.max(...CANDLES.map((c) => c.h));
  const pad = (max - min) * 0.08;
  const lo = min - pad;
  const hi = max + pad;
  const y = (p: number) => 12 + (1 - (p - lo) / (hi - lo)) * (chartH - 12);
  const step = plotW / CANDLES.length;
  const bw = step * 0.66;
  const maxV = Math.max(...CANDLES.map((c) => c.v));
  const last = CANDLES[CANDLES.length - 1];
  const first = CANDLES[0];
  const change = ((last.c - first.o) / first.o) * 100;
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / 5).filter((t) => Math.abs(y(t) - y(last.c)) > 16);

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-950/80 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)]">
      {/* Terminal header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-[#F7931A] text-[11px] font-bold text-white">₿</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">BTC / USD</p>
            <p className="text-[11px] text-muted">Bitcoin · Spot</p>
          </div>
          <div className="ml-2 hidden leading-tight sm:block">
            <p className="num text-sm font-semibold text-up">{fmt(last.c)}</p>
            <p className="num text-[11px] text-up">+{change.toFixed(2)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-0.5 text-[11px] font-semibold">
          {["15m", "1H", "4H", "1D"].map((t) => (
            <span key={t} className={t === "1H" ? "rounded-md bg-white/10 px-2 py-1 text-white" : "px-2 py-1 text-muted"}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Illustrative BTC/USD candlestick chart">
          <defs>
            <linearGradient id="tp-glow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={UP} stopOpacity="0.12" />
              <stop offset="100%" stopColor={UP} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + price axis */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
              <text x={W - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#6B7185" className="num">
                {Math.round(t).toLocaleString("en-US")}
              </text>
            </g>
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={i} x1={(plotW / 6) * (i + 0.5)} x2={(plotW / 6) * (i + 0.5)} y1={8} y2={H - 6} stroke="rgba(255,255,255,0.03)" />
          ))}
          <line x1={plotW} x2={plotW} y1={0} y2={H} stroke="rgba(255,255,255,0.06)" />
          <line x1={0} x2={plotW} y1={volTop - 6} y2={volTop - 6} stroke="rgba(255,255,255,0.05)" />


          {/* candles */}
          {CANDLES.map((c, i) => {
            const x = i * step + step / 2;
            const up = c.c >= c.o;
            const color = up ? UP : DOWN;
            const top = y(Math.max(c.o, c.c));
            const bodyH = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
            const vh = (c.v / maxV) * volH;
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1.1" />
                <rect x={x - bw / 2} y={top} width={bw} height={bodyH} rx="1" fill={color} />
                <rect x={x - bw / 2} y={volTop + volH - vh} width={bw} height={vh} rx="1" fill={color} opacity="0.28" />
              </g>
            );
          })}

          {/* last price line + tag */}
          <line x1={0} x2={plotW} y1={y(last.c)} y2={y(last.c)} stroke={UP} strokeDasharray="3 3" strokeOpacity="0.7" />
          <rect x={plotW + 2} y={y(last.c) - 9} width={axisW - 4} height={18} rx="4" fill={UP} />
          <text x={plotW + axisW / 2} y={y(last.c) + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#06080E" className="num">
            {Math.round(last.c).toLocaleString("en-US")}
          </text>

          {/* crosshair on a recent candle */}
          <line x1={(CANDLES.length - 9) * step + step / 2} x2={(CANDLES.length - 9) * step + step / 2} y1={8} y2={H - 6} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
          <text x={6} y={H - 8} fontSize="9.5" fill="#6B7185">
            Vol
          </text>
        </svg>

        {/* Order ticket */}
        <div className="glass absolute bottom-[26%] left-3 hidden w-52 rounded-xl p-3 shadow-2xl sm:block">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-950/70 p-0.5 text-[11px] font-semibold">
            <span className="rounded-md bg-up py-1 text-center text-ink-950">Buy</span>
            <span className="py-1 text-center text-muted">Sell</span>
          </div>
          <div className="mt-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted">Spend</span>
              <span className="num font-semibold text-white">$2,500.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Receive</span>
              <span className="num text-silver">0.02941 BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fee</span>
              <span className="num text-silver">$12.44</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-up py-1.5 text-[11px] font-bold text-ink-950">
            <CheckCircle2 className="size-3.5" /> Order filled
          </div>
        </div>
      </div>
    </div>
  );
}

/** Balance that updates in real time with a stream of confirmed events. */
export function RealtimePreview() {
  const events = [
    { icon: ArrowDownLeft, tone: "bg-up/15 text-up", title: "Deposit confirmed", sub: "Bank transfer · just now", amount: "+$2,500.00", fresh: true },
    { icon: Coins, tone: "bg-brand-500/15 text-brand-300", title: "Buy order filled", sub: "BTC/USD · 2m ago", amount: "+0.0294 BTC" },
    { icon: ShieldCheck, tone: "bg-white/[0.06] text-silver", title: "Login verified", sub: "Email code · 1h ago", amount: "" },
  ];
  return (
    <div className="mt-8 space-y-3">
      <div className="rounded-2xl border border-white/[0.07] bg-ink-950/80 p-4">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Total balance</span>
          <span className="inline-flex items-center gap-1.5 text-up">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-up opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-up" />
            </span>
            Live
          </span>
        </div>
        <p className="num mt-1.5 font-display text-3xl font-bold tracking-tight text-white">$24,583.20</p>
        <p className="num mt-0.5 text-xs font-medium text-up">+$2,500.00 just now</p>
      </div>
      {events.map(({ icon: Icon, tone, title, sub, amount, fresh }) => (
        <div
          key={title}
          className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${fresh ? "border-up/25 bg-up/[0.06]" : "border-white/[0.06] bg-white/[0.02] opacity-80"}`}
        >
          <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{title}</p>
            <p className="truncate text-[11px] text-muted">{sub}</p>
          </div>
          {amount && <span className={`num text-[13px] font-semibold ${fresh ? "text-up" : "text-white"}`}>{amount}</span>}
        </div>
      ))}
    </div>
  );
}

/** Multi-asset wallet list. */
export function WalletPreview() {
  const rows = [
    { s: "BTC", n: "Bitcoin", c: "#F7931A", amt: "0.2841", val: "$24,050.12" },
    { s: "ETH", n: "Ethereum", c: "#627EEA", amt: "3.1200", val: "$8,442.66" },
    { s: "SOL", n: "Solana", c: "#9945FF", amt: "42.500", val: "$5,248.10" },
    { s: "USD", n: "Cash", c: "#1FCF8F", amt: "", val: "$1,920.00" },
  ];
  return (
    <div className="mt-7 divide-y divide-white/[0.05] rounded-2xl border border-white/[0.07] bg-ink-950/70">
      {rows.map((r) => (
        <div key={r.s} className="flex items-center gap-3 px-4 py-3">
          <span className="grid size-7 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: r.c }}>
            {r.s === "USD" ? "$" : r.s[0]}
          </span>
          <div className="flex-1 leading-tight">
            <p className="text-[13px] font-semibold text-white">{r.s}</p>
            <p className="text-[11px] text-muted">{r.n}</p>
          </div>
          <div className="text-right leading-tight">
            <p className="num text-[13px] font-semibold text-white">{r.val}</p>
            {r.amt && <p className="num text-[11px] text-muted">{r.amt}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Allocation bar + 7-day performance line. */
export function InsightsPreview() {
  const alloc = [
    { s: "BTC", p: 60.5, c: "#4F7FFF" },
    { s: "ETH", p: 21.2, c: "#d95926" },
    { s: "SOL", p: 13.2, c: "#199e70" },
    { s: "USD", p: 5.1, c: "#c98500" },
  ];
  const rand = seeded(7);
  const pts = Array.from({ length: 28 }, (_, i) => 40 + i * 1.4 + (rand() - 0.5) * 10);
  const minP = Math.min(...pts);
  const maxP = Math.max(...pts);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${(i / (pts.length - 1)) * 240},${56 - ((p - minP) / (maxP - minP)) * 50}`).join(" ");
  return (
    <div className="mt-7 rounded-2xl border border-white/[0.07] bg-ink-950/70 p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] text-muted">7-day performance</p>
          <p className="num text-lg font-bold text-white">+8.42%</p>
        </div>
        <span className="rounded-md bg-up/10 px-2 py-0.5 text-[11px] font-semibold text-up">+$3,071.40</span>
      </div>
      <svg viewBox="0 0 240 60" className="mt-2 h-14 w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="ip-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4F7FFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4F7FFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L240,60 L0,60 Z`} fill="url(#ip-fill)" />
        <path d={line} fill="none" stroke="#4F7FFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {alloc.map((a) => (
          <span key={a.s} style={{ width: `${a.p}%`, background: a.c }} />
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1 text-[11px]">
        {alloc.map((a) => (
          <span key={a.s} className="flex items-center gap-1 text-silver">
            <span className="size-2 rounded-sm" style={{ background: a.c }} />
            {a.s} <span className="num text-muted">{Math.round(a.p)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Stacked notification cards. */
export function NotifyPreview() {
  const items = [
    { t: "Deposit confirmed", b: "2,500.00 USD added to your wallet", time: "now" },
    { t: "Buy order filled", b: "0.0294 BTC @ $84,982.10", time: "2m" },
    { t: "New device sign-in", b: "Chrome on Windows · verified", time: "1h" },
  ];
  return (
    <div className="relative mt-7 h-[196px]">
      {items.map((n, i) => (
        <div
          key={n.t}
          className="absolute inset-x-0 rounded-2xl border border-white/[0.08] bg-ink-800 p-3.5 shadow-xl"
          style={{ top: i * 58, transform: `scale(${1 - i * 0.04})`, opacity: 1 - i * 0.22, zIndex: 3 - i }}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600/20">
              <Bell className="size-4 text-brand-300" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-white">{n.t}</p>
                <span className="text-[10px] text-muted">{n.time}</span>
              </div>
              <p className="truncate text-[11px] text-slate">{n.b}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
