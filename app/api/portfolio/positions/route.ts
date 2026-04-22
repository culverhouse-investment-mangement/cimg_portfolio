import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { latestPricesFor } from "@/lib/queries/latest-prices";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeClosed = searchParams.get("include") === "closed";

  const supabase = await createClient();

  const positionsQuery = supabase
    .from("positions")
    .select(
      "id, ticker, name, committee_id, shares, cost_basis, purchased_at, closed_at, close_price",
    );

  const [positionsRes, committeesRes] = await Promise.all([
    includeClosed ? positionsQuery : positionsQuery.is("closed_at", null),
    supabase.from("committees").select("id, name"),
  ]);

  if (positionsRes.error) return fail("positions_query_failed", positionsRes.error.message);
  if (committeesRes.error) return fail("committees_query_failed", committeesRes.error.message);

  const committeesById = new Map(committeesRes.data.map((c) => [c.id, c]));
  const tickers = Array.from(new Set(positionsRes.data.map((p) => p.ticker)));

  let prices: Map<string, number>;
  try {
    prices = await latestPricesFor(supabase, tickers);
  } catch (err) {
    return fail("price_lookup_failed", err instanceof Error ? err.message : "unknown");
  }

  const openMarketValue = positionsRes.data
    .filter((p) => p.closed_at === null)
    .reduce((sum, p) => sum + p.shares * (prices.get(p.ticker) ?? 0), 0);

  const enriched = positionsRes.data.map((p) => {
    const currentPrice = prices.get(p.ticker) ?? null;
    const marketValue = currentPrice === null ? null : p.shares * currentPrice;
    const unrealizedPnl =
      currentPrice === null ? null : (currentPrice - p.cost_basis) * p.shares;
    const unrealizedPct =
      currentPrice === null || p.cost_basis === 0
        ? null
        : (currentPrice - p.cost_basis) / p.cost_basis;
    const weight =
      p.closed_at !== null || marketValue === null || openMarketValue === 0
        ? null
        : marketValue / openMarketValue;

    return {
      id: p.id,
      ticker: p.ticker,
      name: p.name,
      committee: committeesById.get(p.committee_id) ?? null,
      shares: p.shares,
      cost_basis: p.cost_basis,
      purchased_at: p.purchased_at,
      closed_at: p.closed_at,
      close_price: p.close_price,
      current_price: currentPrice,
      market_value: marketValue === null ? null : round2(marketValue),
      unrealized_pnl: unrealizedPnl === null ? null : round2(unrealizedPnl),
      unrealized_pct: unrealizedPct,
      weight,
    };
  });

  return NextResponse.json(enriched, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function fail(code: string, message: string) {
  return NextResponse.json({ error: code, message }, { status: 500 });
}
