"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePreferencesAction, updateProfileAction } from "@/actions/account";
import { COUNTRIES } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function ProfileForm({ profile }: { profile: { full_name: string | null; phone: string | null; country: string | null; email: string } }) {
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await updateProfileAction({
            full_name: String(fd.get("full_name")),
            phone: String(fd.get("phone")),
            country: String(fd.get("country")),
          });
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="Full name">
        <Input name="full_name" defaultValue={profile.full_name ?? ""} autoComplete="name" />
      </Field>
      <Field label="Email" hint="Contact support to change your email.">
        <Input value={profile.email} disabled readOnly />
      </Field>
      <Field label="Phone">
        <Input name="phone" defaultValue={profile.phone ?? ""} autoComplete="tel" placeholder="+1 555 000 0000" />
      </Field>
      <Field label="Country">
        <Select name="country" defaultValue={profile.country ?? ""}>
          <option value="">Select country</option>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export function PreferencesForm({ loginAlerts, tradeEmails }: { loginAlerts: boolean; tradeEmails: boolean }) {
  const [prefs, setPrefs] = useState({ login_alerts: loginAlerts, trade_emails: tradeEmails });
  const [, start] = useTransition();
  const toggle = (key: keyof typeof prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    start(async () => {
      const res = await updatePreferencesAction(next);
      if (res.ok) toast.success("Preferences saved");
      else toast.error(res.error);
    });
  };
  const rows: [keyof typeof prefs, string, string][] = [
    ["login_alerts", "New-device login alerts", "Email me when my account is accessed from a new device."],
    ["trade_emails", "Trade confirmations", "Email me a receipt for every filled order."],
  ];
  return (
    <ul className="divide-y divide-white/5">
      {rows.map(([key, title, text]) => (
        <li key={key} className="flex items-center justify-between gap-6 py-4">
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="text-sm text-slate">{text}</p>
          </div>
          <button
            role="switch"
            aria-checked={prefs[key]}
            aria-label={title}
            onClick={() => toggle(key)}
            className={cn("relative h-6 w-11 shrink-0 rounded-full transition", prefs[key] ? "bg-brand-600" : "bg-white/15")}
          >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", prefs[key] ? "left-[22px]" : "left-0.5")} />
          </button>
        </li>
      ))}
      <li className="py-4">
        <p className="text-sm font-medium text-white">Security emails</p>
        <p className="text-sm text-slate">Login codes, deposits, withdrawals and password changes are always sent.</p>
      </li>
    </ul>
  );
}
