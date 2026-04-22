import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { latestPricesFor } from "@/lib/queries/latest-prices";

export const revalidate = 60;

export async function GET() {
  const supabase = await createClient();

  const { data: positions, error: positionsError } = await supabase
    .from("positions")
    .select("ticker, shares")
    .is("closed_at", null);
  if (positionsError) return fail("positions_query_failed", positionsError.message);

  const tickers = Array.from(new Set(positions.map((p) => p.ticker)));

  let prices: Map<string, number>;
  try {
    prices = await latestPricesFor(supabase, tickers);
  } catch (err) {
    return fail("price_lookup_failed", err instanceof Error ? err.message : "unknown");
  }

  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getUTCFullYear()}-01-01`;

  const [latestFundRes, previousFundRes, ytdFundRes, inceptionFundRes] = await Promise.all([
    supabase
      .from("fund_snapshots")
      .select("snapshot_date, cash")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fund_snapshots")
      .select("total_value")
      .lt("snapshot_date", today)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fund_snapshots")
      .select("total_value")
      .gte("snapshot_date", yearStart)
      .order("snapshot_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fund_snapshots")
      .select("total_value")
      .order("snapshot_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const cash = latestFundRes.data?.cash ?? 0;
  const openMarketValue = positions.reduce(
    (sum, p) => sum + p.shares * (prices.get(p.ticker) ?? 0),
    0,
  );
  const totalValue = openMarketValue + cash;

  const dailyPnl = previousFundRes.data
    ? totalValue - previousFundRes.data.total_value
    : null;
  const dailyPct =
    previousFundRes.data && previousFundRes.data.total_value > 0
      ? dailyPnl! / previousFundRes.data.total_value
      : null;

  const ytdPnl = ytdFundRes.data ? totalValue - ytdFundRes.data.total_value : null;
  const ytdPct =
    ytdFundRes.data && ytdFundRes.data.total_value > 0
      ? ytdPnl! / ytdFundRes.data.total_value
      : null;

  const inceptionPnl = inceptionFundRes.data
    ? totalValue - inceptionFundRes.data.total_value
    : null;
  const inceptionPct =
    inceptionFundRes.data && inceptionFundRes.data.total_value > 0
      ? inceptionPnl! / inceptionFundRes.data.total_value
      : null;

  return NextResponse.json(
    {
      as_of: latestFundRes.data?.snapshot_date ?? today,
      total_value: round2(totalValue),
      cash: round2(cash),
      daily_pnl: dailyPnl === null ? null : round2(dailyPnl),
      daily_pct: dailyPct,
      ytd_pnl: ytdPnl === null ? null : round2(ytdPnl),
      ytd_pct: ytdPct,
      inception_pnl: inceptionPnl === null ? null : round2(inceptionPnl),
      inception_pct: inceptionPct,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function fail(code: string, message: string) {
  return NextResponse.json({ error: code, message }, { status: 500 });
}
