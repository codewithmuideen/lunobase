import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getMarkets } from "@/lib/market";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" | "hourly" }[] = [
    { path: "", priority: 1, freq: "daily" },
    { path: "/markets", priority: 0.9, freq: "hourly" },
    { path: "/lunocoin", priority: 0.8, freq: "weekly" },
    { path: "/security", priority: 0.8, freq: "monthly" },
    { path: "/fees", priority: 0.7, freq: "monthly" },
    { path: "/about", priority: 0.6, freq: "monthly" },
    { path: "/support", priority: 0.6, freq: "monthly" },
    { path: "/register", priority: 0.8, freq: "monthly" },
    { path: "/login", priority: 0.5, freq: "monthly" },
    { path: "/legal/terms", priority: 0.3, freq: "monthly" },
    { path: "/legal/privacy", priority: 0.3, freq: "monthly" },
    { path: "/legal/cookies", priority: 0.3, freq: "monthly" },
    { path: "/legal/risk", priority: 0.3, freq: "monthly" },
  ];

  const coins = await getMarkets(100);
  return [
    ...staticPages.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    })),
    ...coins.map((c) => ({
      url: `${SITE_URL}/price/${c.id}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: c.market_cap_rank <= 20 ? 0.8 : 0.6,
    })),
  ];
}
