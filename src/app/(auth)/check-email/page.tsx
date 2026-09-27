import type { Metadata } from "next";
import { MailOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false, follow: false } };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10">
        <MailOpen className="size-8 text-brand-400" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">Verify your email</h1>
      <p className="mt-3 text-slate">
        If <span className="font-medium text-white">{email ?? "your email"}</span> can be registered, we&apos;ve sent a verification link to
        it. Click the link to activate your account. It expires in 24 hours.
      </p>
      <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm text-slate">
        <p className="font-medium text-white">Didn&apos;t get it?</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Check your spam or promotions folder</li>
          <li>Search your inbox for &quot;Lunobase&quot;</li>
          <li>Already registered? Just log in</li>
        </ul>
      </div>
      <ButtonLink href="/login" variant="secondary" className="mt-8 w-full" size="lg">
        Go to login
      </ButtonLink>
    </div>
  );
}
