"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { approveDepositAction, rejectDepositAction, reviewWithdrawalAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatAmount } from "@/lib/utils";

export function DepositReview({ id, amount, asset, email }: { id: string; amount: number; asset: string; email: string }) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [credit, setCredit] = useState(String(amount));
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      const res =
        mode === "approve"
          ? await approveDepositAction({ id, amount: Number(credit), note })
          : await rejectDepositAction({ id, note });
      if (res.ok) {
        toast.success(res.message);
        setMode(null);
      } else toast.error(res.error);
    });

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button size="xs" variant="success" onClick={() => setMode("approve")}>
          <Check className="size-3.5" /> Approve
        </Button>
        <Button size="xs" variant="danger-soft" onClick={() => setMode("reject")}>
          <X className="size-3.5" /> Reject
        </Button>
      </div>
      <Modal
        open={!!mode}
        onClose={() => !pending && setMode(null)}
        title={mode === "approve" ? "Confirm deposit" : "Reject deposit"}
        description={`${formatAmount(amount)} ${asset} from ${email}`}
      >
        <div className="space-y-4">
          {mode === "approve" && (
            <Field label={`Amount to credit (${asset})`} hint="Adjust if the received amount differs from what the user reported.">
              <Input value={credit} onChange={(e) => setCredit(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
            </Field>
          )}
          <Field label={mode === "approve" ? "Internal note (optional)" : "Reason (shown to the user)"}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === "reject" ? "e.g. No matching transfer received" : ""} />
          </Field>
          <Button
            className="w-full"
            size="lg"
            variant={mode === "approve" ? "success" : "danger"}
            onClick={run}
            loading={pending}
            disabled={mode === "approve" ? !Number(credit) : !note.trim()}
          >
            {mode === "approve" ? `Credit ${credit || 0} ${asset}` : "Reject deposit"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function WithdrawalReview({ id, amount, asset, destination }: { id: string; amount: number; asset: string; destination: string }) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      const res = await reviewWithdrawalAction({ id, approve: mode === "approve", txHash, note });
      if (res.ok) {
        toast.success(res.message);
        setMode(null);
      } else toast.error(res.error);
    });

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button size="xs" variant="success" onClick={() => setMode("approve")}>
          <Check className="size-3.5" /> Mark sent
        </Button>
        <Button size="xs" variant="danger-soft" onClick={() => setMode("reject")}>
          <X className="size-3.5" /> Reject
        </Button>
      </div>
      <Modal
        open={!!mode}
        onClose={() => !pending && setMode(null)}
        title={mode === "approve" ? "Complete withdrawal" : "Reject withdrawal"}
        description={`${formatAmount(amount)} ${asset}`}
      >
        <p className="mb-4 break-all rounded-xl bg-ink-950/60 p-3 font-mono text-xs text-silver">{destination}</p>
        <div className="space-y-4">
          {mode === "approve" ? (
            <Field label="Transaction hash / bank reference" hint="Send the funds first, then record the reference here.">
              <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} className="font-mono text-sm" />
            </Field>
          ) : (
            <p className="text-sm text-slate">The held funds will be returned to the user&apos;s available balance.</p>
          )}
          <Field label={mode === "approve" ? "Note (optional)" : "Reason (shown to the user)"}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Button
            className="w-full"
            size="lg"
            variant={mode === "approve" ? "success" : "danger"}
            onClick={run}
            loading={pending}
            disabled={mode === "reject" && !note.trim()}
          >
            {mode === "approve" ? "Mark as completed" : "Reject & refund"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
