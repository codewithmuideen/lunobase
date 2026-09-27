import "server-only";
import { createHash } from "node:crypto";

export function passwordProblems(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 128) return "Password is too long.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) return "Use both upper and lower case letters.";
  if (!/\d/.test(pw)) return "Include at least one number.";
  return null;
}

/**
 * Checks the password against the Have I Been Pwned breach corpus using k-anonymity
 * (only the first 5 chars of the SHA-1 hash leave the server). Fails open on network errors.
 */
export async function isBreachedPassword(pw: string): Promise<boolean> {
  try {
    const hash = createHash("sha1").update(pw).digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\n").some((line) => {
      const [s, count] = line.trim().split(":");
      return s === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
