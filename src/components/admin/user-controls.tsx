"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adjustBalanceAction, updateUserControlsAction } from "@/actions/admin";
import { DEPOSITABLE } from "@/lib/assets";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function UserControls({ user }: { user: Profile }) {
  const [status, setStatus] = useState(user.status);
  const [role, setRole] = useState(user.role);
  const [kyc, setKyc] = useState(user.kyc_status);
  const [unlock, setUnlock] = useState(toLocalInput(user.withdrawal_unlock_at));
  const [enabled, setEnabled] = useState(user.withdrawals_enabled);
  const [pending, start] = useTransition();

  const shift = (days: number) => {
    const base = new Date(unlock);
    base.setDate(base.getDate() + days);
    setUnlock(toLocalInput(base.toISOString()));
  };

  const save = () =>
    start(async () => {
      const res = await updateUserControlsAction({
        userId: user.id,
        status,
        role,
        kyc_status: kyc,
        withdrawal_unlock_at: new Date(unlock).toISOString(),
        withdrawals_enabled: enabled,
      });
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Account status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as Profile["status"])}>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="suspended">Suspended</option>
          </Select>
        </Field>
        <Field label="Verification">
          <Select value={kyc} onChange={(e) => setKyc(e.target.value as Profile["kyc_status"])}>
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </Select>
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as Profile["role"])}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
      </div>

      <div className="rounded-2xl border border-white/5 bg-ink-950/40 p-4">
        <p className="text-sm font-semibold text-white">Withdrawal access</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Unlock date">
            <Input type="datetime-local" value={unlock} onChange={(e) => setUnlock(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => shift(30)}>
              +30 days
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => shift(-30)}>
              −30 days
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setUnlock(toLocalInput(new Date().toISOString()))}>
              Unlock now
            </Button>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-silver">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4 accent-brand-600" />
          Override: allow withdrawals regardless of unlock date
        </label>
      </div>

      <Button onClick={save} loading={pending}>
        Save changes
      </Button>
    </div>
  );
}

export function AdjustBalanceForm({ userId }: { userId: string }) {
  const [asset, setAsset] = useState("USD");
  const [delta, setDelta] = useState("");
  const [memo, setMemo] = useState("");
  const [pending, start] = useTransition();
  const submit = (sign: 1 | -1) =>
    start(async () => {
      const res = await adjustBalanceAction({ userId, asset, delta: sign * Math.abs(Number(delta)), memo });
      if (res.ok) {
        toast.success(res.message);
        setDelta("");
        setMemo("");
      } else toast.error(res.error);
    });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Asset">
          <Select value={asset} onChange={(e) => setAsset(e.target.value)}>
            {DEPOSITABLE.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </Field>
        <Field label="Amount">
          <Input value={delta} onChange={(e) => setDelta(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="0.00" />
        </Field>
      </div>
      <Field label="Memo (recorded in audit log and shown in user ledger)">
        <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="e.g. Bank deposit ref 8812 confirmed" />
      </Field>
      <div className="flex gap-2">
        <Button onClick={() => submit(1)} loading={pending} disabled={!Number(delta) || !memo.trim()} variant="success">
          Credit
        </Button>
        <Button onClick={() => submit(-1)} loading={pending} disabled={!Number(delta) || !memo.trim()} variant="danger-soft">
          Debit
        </Button>
      </div>
    </div>
  );
}
