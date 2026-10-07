"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminGrantLncAction } from "@/actions/lnc";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LncGrant() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await adminGrantLncAction({ email, amount: Number(amount), memo });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setAmount("");
      setMemo("");
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="User email">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
      </Field>
      <Field label="Amount (LNC)" hint="Use a negative number to remove LunoCoin.">
        <Input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
      </Field>
      <Field label="Note (shown to the user)">
        <Input required maxLength={140} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Promotion bonus" />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        Apply
      </Button>
    </form>
  );
}
