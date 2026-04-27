import type { DividendSummary } from "@/lib/portfolio/dividends";
import { fmtCurrency, fmtDateShort } from "./format";

// Dividend income card for the public dashboard. Hides entirely when
// the group has never recorded a dividend, so the default state is a
// clean omission rather than a table full of zeros.

export function DividendPanel({ summary }: { summary: DividendSummary }) {
  if (summary.by_ticker.length === 0) return null;

  const stats: StatItem[] = [
    { label: "YTD", value: summary.ytd_total },
    { label: "Trailing 12 months", value: summary.twelve_month_total },
    { label: "All time", value: summary.all_time_total },
  ];

  return (
    <div>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          Dividend income
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          Cash dividends received, sorted by year-to-date
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-x-10 border-y border-zinc-200 py-6 dark:border-zinc-800">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </dl>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {summary.by_ticker.map((row) => (
          <li
            key={row.ticker}
            className="flex items-center justify-between gap-4 py-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.committee?.color ?? "#a1a1aa" }}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {row.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500">
                  {row.ticker}
                  {row.latest_payment ? (
                    <> · last paid {fmtDateShort(row.latest_payment)}</>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                {fmtCurrency(row.ytd_amount)}
              </div>
              <div className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-500">
                {fmtCurrency(row.twelve_month_amount)} TTM
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type StatItem = { label: string; value: number };

function Stat({ label, value }: StatItem) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd className="mt-1.5 font-display text-2xl font-medium leading-none tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {fmtCurrency(value)}
      </dd>
    </div>
  );
}
