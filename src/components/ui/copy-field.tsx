"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only value with a copy button. */
export function CopyField({ value, label, mono, className }: { value: string; label?: string; mono?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Please copy it manually.");
    }
  };
  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <div className={cn("min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-3 text-sm text-white", mono && "font-mono")} title={value}>
        {value}
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-[#1a63ff]"
        aria-label={label ? `Copy ${label}` : "Copy"}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
