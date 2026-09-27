"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { ASSET_BY_SYMBOL } from "@/lib/assets";
import { requestWithdrawalAction } from "@/actions/wallet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatAmount } from "@/lib/utils";

export function WithdrawForm({ balances, defaultAsset }: { balances: Record<string, number>; defaultAsset?: string }) {
  const assets = Object.keys(balances).filter((a) => balances[a] > 0);
  const first = defaultAsset && assets.includes(defaultAsset) ? defaultAsset : (assets[0] ?? "USD");
  const [asset, setAsset] = useState(first);
  const networks = asset === "USD" ? ["Bank transfer"] : (ASSET_BY_SYMBOL[asset]?.networks ?? []);
  const [network, setNetwork] = useState(networks[0]);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();

  const available = balances[asset] ?? 0;
  const n = Number(amount) || 0;
  const error = n > available ? "Amount exceeds your available balance" : null;

  if (!assets.length) {
    return <p className="py-8 text-center text-sm text-slate">You don&apos;t have any funds available to withdraw.</p>;
  }

  const submit = () =>
    start(async () => {
      const res = await requestWithdrawalAction({ asset, network, amount: n, destination, password });
      setPassword("");
      if (res.ok) {
        toast.success("Withdrawal submitted", { description: res.message });
        setConfirming(false);
        setAmount("");
        setDestination("");
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asset">
          <Select
            value={asset}
            onChange={(e) => {
              setAsset(e.target.value);
              setNetwork(e.target.value === "USD" ? "Bank transfer" : ASSET_BY_SYMBOL[e.target.value].networks[0]);
            }}
          >
            {assets.map((a) => (
              <option key={a} value={a}>
                {a} · {formatAmount(balances[a])} available
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Network">
          <Select value={network} onChange={(e) => setNetwork(e.target.value)}>
            {networks.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label="Amount"
        error={error}
        action={
          <button onClick={() => setAmount(String(available))} className="mb-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300">
            Max {formatAmount(available)}
          </button>
        }
      >
        <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="0.00" />
      </Field>
      <Field
        label={asset === "USD" ? "Bank account details" : "Destination address"}
        hint={asset === "USD" ? "Account holder name, bank name, account number / IBAN, SWIFT." : `Double-check this is a ${asset} address on ${network}.`}
      >
        {asset === "USD" ? (
          <Textarea value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Jane Doe · Example Bank · IBAN …" />
        ) : (
          <Input value={destination} onChange={(e) => setDestination(e.target.value.trim())} placeholder="Paste address" className="font-mono text-sm" />
        )}
      </Field>

      <Button size="lg" className="w-full" disabled={!n || !!error || destination.length < 10} onClick={() => setConfirming(true)}>
        Continue
      </Button>

      <Modal open={confirming} onClose={() => !pending && setConfirming(false)} title="Confirm withdrawal" description="For your security, re-enter your password.">
        <dl className="space-y-2.5 rounded-2xl border border-white/5 bg-ink-950/50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Amount</dt>
            <dd className="num font-semibold text-white">
              {formatAmount(n)} {asset}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Network</dt>
            <dd className="text-white">{network}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-slate">To</dt>
            <dd className="break-all text-right font-mono text-xs text-white">{destination}</dd>
          </div>
        </dl>
        <div className="mt-4 flex gap-3 rounded-xl border border-warn/20 bg-warn/[0.06] p-3.5 text-xs text-silver">
          <AlertTriangle className="size-4 shrink-0 text-warn" />
          Crypto transactions can&apos;t be reversed. Funds will be held while our security team reviews this request.
        </div>
        <Field label="Password" className="mt-5">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
        </Field>
        <Button className="mt-5 w-full" size="lg" onClick={submit} loading={pending} disabled={!password}>
          <ShieldCheck className="size-4" /> Submit for review
        </Button>
      </Modal>
    </div>
  );
}
