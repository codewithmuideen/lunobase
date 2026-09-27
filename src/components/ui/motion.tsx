"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades/slides children in as they scroll into view. Driven entirely by CSS
 * scroll-timelines (see `.reveal` in globals.css), so content is never hidden if JS fails.
 * `delay` staggers siblings slightly by offsetting where in the entry range they animate.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const start = Math.min(30, delay / 10);
  return (
    <div
      className={cn("reveal", className)}
      style={delay ? ({ animationRange: `entry ${start}% entry ${start + 40}%` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/** Card with a glow + border highlight that follows the cursor. */
export function Spotlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("spotlight", className)}
    >
      {children}
    </div>
  );
}
