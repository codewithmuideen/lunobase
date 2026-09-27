import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Change({
  value,
  className,
  pill,
  icon,
}: {
  value: number | null | undefined;
  className?: string;
  pill?: boolean;
  icon?: boolean;
}) {
  const n = Number(value ?? 0);
  const up = n >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 font-medium",
        up ? "text-up" : "text-down",
        pill && (up ? "rounded-md bg-up/10 px-1.5 py-0.5" : "rounded-md bg-down/10 px-1.5 py-0.5"),
        className,
      )}
    >
      {icon && <Icon className="size-3.5" aria-hidden />}
      {up ? "+" : ""}
      {n.toFixed(2)}%
    </span>
  );
}
