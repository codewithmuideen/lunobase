// Central place for environment access so a missing key fails loudly and clearly.

/**
 * Public site address. Tolerates a missing/blank value, a missing "https://" and a trailing slash,
 * and falls back to Vercel's own URL, so a misconfigured env var can never break the build.
 */
function resolveSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "https://lunobase.com",
  ];
  for (const raw of candidates) {
    const v = raw?.trim().replace(/^["']|["']$/g, "");
    if (!v) continue;
    const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    try {
      return new URL(withProto).origin;
    } catch {
      /* try the next candidate */
    }
  }
  return "https://lunobase.com";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "Lunobase";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function serverEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Add it to .env.local (see README).`);
  }
  return value;
}
