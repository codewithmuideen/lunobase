"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { loginAction, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";
import { Turnstile } from "@/components/auth/turnstile";
import { FormAlert } from "@/components/auth/form-alert";

export function LoginForm({
  next,
  notice,
}: {
  next?: string;
  notice?: { tone: "success" | "info" | "error"; text: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {notice && !state.error && <FormAlert tone={notice.tone}>{notice.text}</FormAlert>}
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <input type="hidden" name="next" value={next ?? ""} />
      {/* Honeypot: hidden from humans, bots tend to fill it */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} placeholder="you@example.com" />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        action={
          <Link href="/forgot-password" className="mb-1.5 text-sm text-brand-400 hover:text-brand-300">
            Forgot password?
          </Link>
        }
      >
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="••••••••••" />
      </Field>

      <Turnstile resetKey={state} />

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Continue
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted">
        <Lock className="size-3.5" /> We&apos;ll email you a 6-digit code to finish signing in.
      </p>

      <p className="border-t border-white/5 pt-6 text-center text-sm text-slate">
        New to Lunobase?{" "}
        <Link href="/register" className="font-semibold text-brand-400 hover:text-brand-300">
          Create an account
        </Link>
      </p>
    </form>
  );
}
