// Cookie consent state, stored in a first-party cookie so the server can read it too.

export const CONSENT_COOKIE = "lb_consent";
export const CONSENT_VERSION = 1;
export const OPEN_SETTINGS_EVENT = "lb:open-cookie-settings";
export const CONSENT_CHANGED_EVENT = "lb:consent-changed";

export type ConsentCategory = "necessary" | "preferences" | "analytics" | "marketing";
export type Consent = { v: number; necessary: true; preferences: boolean; analytics: boolean; marketing: boolean; ts: number };

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("="))) as Consent;
    return parsed.v === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: Omit<Consent, "v" | "necessary" | "ts">) {
  const value: Consent = { v: CONSENT_VERSION, necessary: true, ts: Date.now(), ...choice };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
  return value;
}

/** Use before loading any non-essential script, e.g. `if (hasConsent("analytics")) loadAnalytics()`. */
export function hasConsent(category: ConsentCategory) {
  if (category === "necessary") return true;
  return readConsent()?.[category] === true;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
