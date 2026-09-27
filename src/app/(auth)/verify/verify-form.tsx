"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { resendCodeAction, signOutAction, verifyCodeAction, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { FormAlert } from "@/components/auth/form-alert";

export function VerifyForm({ email, next }: { email: string; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyCodeAction, {});
  const [resendState, setResendState] = useState<FormState>({});
  const [resending, startResend] = useTransition();
  const [cooldown, setCooldown] = useState(45);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <div>
      <div className="grid size-14 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10">
        <MailCheck className="size-7 text-brand-400" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">Check your email</h1>
      <p className="mt-2 text-slate">
        We sent a 6-digit verification code to <span className="font-medium text-white">{email}</span>. It expires in 10 minutes.
      </p>

      <form ref={formRef} action={action} className="mt-8 space-y-5">
        {state.error && <FormAlert>{state.error}</FormAlert>}
        {!state.error && resendState.error && <FormAlert>{resendState.error}</FormAlert>}
        {!state.error && resendState.message && <FormAlert tone="success">{resendState.message}</FormAlert>}
        <input type="hidden" name="next" value={next ?? ""} />
        <OtpInput key={String(state.error)} invalid={!!state.error} onComplete={() => formRef.current?.requestSubmit()} />
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Verify and continue
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={cooldown > 0 || resending}
          onClick={() =>
            startResend(async () => {
              const r = await resendCodeAction();
              setResendState(r);
              if (!r.error) setCooldown(45);
            })
          }
          className="font-medium text-brand-400 hover:text-brand-300 disabled:cursor-not-allowed disabled:text-muted"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
        </button>
        <form action={signOutAction}>
          <button className="text-slate hover:text-white">Use a different account</button>
        </form>
      </div>

      <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs leading-relaxed text-muted">
        Lunobase will never ask you for this code by phone, chat or email. If you didn&apos;t try to sign in, change your password
        immediately.
      </div>
    </div>
  );
}
