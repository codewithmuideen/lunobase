"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { reviewKycAction } from "@/actions/features";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

export function KycReview({ id, name }: { id: string; name: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const run = (approve: boolean) =>
    start(async () => {
      const res = await reviewKycAction({ id, approve, note });
      if (res.ok) {
        toast.success(res.message);
        setRejecting(false);
      } else toast.error(res.error);
    });

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="success" onClick={() => run(true)} loading={pending}>
          <Check className="size-4" /> Approve
        </Button>
        <Button size="sm" variant="danger-soft" onClick={() => setRejecting(true)} disabled={pending}>
          <X className="size-4" /> Reject
        </Button>
      </div>
      <Modal open={rejecting} onClose={() => !pending && setRejecting(false)} title="Reject verification" description={name}>
        <Field label="Reason (shown to the user)" hint="For example: photo is blurry, name doesn't match, document expired.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        </Field>
        <Button className="mt-5 w-full" size="lg" variant="danger" onClick={() => run(false)} loading={pending} disabled={!note.trim()}>
          Reject submission
        </Button>
      </Modal>
    </>
  );
}
