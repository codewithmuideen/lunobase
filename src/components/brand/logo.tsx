import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Full Lunobase wordmark. Source PNGs are 1847×701 with padding baked in. */
export function Logo({
  href = "/",
  variant = "white",
  className,
  priority,
}: {
  href?: string | null;
  variant?: "white" | "blue" | "black";
  className?: string;
  priority?: boolean;
}) {
  const img = (
    <Image
      src={`/brand/logo-${variant}.png`}
      alt="Lunobase"
      width={1847}
      height={701}
      priority={priority}
      className={cn("h-9 w-auto", className)}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label="Lunobase home" className="inline-flex shrink-0 items-center">
      {img}
    </Link>
  );
}

export function LogoMark({ className, white }: { className?: string; white?: boolean }) {
  return (
    <Image
      src={white ? "/brand/mark-white.png" : "/brand/mark.png"}
      alt="Lunobase"
      width={512}
      height={512}
      className={cn("size-8", className)}
    />
  );
}
