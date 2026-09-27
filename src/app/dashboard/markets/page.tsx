import { requireUser } from "@/lib/auth";
import { getMarkets } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { WatchlistMarkets } from "@/components/dashboard/watchlist-markets";

export const metadata = { title: "Markets" };

export default async function DashboardMarketsPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [coins, wl] = await Promise.all([getMarkets(100), supabase.from("watchlist").select("coin_id").eq("user_id", profile.id)]);
  return (
    <>
      <PageHeader title="Markets" description="Live prices for the top 100 assets. Star coins to build your watchlist." />
      <div className="card p-3 sm:p-5">
        <WatchlistMarkets initial={coins} watchlist={((wl.data as { coin_id: string }[] | null) ?? []).map((w) => w.coin_id)} />
      </div>
    </>
  );
}
