// Signed "second factor passed" cookie. Uses Web Crypto so it works in the proxy and in server actions.
// The token is bound to the Supabase session id, so a new login always requires a new email code.

export const MFA_COOKIE = "lb_2fa";
export const MFA_TTL_SECONDS = 60 * 60 * 12; // 12 hours

type Payload = { uid: string; sid: string; exp: number };

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signMfaToken(uid: string, sid: string) {
  const payload: Payload = { uid, sid, exp: Math.floor(Date.now() / 1000) + MFA_TTL_SECONDS };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifyMfaToken(token: string | undefined, uid: string, sid: string | undefined) {
  if (!token || !sid) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(body));
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Payload;
    return payload.uid === uid && payload.sid === sid && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
