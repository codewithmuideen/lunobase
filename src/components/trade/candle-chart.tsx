"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { cn } from "@/lib/utils";

type Candle = { time: number; open: number; high: number; low: number; close: number };

const RANGES = [
  { label: "1D", days: "1" },
  { label: "7D", days: "7" },
  { label: "1M", days: "30" },
  { label: "3M", days: "90" },
  { label: "1Y", days: "365" },
];

export function CandleChart({ coinId, livePrice }: { coinId: string; livePrice?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Area"> | null>(null);
  const lastRef = useRef<Candle | null>(null);
  const [days, setDays] = useState("1");
  const [kind, setKind] = useState<"candles" | "line">("candles");
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  // Create chart once
  useEffect(() => {
    if (!el.current) return;
    const chart = createChart(el.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6B7185",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.25)", labelBackgroundColor: "#1B2339" },
        horzLine: { color: "rgba(255,255,255,0.25)", labelBackgroundColor: "#1B2339" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Load data when coin / range / type changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    let alive = true;
    setStatus("loading");

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    const url = kind === "candles" ? `/api/chart/${coinId}?days=${days}&type=candles` : `/api/chart/${coinId}?days=${days}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: unknown[]) => {
        if (!alive || !chartRef.current) return;
        if (!rows.length) {
          setStatus("empty");
          return;
        }
        if (kind === "candles") {
          const s = chart.addSeries(CandlestickSeries, {
            upColor: "#1FCF8F",
            downColor: "#F6465D",
            borderVisible: false,
            wickUpColor: "#1FCF8F",
            wickDownColor: "#F6465D",
          });
          const data = (rows as Candle[]).map((c) => ({ ...c, time: c.time as UTCTimestamp }));
          s.setData(data);
          lastRef.current = data[data.length - 1];
          seriesRef.current = s;
        } else {
          const pts = rows as { t: number; p: number }[];
          const up = pts[pts.length - 1].p >= pts[0].p;
          const s = chart.addSeries(AreaSeries, {
            lineColor: up ? "#1FCF8F" : "#F6465D",
            topColor: up ? "rgba(31,207,143,0.25)" : "rgba(246,70,93,0.25)",
            bottomColor: "rgba(0,0,0,0)",
            lineWidth: 2,
          });
          const seen = new Set<number>();
          s.setData(
            pts
              .map((p) => ({ time: Math.floor(p.t / 1000) as UTCTimestamp, value: p.p }))
              .filter((p) => (seen.has(p.time) ? false : (seen.add(p.time), true))),
          );
          lastRef.current = null;
          seriesRef.current = s;
        }
        chart.timeScale().fitContent();
        setStatus("ready");
      })
      .catch(() => alive && setStatus("empty"));

    return () => {
      alive = false;
    };
  }, [coinId, days, kind]);

  // Nudge the last candle with the live price
  useEffect(() => {
    const s = seriesRef.current;
    const last = lastRef.current;
    if (!s || !last || !livePrice || kind !== "candles") return;
    const next = { ...last, close: livePrice, high: Math.max(last.high, livePrice), low: Math.min(last.low, livePrice) };
    (s as ISeriesApi<"Candlestick">).update({ ...next, time: next.time as UTCTimestamp });
    lastRef.current = next;
  }, [livePrice, kind]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <div className="flex gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                days === r.days ? "bg-white/10 text-white" : "text-muted hover:text-white",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-md bg-white/[0.04] p-0.5">
          {(["candles", "line"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn("rounded px-2.5 py-1 text-xs font-medium capitalize transition", kind === k ? "bg-white/10 text-white" : "text-muted")}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={el} className="absolute inset-0" />
        {status !== "ready" && (
          <div className="absolute inset-0 grid place-items-center">
            {status === "loading" ? (
              <div className="size-6 animate-spin rounded-full border-2 border-white/10 border-t-brand-500" />
            ) : (
              <p className="text-sm text-slate">Chart data is temporarily unavailable.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
