"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { forgotPasswordAction, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Turnstile } from "@/components/auth/turnstile";
import { FormAlert } from "@/components/auth/form-alert";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <div>
      <div className="grid size-14 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10">
        <KeyRound className="size-7 text-brand-400" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">Reset your password</h1>
      <p className="mt-2 text-slate">Enter your account email and we&apos;ll send you a secure reset link.</p>
      <form action={action} className="mt-8 space-y-5">
        {state.error && <FormAlert>{state.error}</FormAlert>}
        {state.message && <FormAlert tone="success">{state.message}</FormAlert>}
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </Field>
        <Turnstile resetKey={state} />
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Send reset link
        </Button>
        <p className="text-center text-sm text-slate">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
