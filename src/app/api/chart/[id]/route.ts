import { NextResponse, type NextRequest } from "next/server";
import { getCandles, getChart } from "@/lib/market";

const ALLOWED_DAYS = new Set(["1", "7", "14", "30", "90", "180", "365"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const days = request.nextUrl.searchParams.get("days") ?? "1";
  const type = request.nextUrl.searchParams.get("type") ?? "line";
  if (!/^[a-z0-9-]{1,80}$/.test(id) || !ALLOWED_DAYS.has(days)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = type === "candles" ? await getCandles(id, days) : await getChart(id, days);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
