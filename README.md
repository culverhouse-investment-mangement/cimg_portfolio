# cimg_portfolio

Public portfolio management dashboard for **CIMG**. Replaces a spreadsheet with a live site that anyone can view and a secure admin area where the group's Portfolio Manager maintains positions.

## What it shows

- **Fund vs S&P 500** performance chart since inception, with `1M / 3M / 6M / YTD / 1Y / All` toggles
- **Summary stats** — total portfolio value, daily P&L, daily %, YTD P&L, YTD %
- **Committee allocation** pie chart (7 committees)
- **Positions table** with a one-click toggle between:
  - Portfolio view — cost basis, purchase date, committee, current market value, unrealized P&L
  - Fundamentals view — market cap, enterprise value, P/E, EPS, dividend yield, sector
- **Public JSON API** — every number on the page is reachable programmatically

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, React 19) on [Vercel](https://vercel.com) free tier
- [Supabase](https://supabase.com) Postgres + Auth for data and PM login (free tier)
- [Tailwind CSS](https://tailwindcss.com) + [Recharts](https://recharts.org) (shadcn/ui added as we build components)
- Market data from [Financial Modeling Prep](https://financialmodelingprep.com) with Alpha Vantage as fallback
- Price ingestion runs on GitHub Actions: 15-min intraday ticks + a daily close/fundamentals job

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in Supabase + FMP keys
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

To apply the database schema, open the Supabase SQL editor and paste [`supabase/schema.sql`](supabase/schema.sql).

## Docs

- [`docs/architecture.md`](docs/architecture.md) — stack, hosting, data flow
- [`docs/data-model.md`](docs/data-model.md) — database schema and invariants
- [`docs/api.md`](docs/api.md) — public API contract
- [`CLAUDE.md`](CLAUDE.md) — guidance for Claude Code working in this repo

## License

MIT. See [`LICENSE`](LICENSE).
