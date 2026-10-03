"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { removeAvatarAction, uploadAvatarAction } from "@/actions/account";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const SIZE = 320; // stored square size in px

/** Center-crops to a square and re-encodes, so uploads are tiny and carry no camera metadata (EXIF/GPS). */
async function toSquare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  const encode = (type: string, quality: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  const webp = await encode("image/webp", 0.86);
  // Safari < 16 can't encode WebP and silently returns PNG; fall back to JPEG explicitly.
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg", 0.88);
  if (!jpeg) throw new Error("Could not process image");
  return jpeg;
}

export function AvatarUploader({ src, name, email }: { src: string | null; name: string | null; email: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(src);
  const [pending, start] = useTransition();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("That image is over 12 MB. Please choose a smaller one.");
      return;
    }
    start(async () => {
      try {
        const blob = await toSquare(file);
        const fd = new FormData();
        fd.append("avatar", new File([blob], blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg", { type: blob.type }));
        const res = await uploadAvatarAction(fd);
        if (res.ok && res.data) {
          setPreview(res.data.url);
          toast.success(res.message ?? "Profile photo updated.");
        } else if (!res.ok) toast.error(res.error);
      } catch {
        toast.error("We couldn't read that image. Please try a different one.");
      }
    });
  };

  const remove = () =>
    start(async () => {
      const res = await removeAvatarAction();
      if (res.ok) {
        setPreview(null);
        toast.success(res.message ?? "Profile photo removed.");
      } else toast.error(res.error);
    });

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        className="group relative rounded-full outline-offset-4"
        aria-label="Change profile photo"
      >
        <Avatar src={preview} name={name} email={email} className="size-24 text-2xl ring-2 ring-white/10" />
        <span className="absolute inset-0 grid place-items-center rounded-full bg-ink-950/60 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="size-6 text-white" />
        </span>
        {pending && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-ink-950/70">
            <Loader2 className="size-6 animate-spin text-white" />
          </span>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 grid size-8 place-items-center rounded-full border-2 border-ink-850 bg-brand-600 text-white shadow-lg">
          <Camera className="size-4" />
        </span>
      </button>

      <div className="min-w-0">
        <p className="font-semibold text-white">Profile photo</p>
        <p className="mt-0.5 text-sm text-slate">JPG, PNG or WebP. It&apos;s cropped to a square and shown as a circle.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => input.current?.click()} disabled={pending}>
            <Camera className="size-4" /> {preview ? "Change photo" : "Upload photo"}
          </Button>
          {preview && (
            <Button type="button" size="sm" variant="danger-soft" onClick={remove} disabled={pending}>
              <Trash2 className="size-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPick} />
    </div>
  );
}
