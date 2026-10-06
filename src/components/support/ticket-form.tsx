"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTicketAction } from "@/actions/support";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const CATEGORIES = [
  ["general", "General question"],
  ["withdrawal", "Withdrawal access"],
  ["deposit", "Deposit"],
  ["trading", "Trading"],
  ["account", "Account & verification"],
  ["security", "Security concern"],
];

const PRESETS: Record<string, { subject: string; message: string }> = {
  withdrawal: {
    subject: "Help with a withdrawal",
    message: "Hello, I need help with a withdrawal. Details: ",
  },
  deposit: { subject: "Help with a deposit", message: "" },
  account: { subject: "Help with my account", message: "" },
};

export function TicketForm({ defaultCategory }: { defaultCategory?: string }) {
  const router = useRouter();
  const preset = defaultCategory ? PRESETS[defaultCategory] : undefined;
  const [category, setCategory] = useState(defaultCategory && CATEGORIES.some(([c]) => c === defaultCategory) ? defaultCategory : "general");
  const [subject, setSubject] = useState(preset?.subject ?? "");
  const [message, setMessage] = useState(preset?.message ?? "");
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createTicketAction({ subject, category, message });
          if (res.ok && res.data) {
            toast.success("Ticket opened", { description: res.message });
            router.push(`/dashboard/support/${res.data.id}`);
          } else if (!res.ok) toast.error(res.error);
        });
      }}
      className="space-y-4"
    >
      <Field label="Topic">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Subject">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} placeholder="Short summary" />
      </Field>
      <Field label="Message" hint="Never share your password or login codes. We'll never ask for them.">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} rows={6} placeholder="How can we help?" />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Send to support
      </Button>
    </form>
  );
}
