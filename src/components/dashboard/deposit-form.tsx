"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { AlertTriangle, Building2, Check, Copy, Coins } from "lucide-react";
import { TRADABLE_ASSETS, ASSET_BY_SYMBOL } from "@/lib/assets";
import { submitDepositAction } from "@/actions/wallet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function DepositForm({
  addresses,
  bank,
  minDeposit,
  userRef,
  defaultAsset,
}: {
  addresses: Record<string, Record<string, string>>;
  bank: Record<string, string>;
  minDeposit: number;
  userRef: string;
  defaultAsset?: string;
}) {
  const initialAsset = defaultAsset && ASSET_BY_SYMBOL[defaultAsset] ? defaultAsset : "USDT";
  const [method, setMethod] = useState<"crypto" | "bank">(defaultAsset === "USD" ? "bank" : "crypto");
  const [asset, setAsset] = useState(initialAsset);
  const [network, setNetwork] = useState(ASSET_BY_SYMBOL[initialAsset].networks[0]);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [pending, start] = useTransition();

  const address = addresses[asset]?.[network];
  const bankEntries = Object.entries(bank).filter(([, v]) => v);

  const submit = () =>
    start(async () => {
      const res = await submitDepositAction({ method, asset: method === "bank" ? "USD" : asset, network, amount: Number(amount), reference });
      if (res.ok) {
        toast.success("Deposit submitted", { description: res.message });
        setAmount("");
        setReference("");
      } else toast.error(res.error);
    });

  return (
    <div className="card-raised p-5 sm:p-7">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-950/60 p-1.5">
        {(
          [
            ["crypto", "Crypto", Coins],
            ["bank", "Bank transfer (USD)", Building2],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setMethod(id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
              method === id ? "bg-white/10 text-white" : "text-slate hover:text-white",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {method === "crypto" ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Asset">
              <Select
                value={asset}
                onChange={(e) => {
                  setAsset(e.target.value);
                  setNetwork(ASSET_BY_SYMBOL[e.target.value].networks[0]);
                }}
              >
                {TRADABLE_ASSETS.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} · {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Network">
              <Select value={network} onChange={(e) => setNetwork(e.target.value)}>
                {ASSET_BY_SYMBOL[asset].networks.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {address ? (
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/5 bg-ink-950/50 p-5 sm:flex-row sm:items-start">
              <div className="rounded-xl bg-white p-2.5">
                <QRCodeSVG value={address} size={132} level="M" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">
                  Your {asset} deposit address · {network}
                </p>
                <p className="mt-2 break-all font-mono text-sm leading-relaxed text-white">{address}</p>
                <CopyButton value={address} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-warn/20 bg-warn/[0.06] p-5 text-sm text-silver">
              Deposit address for {asset} on {network} isn&apos;t available right now.{" "}
              <Link href="/dashboard/support?new=deposit" className="font-semibold text-warn hover:underline">
                Contact support
              </Link>{" "}
              or choose another network.
            </div>
          )}

          <div className="flex gap-3 rounded-xl border border-down/20 bg-down/[0.06] p-4 text-sm text-silver">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-down" />
            <p>
              Only send <strong className="text-white">{asset}</strong> on the <strong className="text-white">{network}</strong> network to this
              address. Sending other assets or using another network may result in permanent loss.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {bankEntries.length ? (
            <dl className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-ink-950/50 px-5">
              {bankEntries.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="capitalize text-slate">{k.replace(/_/g, " ")}</dt>
                  <dd className="flex items-center gap-2 text-right font-medium text-white">
                    {v} <CopyButton value={v} icon />
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-3 text-sm">
                <dt className="text-slate">Payment reference (required)</dt>
                <dd className="flex items-center gap-2 font-mono font-semibold text-brand-300">
                  {userRef} <CopyButton value={userRef} icon />
                </dd>
              </div>
            </dl>
          ) : (
            <div className="rounded-2xl border border-warn/20 bg-warn/[0.06] p-5 text-sm text-silver">
              Bank details aren&apos;t available yet.{" "}
              <Link href="/dashboard/support?new=deposit" className="font-semibold text-warn hover:underline">
                Contact support
              </Link>{" "}
              for funding instructions.
            </div>
          )}
          <p className="text-xs text-muted">
            Include your payment reference so we can match your transfer. Minimum ${minDeposit}. Transfers usually arrive in 1-3 business days.
          </p>
        </div>
      )}

      <div className="mt-7 border-t border-white/5 pt-6">
        <p className="font-semibold text-white">Already sent it? Tell us so we can confirm faster.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={`Amount sent (${method === "bank" ? "USD" : asset})`}>
            <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="0.00" />
          </Field>
          <Field label={method === "bank" ? "Bank reference / sender name" : "Transaction hash (TXID)"}>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === "bank" ? userRef : "0x…"} />
          </Field>
        </div>
        <Button className="mt-5 w-full sm:w-auto" size="lg" onClick={submit} loading={pending} disabled={!amount || !reference}>
          Submit deposit
        </Button>
        <p className="mt-3 text-xs text-muted">Your balance updates automatically, in real time, as soon as our team confirms the deposit.</p>
      </div>
    </div>
  );
}

function CopyButton({ value, icon }: { value: string; icon?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Please copy manually.");
    }
  };
  if (icon) {
    return (
      <button onClick={copy} className="text-muted hover:text-white" aria-label="Copy">
        {copied ? <Check className="size-3.5 text-up" /> : <Copy className="size-3.5" />}
      </button>
    );
  }
  return (
    <button onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">
      {copied ? <Check className="size-3.5 text-up" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy address"}
    </button>
  );
}
