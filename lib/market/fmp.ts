// FMP /stable/ client, tuned for the free tier's limits.
//
// After the Aug 31 2025 legacy-endpoint retirement, FMP charges a
// premium fee for batch requests to /stable/quote (comma-list in
// `symbol` returns 402 "Premium Query Parameter" on a free key).
// The free-tier batch equivalent is /stable/batch-quote-short,
// which returns only {symbol, price, change, volume} — fine for
// the intraday tick, not enough for daily fundamentals.
//
// Strategy:
//   - fetchQuotes(): single batch-quote-short call. Used by the
//     15-min tick, ~28 API calls/day well under the 250/day free
//     cap. marketCap / pe / eps come back null.
//   - fetchFullQuotes(): parallel single-symbol /stable/quote
//     calls. Used by the daily cron only, ~27 calls once per day.
//     Returns price + marketCap + pe + eps.
//   - fetchProfiles(): parallel single-symbol /stable/profile
//     calls. Used by the daily cron only.

const FMP_BASE = "https://financialmodelingprep.com/stable";

export type FmpQuote = {
  symbol: string;
  price: number;
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
};

export type FmpProfile = {
  symbol: string;
  sector: string | null;
  industry: string | null;
  companyName: string | null;
};

type RawShortQuote = { symbol?: unknown; price?: unknown };
type RawQuote = {
  symbol?: unknown;
  price?: unknown;
  marketCap?: unknown;
  pe?: unknown;
  eps?: unknown;
};
type RawProfile = {
  symbol?: unknown;
  sector?: unknown;
  industry?: unknown;
  companyName?: unknown;
};

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function apiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY is not set");
  return key;
}

// Intraday tick path: batch, price only. Fits free tier.
export async function fetchQuotes(tickers: string[]): Promise<FmpQuote[]> {
  if (tickers.length === 0) return [];
  const url = `${FMP_BASE}/batch-quote-short?symbols=${tickers.join(",")}&apikey=${apiKey()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`FMP quote ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const data: RawShortQuote[] = await res.json();

  return data
    .filter((d): d is RawShortQuote & { symbol: string; price: number } =>
      typeof d.symbol === "string" && typeof d.price === "number",
    )
    .map((d) => ({
      symbol: d.symbol,
      price: d.price,
      marketCap: null,
      pe: null,
      eps: null,
    }));
}

// Daily snapshot path: full fields, one symbol per request. Parallel.
// 27 tickers × 1 daily run = ~27 free-tier calls/day.
export async function fetchFullQuotes(tickers: string[]): Promise<FmpQuote[]> {
  if (tickers.length === 0) return [];
  const key = apiKey();

  const responses = await Promise.all(
    tickers.map(async (ticker) => {
      const url = `${FMP_BASE}/quote?symbol=${ticker}&apikey=${key}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          `FMP quote ${res.status} for ${ticker}: ${await res.text().catch(() => "")}`,
        );
      }
      const data: RawQuote[] = await res.json();
      return data[0] ?? null;
    }),
  );

  return responses
    .filter((d): d is RawQuote & { symbol: string; price: number } =>
      !!d && typeof d.symbol === "string" && typeof d.price === "number",
    )
    .map((d) => ({
      symbol: d.symbol,
      price: d.price,
      marketCap: numOrNull(d.marketCap),
      pe: numOrNull(d.pe),
      eps: numOrNull(d.eps),
    }));
}

// Daily fundamentals path: profile per symbol, parallel.
export async function fetchProfiles(tickers: string[]): Promise<FmpProfile[]> {
  if (tickers.length === 0) return [];
  const key = apiKey();

  const responses = await Promise.all(
    tickers.map(async (ticker) => {
      const url = `${FMP_BASE}/profile?symbol=${ticker}&apikey=${key}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          `FMP profile ${res.status} for ${ticker}: ${await res.text().catch(() => "")}`,
        );
      }
      const data: RawProfile[] = await res.json();
      return data[0] ?? null;
    }),
  );

  return responses
    .filter((d): d is RawProfile & { symbol: string } =>
      !!d && typeof d.symbol === "string",
    )
    .map((d) => ({
      symbol: d.symbol,
      sector: strOrNull(d.sector),
      industry: strOrNull(d.industry),
      companyName: strOrNull(d.companyName),
    }));
}
