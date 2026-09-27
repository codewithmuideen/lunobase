"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn, formatPrice } from "@/lib/utils";

const RANGES = [
  { label: "24H", days: "1" },
  { label: "7D", days: "7" },
  { label: "1M", days: "30" },
  { label: "3M", days: "90" },
  { label: "1Y", days: "365" },
];

type Point = { t: number; p: number };

export function PriceChart({ coinId, height = 340, initialDays = "7" }: { coinId: string; height?: number; initialDays?: string }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<Point[] | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/api/chart/${coinId}?days=${days}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Point[]) => alive && setData(d))
      .catch(() => alive && setData([]));
    return () => {
      alive = false;
    };
  }, [coinId, days]);

  const up = data && data.length > 1 ? data[data.length - 1].p >= data[0].p : true;
  const color = up ? "#1FCF8F" : "#F6465D";
  const change = data && data.length > 1 ? ((data[data.length - 1].p - data[0].p) / data[0].p) * 100 : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="text-sm text-slate">
          {change !== null && (
            <>
              {RANGES.find((r) => r.days === days)?.label} change{" "}
              <span className={cn("num font-semibold", up ? "text-up" : "text-down")}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </span>
            </>
          )}
        </div>
        <div className="flex rounded-xl bg-white/[0.04] p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                days === r.days ? "bg-white/10 text-white" : "text-slate hover:text-white",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }}>
        {!data ? (
          <div className="skeleton h-full w-full" />
        ) : data.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-slate">Chart data is temporarily unavailable.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`pc-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t) =>
                  new Date(t).toLocaleString("en-US", days === "1" ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric" })
                }
                tick={{ fill: "#6B7185", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis
                dataKey="p"
                domain={["auto", "auto"]}
                orientation="right"
                tickFormatter={(v) => formatPrice(v)}
                tick={{ fill: "#6B7185", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={84}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4" }}
                contentStyle={{
                  background: "#121828",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString("en-US")}
                formatter={(v) => [formatPrice(Number(v)), "Price"]}
              />
              <Area type="monotone" dataKey="p" stroke={color} strokeWidth={2} fill={`url(#pc-${coinId})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
