"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Six separate digit boxes with paste support. Submits as a single hidden `code` field. */
export function OtpInput({ name = "code", onComplete, invalid }: { name?: string; onComplete?: () => void; invalid?: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (next: string[]) => {
    setDigits(next);
    if (next.every((d) => d) && onComplete) setTimeout(onComplete, 0);
  };

  const handleChange = (i: number, raw: string) => {
    const chars = raw.replace(/\D/g, "");
    if (!chars) {
      const next = [...digits];
      next[i] = "";
      setDigits(next);
      return;
    }
    const next = [...digits];
    for (let k = 0; k < chars.length && i + k < 6; k++) next[i + k] = chars[k];
    update(next);
    refs.current[Math.min(i + chars.length, 5)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3">
      <input type="hidden" name={name} value={digits.join("")} />
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            handleChange(0, e.clipboardData.getData("text"));
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={6}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            "num h-14 w-full min-w-0 rounded-xl border bg-ink-950/60 text-center font-mono text-2xl font-semibold text-white outline-none transition sm:h-16",
            invalid ? "border-down/60" : "border-white/10 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15",
            d && !invalid && "border-brand-500/50",
          )}
        />
      ))}
    </div>
  );
}
