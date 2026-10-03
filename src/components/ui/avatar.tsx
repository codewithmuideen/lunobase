/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

export function initialsOf(name: string | null | undefined, email: string) {
  const src = name?.trim() || email;
  return src
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Circular user avatar: the uploaded photo if there is one, otherwise the user's initials. */
export function Avatar({
  src,
  name,
  email,
  className,
}: {
  src?: string | null;
  name?: string | null;
  email: string;
  className?: string;
}) {
  const base = "inline-grid size-9 shrink-0 select-none place-items-center overflow-hidden rounded-full ring-1 ring-white/15";
  if (src) {
    return <img src={src} alt={name ?? "Profile photo"} className={cn(base, "bg-ink-800 object-cover", className)} />;
  }
  return (
    <span className={cn(base, "bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white", className)} aria-hidden>
      {initialsOf(name, email)}
    </span>
  );
}
