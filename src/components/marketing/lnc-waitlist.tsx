"use client";

import { useActionState } from "react";
import { joinLncWaitlistAction } from "@/actions/lnc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { ActionResult } from "@/lib/types";

export function LncWaitlist() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(joinLncWaitlistAction, null);
  if (state?.ok) return <p className="rounded-2xl border border-up/25 bg-up/[0.06] px-5 py-4 text-sm font-medium text-white">{state.message}</p>;
  return (
    <form action={action}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" aria-label="Email address" className="sm:flex-1" />
        <Button type="submit" loading={pending} className="shrink-0">
          Keep me posted
        </Button>
      </div>
      {state && !state.ok && <p className="mt-2 text-sm text-down">{state.error}</p>}
      <p className="mt-3 text-xs text-muted">LunoCoin news only. Unsubscribe any time by emailing info@lunobase.com.</p>
    </form>
  );
}
