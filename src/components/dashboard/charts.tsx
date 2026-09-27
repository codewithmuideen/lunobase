"use client";

import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatUsd } from "@/lib/utils";

/**
 * Categorical palette for dark surfaces (validated with the dataviz checker against #0E1320:
 * lightness band, chroma, CVD ≥ 8.4, normal-vision ≥ 19.3, contrast ≥ 3:1). Slot 1 is the brand blue.
 * Assigned in fixed order; anything past 7 slices folds into "Other" (slot 8 is reserved for it).
 */
export const SERIES = ["#4F7FFF", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
const SURFACE = "#0E1320";

const tooltipStyle = {
  background: "#121828",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#E7EAF2",
};

export function PortfolioChart({ data, height = 220 }: { data: { t: number; v: number }[]; height?: number }) {
  if (data.length < 2) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-white/10 text-sm text-slate" style={{ height }}>
        Your 7-day performance appears here once you hold crypto.
      </div>
    );
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F7FFF" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4F7FFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) => new Date(t).toLocaleDateString("en-US", { weekday: "short" })}
            tick={{ fill: "#6B7185", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.25)", strokeDasharray: "4 4" }}
            contentStyle={tooltipStyle}
            labelFormatter={(t) => new Date(Number(t)).toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
            formatter={(v) => [formatUsd(Number(v)), "Portfolio value"]}
          />
          <Area type="monotone" dataKey="v" stroke="#4F7FFF" strokeWidth={2} fill="url(#pf-fill)" isAnimationActive={false} activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type Slice = { label: string; value: number };

export function foldSlices(slices: Slice[], max = 7): Slice[] {
  const sorted = [...slices].filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= max + 1) return sorted;
  const head = sorted.slice(0, max);
  const rest = sorted.slice(max).reduce((s, x) => s + x.value, 0);
  return [...head, { label: "Other", value: rest }];
}

/** Allocation donut with a labelled legend (identity never relies on color alone). */
export function AllocationDonut({ slices }: { slices: Slice[] }) {
  const data = foldSlices(slices);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) {
    return <p className="py-10 text-center text-sm text-slate">No assets yet. Deposit funds to get started.</p>;
  }
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative size-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              stroke={SURFACE}
              strokeWidth={2}
              isAnimationActive={false}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={d.label} fill={d.label === "Other" ? SERIES[7] : SERIES[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => [`${formatUsd(Number(v))} · ${((Number(v) / total) * 100).toFixed(1)}%`, String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] text-muted">Assets</p>
            <p className="font-display text-xl font-bold text-white">{data.length}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm" style={{ background: d.label === "Other" ? SERIES[7] : SERIES[i] }} />
              <span className="text-silver">{d.label}</span>
            </span>
            <span className="num font-medium text-white">{((d.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Single-series daily bar chart (e.g. admin trading volume). */
export function DailyBars({ data, height = 240, label }: { data: { day: string; value: number }[]; height?: number; label: string }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
          <XAxis dataKey="day" tick={{ fill: "#6B7185", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis
            tickFormatter={(v) => formatUsd(v, { compact: true })}
            tick={{ fill: "#6B7185", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={tooltipStyle} formatter={(v) => [formatUsd(Number(v)), label]} />
          <Bar dataKey="value" fill="#4F7FFF" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
