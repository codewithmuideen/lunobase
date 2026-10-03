import "server-only";

/** Verifies a Cloudflare Turnstile ("I am not a robot") token server-side. */
export async function verifyHuman(token: string | null | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Robot check is optional: with no keys configured it's switched off. Logins are still protected
  // by password + email OTP, rate limiting and the form honeypot.
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
