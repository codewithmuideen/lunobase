"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { resetPasswordAction, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";
import { FormAlert } from "@/components/auth/form-alert";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <div>
      <div className="grid size-14 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10">
        <ShieldCheck className="size-7 text-brand-400" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">Choose a new password</h1>
      <p className="mt-2 text-slate">For your security, you&apos;ll be signed out of all devices afterwards.</p>
      <form action={action} className="mt-8 space-y-5">
        {state.error && <FormAlert>{state.error}</FormAlert>}
        <Field label="New password" htmlFor="password">
          <PasswordInput id="password" name="password" autoComplete="new-password" required showStrength />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm_password">
          <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" required />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Update password
        </Button>
      </form>
    </div>
  );
}
