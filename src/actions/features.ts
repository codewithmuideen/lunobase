"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { currentAdmin, currentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSET_BY_SYMBOL, QUOTE } from "@/lib/assets";
import { getExecutionPrice } from "@/lib/market";
import { SITE_URL } from "@/lib/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { sendAdminAlert } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { friendlyError } from "@/lib/errors";
import { formatAmount, formatPrice } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

const EXPIRED = { ok: false as const, error: "Your session has expired. Please sign in again." };
const NOT_READY = { ok: false as const, error: "This feature is being set up. Please try again shortly." };

/** Postgres/PostgREST codes for "table or function doesn't exist yet" (migration 0003 not run). */
function missing(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42P01" || /does not exist|schema cache/i.test(error.message ?? ""));
}

function sniffImage(b: Uint8Array): { ext: string; mime: string } | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { ext: "webp", mime: "image/webp" };
  }
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  return null;
}

// ---------------------------------------------------------------------------
// Identity verification (KYC)
// ---------------------------------------------------------------------------
const DOC_TYPES = ["passport", "national_id", "drivers_license"];
const KYC_MAX_BYTES = 1500 * 1024;

export async function submitKycAction(fd: FormData): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  const { profile } = ctx;
  if (profile.kyc_status === "verified") return { ok: false, error: "Your identity is already verified." };
  if (profile.kyc_status === "pending") return { ok: false, error: "Your documents are already under review." };

  const legalName = String(fd.get("legal_name") ?? "").trim().slice(0, 100);
  const dob = String(fd.get("date_of_birth") ?? "");
  const country = String(fd.get("country") ?? "").trim().slice(0, 60);
  const docType = String(fd.get("doc_type") ?? "");
  const docNumber = String(fd.get("doc_number") ?? "").trim().slice(0, 40);
  if (legalName.length < 3) return { ok: false, error: "Enter your full legal name as shown on your ID." };
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return { ok: false, error: "Enter your date of birth." };
  const age = (Date.now() - birth.getTime()) / (365.25 * 86_400_000);
  if (age < 18) return { ok: false, error: "You must be 18 or older to use Lunobase." };
  if (age > 120) return { ok: false, error: "Enter a valid date of birth." };
  if (!country) return { ok: false, error: "Select the country that issued your document." };
  if (!DOC_TYPES.includes(docType)) return { ok: false, error: "Choose a document type." };
  if (docNumber.length < 4) return { ok: false, error: "Enter your document number." };

  if (!(await rateLimit(`kyc:${profile.id}`, 4, 86_400))) {
    return { ok: false, error: "Too many submissions today. Please try again tomorrow." };
  }

  const db = createAdminClient();
  const stamp = Date.now();
  const paths: Record<string, string | null> = { front: null, back: null, selfie: null };
  for (const key of ["front", "back", "selfie"] as const) {
    const file = fd.get(key);
    if (!(file instanceof File) || file.size === 0) {
      if (key === "back") continue; // back side is optional (passports have none)
      return { ok: false, error: key === "front" ? "Upload a photo of your document." : "Upload a selfie holding your document." };
    }
    if (file.size > KYC_MAX_BYTES) return { ok: false, error: "One of the images is too large. Please retake it." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return { ok: false, error: "Only JPG, PNG or WebP images are accepted." };
    const path = `${profile.id}/${stamp}-${key}.${kind.ext}`;
    const { error } = await db.storage.from("kyc").upload(path, bytes, { contentType: kind.mime, upsert: false });
    if (error) {
      console.error("[kyc] upload", error.message);
      return { ok: false, error: "Could not upload your documents. Please try again." };
    }
    paths[key] = path;
  }

  const { error } = await db.from("kyc_submissions").insert({
    user_id: profile.id,
    legal_name: legalName,
    date_of_birth: dob,
    country,
    doc_type: docType,
    doc_number: docNumber,
    front_path: paths.front,
    back_path: paths.back,
    selfie_path: paths.selfie,
  } as never);
  if (error) {
    await db.storage.from("kyc").remove(Object.values(paths).filter(Boolean) as string[]);
    return missing(error) ? NOT_READY : { ok: false, error: "Could not submit your verification. Please try again." };
  }
  await db.from("profiles").update({ kyc_status: "pending" } as never).eq("id", profile.id);

  after(() =>
    sendAdminAlert(
      templates.adminAlert({
        title: "New identity verification to review",
        lines: [["User", profile.email], ["Name on ID", legalName], ["Document", docType.replace("_", " ")]],
        url: `${SITE_URL}/admin/kyc`,
      }),
    ),
  );
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Documents submitted. We usually review within 24 hours." };
}

