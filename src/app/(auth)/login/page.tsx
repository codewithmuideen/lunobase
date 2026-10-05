import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Lunobase account.",
  alternates: { canonical: "/login" },
};

const notices: Record<string, { tone: "success" | "info" | "error"; text: string }> = {
  verified: { tone: "success", text: "Email verified! Sign in to continue." },
  reset: { tone: "success", text: "Password updated. Sign in with your new password." },
  frozen: { tone: "info", text: "Your account has been frozen and all sessions were signed out. Contact support to restore access." },
  suspended: { tone: "error", text: "This account is suspended. Please email info@lunobase.com." },
  link: { tone: "error", text: "That link is invalid or has expired. Please request a new one." },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verified?: string; reset?: string; frozen?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const key = sp.verified ? "verified" : sp.reset ? "reset" : sp.frozen ? "frozen" : sp.error;
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight text-white">Welcome back</h1>
      <p className="mt-2 text-slate">Sign in to your Lunobase account.</p>
      <LoginForm next={sp.next} notice={key ? notices[key] : undefined} />
    </>
  );
}
