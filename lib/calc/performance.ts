export type Tick = { observed_at: string; price: number };
export type PositionShares = { ticker: string; shares: number };

/**
 * Build an intraday fund-value series from a set of ticks.
 * For each unique tick timestamp T, the fund value is the sum over all
 * positions of (shares × most-recent-tick-for-that-ticker-at-or-before-T).
 * Tickers with no tick yet at T contribute 0.
 *
 * `ticksByTicker` values must be sorted ascending by observed_at.
 */
export function buildIntradayFundSeries(
  positions: PositionShares[],
  ticksByTicker: ReadonlyMap<string, Tick[]>,
): { t: string; fund: number }[] {
  const timestamps = new Set<string>();
  for (const ticks of ticksByTicker.values()) {
    for (const tick of ticks) timestamps.add(tick.observed_at);
  }
  const sorted = [...timestamps].sort();

  return sorted.map((t) => {
    let fund = 0;
    for (const p of positions) {
      const ticks = ticksByTicker.get(p.ticker);
      if (!ticks) continue;
      let price = 0;
      for (const tick of ticks) {
        if (tick.observed_at <= t) price = tick.price;
        else break;
      }
      fund += p.shares * price;
    }
    return { t, fund: round2(fund) };
  });
}

/**
 * Scale a price series so its first point is 100. Used for the benchmark
 * line so it shares a y-axis with the fund line in the UI.
 */
export function normalizeToHundred<T extends { price: number }>(
  rows: T[],
): (Omit<T, "price"> & { value: number })[] {
  if (rows.length === 0) return [];
  const base = rows[0].price;
  return rows.map(({ price, ...rest }) => ({
    ...rest,
    value: base === 0 ? 0 : round2((price / base) * 100),
  }));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
