import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/market";

export const revalidate = 30;

export async function GET() {
  const coins = await getMarkets(100);
  return NextResponse.json(coins, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
