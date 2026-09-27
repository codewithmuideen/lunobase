import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/**
 * "$1.70T", "$845.20M". Hand-rolled because Intl's compact notation differs between
 * Node's ICU and browsers ("$1.7T" vs "$1.70T"), which causes hydration mismatches.
 */
function compactUsd(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) return `${sign}$${(abs / size).toFixed(2)}${suffix}`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatUsd(value: number | string | null | undefined, opts?: { compact?: boolean }) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "$0.00";
  if (opts?.compact) return compactUsd(n);
  if (Math.abs(n) > 0 && Math.abs(n) < 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumSignificantDigits: 4,
    }).format(n);
  }
  return usd.format(n);
}

export function formatPrice(value: number | null | undefined) {
  const n = Number(value ?? 0);
  if (n >= 1) return usd.format(n);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumSignificantDigits: 4,
  }).format(n);
}

export function formatAmount(value: number | string | null | undefined, maxDigits = 8) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: n >= 1000 ? 2 : maxDigits }).format(n);
}

export function formatPct(value: number | null | undefined, digits = 2) {
  const n = Number(value ?? 0);
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function formatDate(value: string | Date, withTime = true) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function timeAgo(value: string | Date) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(value, false);
}

export function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(name.length - 2, 3))}@${domain}`;
}