export async function reviewKycAction(input: { id: string; approve: boolean; note?: string }): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Admin access required." };
  const note = input.note?.trim() || null;
  if (!input.approve && !note) return { ok: false, error: "Add a reason the user will see." };

  const db = createAdminClient();
  const { data, error } = await db
    .from("kyc_submissions")
    .update({ status: input.approve ? "approved" : "rejected", admin_note: note, reviewed_by: admin.profile.id, reviewed_at: new Date().toISOString() } as never)
    .eq("id", input.id)
    .eq("status", "pending")
    .select("user_id")
    .maybeSingle();
  if (error) return missing(error) ? NOT_READY : { ok: false, error: "Could not update this submission." };
  if (!data) return { ok: false, error: "This submission has already been reviewed." };
  const userId = (data as { user_id: string }).user_id;

  await Promise.all([
    db.from("profiles").update({ kyc_status: input.approve ? "verified" : "rejected" } as never).eq("id", userId),
    db.from("notifications").insert({
      user_id: userId,
      kind: "kyc",
      title: input.approve ? "Identity verified" : "Verification not approved",
      body: input.approve ? "Your account is now fully verified." : (note ?? "Please submit your documents again."),
      link: "/dashboard/verify",
    } as never),
    db.from("audit_log").insert({ admin_id: admin.profile.id, action: input.approve ? "kyc.approve" : "kyc.reject", target_user: userId, details: { submission: input.id, note } } as never),
  ]);
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: input.approve ? "User verified." : "Submission rejected." };
}

// ---------------------------------------------------------------------------
// Demo account (practice funds only)
// ---------------------------------------------------------------------------
export async function demoTradeAction(input: { side: "buy" | "sell"; asset: string; amount: number }): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  const side = input.side === "sell" ? "sell" : "buy";
  const asset = String(input.asset).toUpperCase();
  const amount = Number(input.amount);
  if (!ASSET_BY_SYMBOL[asset] || asset === QUOTE) return { ok: false, error: "This asset isn't supported." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (!(await rateLimit(`demo:${ctx.profile.id}`, 40, 60))) return { ok: false, error: "Slow down a little." };

  let price: number;
  try {
    price = await getExecutionPrice(asset);
  } catch {
    return { ok: false, error: friendlyError("PRICE_UNAVAILABLE") };
  }
  // buy: amount is practice USDT to spend. sell: amount is the quantity of the asset.
  const quantity = Math.floor((side === "buy" ? amount / price : amount) * 1e8) / 1e8;
  if (quantity <= 0) return { ok: false, error: "Amount is too small." };

  const { error } = await createAdminClient().rpc("demo_trade", {
    p_user: ctx.profile.id,
    p_side: side,
    p_asset: asset,
    p_quantity: quantity,
    p_price: price,
  } as never);
  if (error) return missing(error) ? NOT_READY : { ok: false, error: friendlyError(error.message) };
  revalidatePath("/dashboard/demo");
  return { ok: true, message: `Practice ${side === "buy" ? "buy" : "sell"}: ${formatAmount(quantity)} ${asset} at ${formatPrice(price)}` };
}

export async function demoResetAction(): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  if (!(await rateLimit(`demo-reset:${ctx.profile.id}`, 5, 3600))) return { ok: false, error: "You've reset a few times already. Try again later." };
  const { error } = await createAdminClient().rpc("demo_reset", { p_user: ctx.profile.id } as never);
  if (error) return missing(error) ? NOT_READY : { ok: false, error: "Could not reset your demo account." };
  revalidatePath("/dashboard/demo");
  return { ok: true, message: "Demo account reset to 10,000 practice USDT." };
}
