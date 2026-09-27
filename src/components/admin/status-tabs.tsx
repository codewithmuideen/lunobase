import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatusTabs({ base, current, tabs }: { base: string; current: string; tabs: string[] }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <Link
          key={t}
          href={`${base}?status=${t}`}
          className={cn("rounded-lg px-3.5 py-2 text-sm font-medium capitalize", current === t ? "bg-white/[0.08] text-white" : "text-slate hover:text-white")}
        >
          {t}
        </Link>
      ))}
    </div>
  );
}
