import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-white/[0.06] text-silver border-white/10",
  brand: "bg-brand-500/12 text-brand-300 border-brand-500/25",
  success: "bg-up/10 text-up border-up/25",
  danger: "bg-down/10 text-down border-down/25",
  warning: "bg-warn/10 text-warn border-warn/25",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    status === "approved" || status === "completed" || status === "active" || status === "verified" || status === "answered"
      ? "success"
      : status === "rejected" || status === "suspended" || status === "closed"
        ? status === "closed"
          ? "neutral"
          : "danger"
        : status === "pending" || status === "frozen" || status === "open"
          ? "warning"
          : "neutral";
  return (
    <Badge tone={tone} dot>
      {status}
    </Badge>
  );
}
