import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 [&_svg.lucide-arrow-right]:transition-transform hover:[&_svg.lucide-arrow-right]:translate-x-0.5 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none";

const variants = {
  primary:
    "btn-shine bg-gradient-to-b from-[#2a6bff] to-brand-600 text-white shadow-[0_8px_24px_-8px_rgb(0_82_255/0.7),inset_0_1px_0_rgb(255_255_255/0.22)] hover:-translate-y-px hover:shadow-[0_14px_36px_-8px_rgb(0_82_255/0.95),0_0_0_4px_rgb(79_127_255/0.15),inset_0_1px_0_rgb(255_255_255/0.25)]",
  secondary:
    "bg-white/[0.06] text-white border border-white/10 backdrop-blur hover:bg-white/[0.1] hover:border-white/20 hover:-translate-y-px",
  light: "btn-shine bg-white text-ink-900 hover:bg-brand-50 hover:-translate-y-px hover:shadow-[0_14px_36px_-10px_rgb(255_255_255/0.45)]",
  ghost: "text-silver hover:text-white hover:bg-white/[0.05]",
  outline: "border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 hover:border-brand-500/70",
  success: "bg-up text-ink-950 hover:brightness-110",
  danger: "bg-down text-white hover:brightness-110",
  "danger-soft": "bg-down/10 text-down border border-down/25 hover:bg-down/15",
} as const;

const sizes = {
  xs: "h-7 px-2.5 text-xs rounded-lg",
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-13 px-7 text-base rounded-2xl",
  icon: "h-10 w-10 rounded-xl",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: keyof typeof variants; size?: keyof typeof sizes }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
