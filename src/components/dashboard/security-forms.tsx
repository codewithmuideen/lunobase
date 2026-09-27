"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Snowflake } from "lucide-react";
import { changePasswordAction, freezeAccountAction, setAntiPhishingCodeAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { PasswordInput } from "@/components/auth/password-input";

export function AntiPhishingForm({ current }: { current: string | null }) {
  const [code, setCode] = useState(current ?? "");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await setAntiPhishingCodeAction({ code, password });
          setPassword("");
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        });
      }}
      className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <Field label="Anti-phishing code">
        <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} placeholder="e.g. BlueOcean42" />
      </Field>
      <Field label="Confirm with password">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </Field>
      <Button type="submit" loading={pending} disabled={!password} className="h-12">
        Save
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [pending, start] = useTransition();
  const [key, setKey] = useState(0);
  return (
    <form
      key={key}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await changePasswordAction({
            current: String(fd.get("current")),
            next: String(fd.get("next")),
            confirm: String(fd.get("confirm")),
          });
          if (res.ok) {
            toast.success(res.message);
            setKey((k) => k + 1);
          } else toast.error(res.error);
        });
      }}
      className="space-y-4"
    >
      <Field label="Current password">
        <PasswordInput name="current" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password">
          <PasswordInput name="next" autoComplete="new-password" required showStrength />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput name="confirm" autoComplete="new-password" required />
        </Field>
      </div>
      <Button type="submit" loading={pending}>
        Update password
      </Button>
    </form>
  );
}

export function FreezeAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="danger-soft" onClick={() => setOpen(true)}>
        <Snowflake className="size-4" /> Freeze account
      </Button>
      <Modal open={open} onClose={() => !pending && setOpen(false)} title="Freeze your account?" description="Use this if you think someone else has access.">
        <ul className="space-y-2 rounded-2xl border border-white/5 bg-ink-950/50 p-4 text-sm text-silver">
          <li>• Trading and withdrawals are paused immediately</li>
          <li>• You&apos;ll be signed out on every device</li>
          <li>• Only Lunobase support can unfreeze the account after verifying you</li>
        </ul>
        <Field label='Type "FREEZE" to confirm' className="mt-5">
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoFocus />
        </Field>
        <Button
          variant="danger"
          className="mt-5 w-full"
          size="lg"
          loading={pending}
          disabled={confirm.trim().toUpperCase() !== "FREEZE"}
          onClick={() =>
            start(async () => {
              const res = await freezeAccountAction({ confirm });
              if (res && !res.ok) toast.error(res.error);
            })
          }
        >
          Freeze my account
        </Button>
      </Modal>
    </>
  );
}
