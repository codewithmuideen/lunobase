/* eslint-disable @next/next/no-img-element */
import { ASSET_BY_SYMBOL } from "@/lib/assets";
import { cn } from "@/lib/utils";

export function CoinIcon({ src, symbol, className }: { src?: string | null; symbol: string; className?: string }) {
  if (symbol === "USD") {
    return (
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-up/15 text-sm font-bold text-up", className)}>
        $
      </span>
    );
  }
  if (src) {
    return <img src={src} alt="" loading="lazy" className={cn("size-8 shrink-0 rounded-full bg-white/5", className)} />;
  }
  const color = ASSET_BY_SYMBOL[symbol]?.color ?? "#4F7FFF";
  return (
    <span
      className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white", className)}
      style={{ background: color }}
    >
      {symbol.slice(0, 3)}
    </span>
  );
}
