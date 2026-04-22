import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { latestPricesFor } from "@/lib/queries/latest-prices";

export const revalidate = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  const supabase = await createClient();

  const [positionsRes, committeesRes, snapshotRes] = await Promise.all([
    supabase
      .from("positions")
      .select(
        "id, ticker, name, committee_id, shares, cost_basis, purchased_at, thesis, closed_at, close_price",
      )
      .eq("ticker", ticker)
      .order("purchased_at", { ascending: true }),
    supabase.from("committees").select("id, name"),
    supabase
      .from("price_snapshots")
      .select(
        "snapshot_date, market_cap, enterprise_value, pe_ratio, eps, dividend_yield, sector, industry",
      )
      .eq("ticker", ticker)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (positionsRes.error) return fail("positions_query_failed", positionsRes.error.message);
  if (committeesRes.error) return fail("committees_query_failed", committeesRes.error.message);
  if (positionsRes.data.length === 0) {
    return NextResponse.json(
      { error: "unknown_ticker", message: `No position found for ticker ${ticker}` },
      { status: 404 },
    );
  }

  const committeesById = new Map(committeesRes.data.map((c) => [c.id, c]));
  const prices = await latestPricesFor(supabase, [ticker]);
  const currentPrice = prices.get(ticker) ?? null;

  const lots = positionsRes.data.map((p) => {
    const marketValue =
      p.closed_at !== null || currentPrice === null ? null : p.shares * currentPrice;
    const unrealizedPnl =
      p.closed_at !== null || currentPrice === null
        ? null
        : (currentPrice - p.cost_basis) * p.shares;
    const unrealizedPct =
      p.closed_at !== null || currentPrice === null || p.cost_basis === 0
        ? null
        : (currentPrice - p.cost_basis) / p.cost_basis;
    const realizedPnl =
      p.closed_at !== null && p.close_price !== null
        ? (p.close_price - p.cost_basis) * p.shares
        : null;

    return {
      id: p.id,
      committee: committeesById.get(p.committee_id) ?? null,
      shares: p.shares,
      cost_basis: p.cost_basis,
      purchased_at: p.purchased_at,
      thesis: p.thesis,
      closed_at: p.closed_at,
      close_price: p.close_price,
      market_value: marketValue === null ? null : round2(marketValue),
      unrealized_pnl: unrealizedPnl === null ? null : round2(unrealizedPnl),
      unrealized_pct: unrealizedPct,
      realized_pnl: realizedPnl === null ? null : round2(realizedPnl),
    };
  });

  return NextResponse.json(
    {
      ticker,
      name: positionsRes.data[0].name,
      current_price: currentPrice,
      lots,
      fundamentals: snapshotRes.data
        ? {
            market_cap: snapshotRes.data.market_cap,
            enterprise_value: snapshotRes.data.enterprise_value,
            pe_ratio: snapshotRes.data.pe_ratio,
            eps: snapshotRes.data.eps,
            dividend_yield: snapshotRes.data.dividend_yield,
            sector: snapshotRes.data.sector,
            industry: snapshotRes.data.industry,
            as_of: snapshotRes.data.snapshot_date,
          }
        : null,
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
