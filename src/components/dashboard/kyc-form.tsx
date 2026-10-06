"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, CheckCircle2, IdCard, Lock } from "lucide-react";
import { submitKycAction } from "@/actions/features";
import { downscaleImage } from "@/lib/image-client";
import { COUNTRIES } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Slot = "front" | "back" | "selfie";

export function KycForm({ defaultName, defaultCountry }: { defaultName: string; defaultCountry: string }) {
  const router = useRouter();
  const [docType, setDocType] = useState("national_id");
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<Slot, string>>>({});
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<Slot | null>(null);

  const pick = async (slot: Slot, file: File | undefined) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("Please choose a photo (JPG or PNG).");
      return;
    }
    setBusy(slot);
    try {
      const small = await downscaleImage(file);
      setFiles((f) => ({ ...f, [slot]: small }));
      setPreviews((p) => {
        if (p[slot]) URL.revokeObjectURL(p[slot]!);
        return { ...p, [slot]: URL.createObjectURL(small) };
      });
    } catch {
      toast.error("We couldn't read that photo. Please try another one.");
    } finally {
      setBusy(null);
    }
  };

  const needsBack = docType !== "passport";
  const ready = !!files.front && !!files.selfie && (!needsBack || !!files.back);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (files.front) fd.set("front", files.front);
        if (files.back && needsBack) fd.set("back", files.back);
        if (files.selfie) fd.set("selfie", files.selfie);
        start(async () => {
          const res = await submitKycAction(fd);
          if (res.ok) {
            toast.success("Submitted", { description: res.message });
            router.refresh();
          } else toast.error(res.error);
        });
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full legal name" hint="Exactly as shown on your document.">
          <Input name="legal_name" defaultValue={defaultName} required autoComplete="name" />
        </Field>
        <Field label="Date of birth">
          <Input name="date_of_birth" type="date" required max={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Issuing country">
          <Select name="country" defaultValue={defaultCountry} required>
            <option value="" disabled>
              Select country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Document type">
          <Select name="doc_type" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="national_id">National ID card</option>
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver&apos;s licence</option>
          </Select>
        </Field>
        <Field label="Document number" className="sm:col-span-2">
          <Input name="doc_number" required autoComplete="off" />
        </Field>
      </div>

      <div className={cn("grid gap-4", needsBack ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <PhotoSlot label={docType === "passport" ? "Passport photo page" : "Front of document"} icon={IdCard} preview={previews.front} loading={busy === "front"} onPick={(f) => pick("front", f)} />
        {needsBack && <PhotoSlot label="Back of document" icon={IdCard} preview={previews.back} loading={busy === "back"} onPick={(f) => pick("back", f)} />}
        <PhotoSlot label="Selfie holding the document" icon={Camera} preview={previews.selfie} loading={busy === "selfie"} onPick={(f) => pick("selfie", f)} capture="user" />
      </div>

      <ul className="space-y-1.5 text-xs text-slate">
        <li>• All four corners of the document must be visible, with no glare or blur.</li>
        <li>• In the selfie, your face and the document must both be clearly readable.</li>
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-muted">
          <Lock className="size-3.5" /> Documents are stored privately and only viewed by our verification team.
        </p>
        <Button type="submit" size="lg" loading={pending} disabled={!ready}>
          Submit for verification
        </Button>
      </div>
    </form>
  );
}

function PhotoSlot({
  label,
  icon: Icon,
  preview,
  loading,
  onPick,
  capture,
}: {
  label: string;
  icon: typeof Camera;
  preview?: string;
  loading: boolean;
  onPick: (f: File | undefined) => void;
  capture?: "user" | "environment";
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className={cn(
        "group relative flex aspect-[4/3] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed p-4 text-center transition",
        preview ? "border-up/40" : "border-white/15 hover:border-brand-500/60 hover:bg-white/[0.02]",
      )}
    >
      {preview ? (
        <>
          <img src={preview} alt={label} className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-ink-950/80 py-2 text-xs font-semibold text-up">
            <CheckCircle2 className="size-3.5" /> {label} · tap to change
          </span>
        </>
      ) : (
        <>
          <Icon className="size-7 text-brand-400" />
          <span className="text-sm font-medium text-white">{loading ? "Processing…" : label}</span>
          <span className="text-xs text-muted">Tap to take or upload a photo</span>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </button>
  );
}
