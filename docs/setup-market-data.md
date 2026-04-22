# Setting up market data

Once the dashboard is running on seed data, the next step is to ingest live prices. Prices land in two shapes:

- **Intraday ticks** → `price_ticks` table. Written every 15 min during US market hours.
- **Daily closes + fundamentals** → `price_snapshots` table. Written once after close, with market cap, P/E, EPS, etc.

Both are populated by route handlers under `/api/cron/*` that call the **Financial Modeling Prep** (FMP) API. GitHub Actions fires those routes on a cron schedule so you don't have to keep a worker running.

## 1. Get an FMP API key

1. Sign up at [financialmodelingprep.com](https://financialmodelingprep.com). Free tier is plenty: 250 requests/day covers a 26-ticker portfolio refreshing every 15 min during market hours (~104 refreshes × ~2 batched calls = ~210 calls/day).
2. Copy the API key from your dashboard.

Optional: grab an [Alpha Vantage](https://www.alphavantage.co) key too. The code falls back to Alpha Vantage if FMP returns zero results. Nice-to-have, not required.

## 2. Generate a cron secret

```bash
openssl rand -hex 32
```

Copy the output. This is the shared secret that authenticates GitHub Actions → your deployed app.

## 3. Fill in `.env.local`

```
FMP_API_KEY=your_fmp_key
ALPHA_VANTAGE_API_KEY=optional_av_key
CRON_SECRET=the_hex_string_you_just_generated
```

Restart the dev server so it picks up the new values.

## 4. Pull today's prices right now (optional)

Before scheduling anything, confirm the pipe works:

```bash
npm run fetch-now             # intraday tick
npm run fetch-now -- daily    # end-of-day snapshot + fundamentals
```

This hits `/api/cron/tick?force=1` and `/api/cron/daily` on your local dev server with the right bearer token. `force=1` bypasses the market-hours guard so you can test on weekends / evenings.

Successful output looks like:
```json
{
  "status": "ok",
  "at": "2026-04-22T20:15:00.000Z",
  "tickers": 26,
  "benchmark": true,
  "missing": []
}
```

Reload `localhost:3000` — day/week/month change columns should now have numbers instead of dashes.

## 5. Schedule it on GitHub Actions (production)

The workflows are already committed:

- `.github/workflows/snapshot-ticks.yml` → hits `/api/cron/tick` every 15 min, weekdays 13:00–21:15 UTC.
- `.github/workflows/snapshot-daily.yml` → hits `/api/cron/daily` once per weekday evening.

Both need two repo secrets (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret | Value |
| --- | --- |
| `APP_URL` | Your Vercel URL, e.g. `https://cimg-portfolio.vercel.app`. No trailing slash. |
| `CRON_SECRET` | The hex string from step 2 — **must match** `CRON_SECRET` in Vercel's env. |

In **Vercel → Project Settings → Environment Variables**, add the same set you put in `.env.local`: `FMP_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `CRON_SECRET`, plus the Supabase trio. Redeploy after adding them.

After that:
- First scheduled tick fires at the next `:00/:15/:30/:45` minute during market hours.
- You can kick a run immediately from **GitHub → Actions → snapshot-ticks → Run workflow**.

## Troubleshooting

- **`npm run fetch-now` → `unauthorized`** — `CRON_SECRET` in `.env.local` doesn't match what the server started with. Restart `npm run start` / `npm run dev` after changing the value.
- **`npm run fetch-now` → `config_error`** — `SUPABASE_SERVICE_ROLE_KEY` or the Supabase URL isn't set, so the admin client can't initialize.
- **`fmp_quote_failed`** — bad / rate-limited `FMP_API_KEY`. Check the FMP dashboard for daily-limit status.
- **Dashboard still shows seed prices after a successful fetch** — server-component cache. Hard-reload or wait for `revalidate = 60` on `app/page.tsx` to expire (up to 60 seconds).
- **`skipped: outside_market_hours`** — the cron correctly skipped because the US market is closed. Add `?force=1` to the URL (which `npm run fetch-now` already does) to override.
