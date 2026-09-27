import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/dashboard", "/admin", "/api/", "/auth/", "/verify", "/reset-password", "/check-email"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: privatePaths }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
