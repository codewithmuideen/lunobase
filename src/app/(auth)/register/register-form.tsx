"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";
import { Turnstile } from "@/components/auth/turnstile";
import { FormAlert } from "@/components/auth/form-alert";
import { COUNTRIES } from "@/lib/countries";

export function RegisterForm({ defaultEmail, referralCode }: { defaultEmail?: string; referralCode?: string }) {
  const ref = (referralCode ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input type="hidden" name="ref" value={ref} />
      {ref && (
        <p className="rounded-xl border border-brand-500/25 bg-brand-500/[0.07] px-4 py-2.5 text-sm text-brand-100">
          You were invited by a friend. Referral code <span className="font-mono font-semibold">{ref}</span> will be applied.
        </p>
      )}

      <Field label="Full legal name" htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" required defaultValue={state.fields?.full_name} placeholder="Jane Doe" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.fields?.email ?? defaultEmail}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Country of residence" htmlFor="country">
        <Select id="country" name="country" required defaultValue={state.fields?.country ?? ""}>
          <option value="" disabled>
            Select country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="new-password" required showStrength placeholder="Create a strong password" />
      </Field>
      <Field label="Confirm password" htmlFor="confirm_password">
        <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" required placeholder="Repeat password" />
      </Field>

      <label className="flex items-start gap-3 text-sm text-slate">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 shrink-0 rounded accent-brand-600" required />
        <span>
          I&apos;m 18 or older and agree to the{" "}
          <Link href="/legal/terms" className="text-brand-400 hover:underline" target="_blank">
            Terms
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="text-brand-400 hover:underline" target="_blank">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/legal/risk" className="text-brand-400 hover:underline" target="_blank">
            Risk Disclosure
          </Link>
          .
        </span>
      </label>

      <Turnstile resetKey={state} />

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Create account
      </Button>

      <p className="border-t border-white/5 pt-6 text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300">
          Log in
        </Link>
      </p>
    </form>
  );
}
