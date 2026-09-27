"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { updateSettingsAction } from "@/actions/admin";
import { TRADABLE_ASSETS } from "@/lib/assets";
import type { AppSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const BANK_FIELDS = ["bank_name", "account_name", "account_number", "iban", "swift_bic", "routing_number", "bank_address"];

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [s, setS] = useState({
    withdrawal_lock_days: String(settings.withdrawal_lock_days),
    trading_fee_bps: String(settings.trading_fee_bps),
    min_deposit_usd: String(settings.min_deposit_usd),
    min_trade_usd: String(settings.min_trade_usd),
    trading_enabled: settings.trading_enabled,
    signups_enabled: settings.signups_enabled,
  });
  const [addresses, setAddresses] = useState<Record<string, Record<string, string>>>(settings.deposit_addresses ?? {});
  const [bank, setBank] = useState<Record<string, string>>(settings.bank_details ?? {});
  const [pending, start] = useTransition();

  const setAddr = (asset: string, network: string, value: string) =>
    setAddresses((a) => ({ ...a, [asset]: { ...(a[asset] ?? {}), [network]: value } }));

  const save = () =>
    start(async () => {
      const res = await updateSettingsAction({
        withdrawal_lock_days: Number(s.withdrawal_lock_days),
        trading_fee_bps: Number(s.trading_fee_bps),
        min_deposit_usd: Number(s.min_deposit_usd),
        min_trade_usd: Number(s.min_trade_usd),
        trading_enabled: s.trading_enabled,
        signups_enabled: s.signups_enabled,
        deposit_addresses: addresses,
        bank_details: bank,
      });
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });

  const customBankKeys = Object.keys(bank).filter((k) => !BANK_FIELDS.includes(k));

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-white">Trading &amp; limits</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Withdrawal lock (days)" hint="Applies to NEW accounts. Adjust existing users individually.">
            <Input value={s.withdrawal_lock_days} onChange={(e) => setS({ ...s, withdrawal_lock_days: e.target.value.replace(/\D/g, "") })} />
          </Field>
          <Field label="Trading fee (bps)" hint={`${(Number(s.trading_fee_bps || 0) / 100).toFixed(2)}% per order`}>
            <Input value={s.trading_fee_bps} onChange={(e) => setS({ ...s, trading_fee_bps: e.target.value.replace(/\D/g, "") })} />
          </Field>
          <Field label="Min bank deposit (USD)">
            <Input value={s.min_deposit_usd} onChange={(e) => setS({ ...s, min_deposit_usd: e.target.value.replace(/[^\d.]/g, "") })} />
          </Field>
          <Field label="Min order (USD)">
            <Input value={s.min_trade_usd} onChange={(e) => setS({ ...s, min_trade_usd: e.target.value.replace(/[^\d.]/g, "") })} />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-6">
          {(
            [
              ["trading_enabled", "Trading enabled"],
              ["signups_enabled", "New sign-ups enabled"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 text-sm text-silver">
              <input type="checkbox" checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} className="size-4 accent-brand-600" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-white">Crypto deposit addresses</h2>
        <p className="mt-1 text-sm text-slate">Users only see networks that have an address. Leave blank to hide a network.</p>
        <div className="mt-5 space-y-5">
          {TRADABLE_ASSETS.map((a) => (
            <div key={a.symbol} className="grid gap-3 border-b border-white/5 pb-5 last:border-0 last:pb-0 md:grid-cols-[120px_1fr]">
              <p className="pt-3 text-sm font-semibold text-white">
                {a.symbol} <span className="block text-xs font-normal text-muted">{a.name}</span>
              </p>
              <div className="grid gap-3">
                {a.networks.map((n) => (
                  <Field key={n} label={n}>
                    <Input
                      value={addresses[a.symbol]?.[n] ?? ""}
                      onChange={(e) => setAddr(a.symbol, n, e.target.value.trim())}
                      placeholder={`${a.symbol} address on ${n}`}
                      className="font-mono text-sm"
                    />
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-white">Bank transfer details (USD)</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[...BANK_FIELDS, ...customBankKeys].map((k) => (
            <Field key={k} label={<span className="capitalize">{k.replace(/_/g, " ")}</span>}>
              <div className="flex gap-2">
                <Input value={bank[k] ?? ""} onChange={(e) => setBank({ ...bank, [k]: e.target.value })} />
                {!BANK_FIELDS.includes(k) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-12"
                    onClick={() => {
                      const next = { ...bank };
                      delete next[k];
                      setBank(next);
                    }}
                    aria-label="Remove field"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </Field>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => {
            const name = prompt("Field name (e.g. sort_code)")?.trim().toLowerCase().replace(/\s+/g, "_");
            if (name) setBank({ ...bank, [name]: "" });
          }}
        >
          <Plus className="size-4" /> Add field
        </Button>
      </section>

      <div className="glass sticky bottom-4 flex items-center justify-between rounded-2xl p-4">
        <p className="text-sm text-slate">Changes apply immediately and are recorded in the audit log.</p>
        <Button onClick={save} loading={pending}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
