import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { maskEmail } from "@/lib/utils";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify it's you", robots: { index: false, follow: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { next } = await searchParams;
  return <VerifyForm email={maskEmail(session.email)} next={next} />;
}
