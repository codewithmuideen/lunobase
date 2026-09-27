"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { sendAdminAlert } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import type { ActionResult } from "@/lib/types";

const CATEGORIES = ["general", "withdrawal", "deposit", "trading", "account", "security"];

export async function createTicketAction(input: { subject: string; category: string; message: string }): Promise<ActionResult<{ id: string }>> {
  const ctx = await currentUser();
  if (!ctx) return { ok: false, error: "Your session has expired. Please sign in again." };
  const subject = String(input.subject ?? "").trim().slice(0, 140);
  const message = String(input.message ?? "").trim().slice(0, 5000);
  const category = CATEGORIES.includes(input.category) ? input.category : "general";
  if (subject.length < 4) return { ok: false, error: "Add a short subject." };
  if (message.length < 10) return { ok: false, error: "Tell us a bit more so we can help." };
  if (!(await rateLimit(`ticket:${ctx.profile.id}`, 5, 3600))) {
    return { ok: false, error: "You've opened several tickets recently. Please reply in an existing one." };
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("support_tickets")
    .insert({ user_id: ctx.profile.id, subject, category } as never)
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not open a ticket. Please try again." };
  const id = (data as { id: string }).id;
  await db.from("ticket_messages").insert({ ticket_id: id, author_id: ctx.profile.id, body: message } as never);

  await sendAdminAlert(
    templates.adminAlert({
      title: `New ${category} ticket: ${subject}`,
      lines: [
        ["User", ctx.profile.email],
        ["Category", category],
        ["Message", message.slice(0, 300)],
      ],
      url: `${SITE_URL}/admin/tickets/${id}`,
    }),
  );
  revalidatePath("/dashboard/support");
  return { ok: true, data: { id }, message: "Ticket opened. Our team usually replies within a few hours." };
}

export async function replyTicketAction(input: { ticketId: string; message: string }): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return { ok: false, error: "Your session has expired. Please sign in again." };
  const message = String(input.message ?? "").trim().slice(0, 5000);
  if (message.length < 2) return { ok: false, error: "Write a message first." };
  if (!(await rateLimit(`ticket-reply:${ctx.profile.id}`, 20, 3600))) return { ok: false, error: "Slow down a little." };

  const db = createAdminClient();
  const { data: t } = await db.from("support_tickets").select("id, user_id, subject").eq("id", input.ticketId).maybeSingle();
  const ticket = t as { id: string; user_id: string; subject: string } | null;
  if (!ticket || ticket.user_id !== ctx.profile.id) return { ok: false, error: "Ticket not found." };

  await db.from("ticket_messages").insert({ ticket_id: ticket.id, author_id: ctx.profile.id, body: message } as never);
  await db.from("support_tickets").update({ status: "open", updated_at: new Date().toISOString() } as never).eq("id", ticket.id);
  await sendAdminAlert(
    templates.adminAlert({
      title: `Ticket reply: ${ticket.subject}`,
      lines: [["User", ctx.profile.email], ["Message", message.slice(0, 300)]],
      url: `${SITE_URL}/admin/tickets/${ticket.id}`,
    }),
  );
  revalidatePath(`/dashboard/support/${ticket.id}`);
  return { ok: true };
}
