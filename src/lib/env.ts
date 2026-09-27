// Central place for environment access so a missing key fails loudly and clearly.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunobase.com").replace(/\/$/, "");
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
