import Image from "next/image";
import Link from "next/link";
import { Eye, Lock, MailCheck, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh overflow-x-clip lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image src="/brand/wave.png" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/20 via-ink-950/30 to-ink-950/85" />
        <Image
          src="/brand/mark-white.png"
          alt=""
          width={520}
          height={520}
          className="pointer-events-none absolute -bottom-24 -right-24 opacity-[0.07]"
        />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Logo className="-ml-3 h-14" />
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Your crypto, protected at every step.
            </h2>
            <ul className="mt-10 space-y-5">
              {[
                [MailCheck, "Email verification code on every sign-in"],
                [ShieldCheck, "Every withdrawal reviewed by our security team"],
                [Eye, "Full login history and new-device alerts"],
                [Lock, "Anti-phishing code in every genuine email"],
              ].map(([Icon, text]) => {
                const I = Icon as typeof Lock;
                return (
                  <li key={text as string} className="flex items-center gap-4 text-brand-50/90">
                    <span className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 backdrop-blur">
                      <I className="size-5" />
                    </span>
                    {text as string}
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-xs text-brand-50/60">© {new Date().getFullYear()} Lunobase · Digital assets are volatile. Invest responsibly.</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col">
        <div aria-hidden className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60 lg:opacity-40" />
        <div className="relative flex items-center justify-between px-6 py-6 sm:px-10">
          <Logo className="h-8 lg:invisible" />
          <Link href="/" className="text-sm text-slate hover:text-white">
            ← Back to site
          </Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-[440px] animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
