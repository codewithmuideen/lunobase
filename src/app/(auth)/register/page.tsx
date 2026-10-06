import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Open a free Lunobase account in minutes and start buying crypto securely.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ email?: string; ref?: string }> }) {
  const { email, ref } = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight text-white">Create your account</h1>
      <p className="mt-2 text-slate">Start trading crypto in minutes. It&apos;s free.</p>
      <RegisterForm defaultEmail={email} referralCode={ref} />
    </>
  );
}
