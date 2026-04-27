"use client";

import type { PortfolioSummary } from "@/lib/portfolio/types";
import { ExportButton } from "./export-button";
import {
  fmtCurrency,
  fmtNumber,
  fmtPctPlain,
  fmtPctSigned,
  toneClass,
} from "./format";

export function SummaryPanel({ summary }: { summary: PortfolioSummary }) {
  // Post-injection returns are annualized (CAGR) from the total return
  // already computed in lib/portfolio/summary.ts. The total spans ~6
  // years of holding history; the per-year figure compares against
  // SPY at a glance better than the cumulative number does.
  const yearsPostInjection = yearsBetween(
    summary.capital_injection_date,
    summary.as_of,
  );
  const cimgPostAnn = annualize(
    summary.cimg_post_capital_injection_pct,
    yearsPostInjection,
  );
  const spyPostAnn = annualize(
    summary.spy_post_capital_injection_pct,
    yearsPostInjection,
  );

  const performance: PerfRow[] = [
    {
      label: "Day",
      cimg: summary.cimg_day_change_pct,
      spy: summary.spy_day_change_pct,
    },
    { label: "YTD", cimg: summary.cimg_ytd_pct, spy: summary.spy_ytd_pct },
    {
      label: "Pre capital injection",
      cimg: summary.cimg_pre_capital_injection_pct,
      spy: summary.spy_pre_capital_injection_pct,
    },
    {
      label: "Post capital injection",
      hint: "annualized",
      cimg: cimgPostAnn,
      spy: spyPostAnn,
    },
  ];

  // CSV export. Keeps the same flat shape consumers were getting before
  // the redesign (one label/value pair per metric) so the bulk download
  // stays interoperable with anyone scripting against it.
  const build = () => ({
    headers: ["Metric", "Value (decimal)", "Formatted"],
    rows: [
      ["Market Value of Equities", summary.market_value_equities, fmtCurrency(summary.market_value_equities)],
      ["Cash Balance", summary.cash_balance, fmtCurrency(summary.cash_balance)],
      ["Cash Position %", summary.cash_position_pct, fmtPctPlain(summary.cash_position_pct, 2)],
      ["Market Value of Portfolio", summary.market_value_portfolio, fmtCurrency(summary.market_value_portfolio)],
      ["Intrinsic Value of Portfolio", summary.intrinsic_value_portfolio, fmtCurrency(summary.intrinsic_value_portfolio)],
      ["Equity Portfolio V/P (ex-Cash)", summary.equity_vp_ex_cash, fmtNumber(summary.equity_vp_ex_cash, 2)],
      ["CIMG Day Change", summary.cimg_day_change_pct, fmtPctSigned(summary.cimg_day_change_pct)],
      ["SPY Day Change", summary.spy_day_change_pct, fmtPctSigned(summary.spy_day_change_pct)],
      ["CIMG YTD", summary.cimg_ytd_pct, fmtPctSigned(summary.cimg_ytd_pct)],
      ["SPY YTD", summary.spy_ytd_pct, fmtPctSigned(summary.spy_ytd_pct)],
      ["CIMG Pre Capital Injection", summary.cimg_pre_capital_injection_pct, fmtPctSigned(summary.cimg_pre_capital_injection_pct)],
      ["SPY Pre Capital Injection", summary.spy_pre_capital_injection_pct, fmtPctSigned(summary.spy_pre_capital_injection_pct)],
      ["CIMG Post Capital Injection (Annualized)", cimgPostAnn, fmtPctSigned(cimgPostAnn)],
      ["SPY Post Capital Injection (Annualized)", spyPostAnn, fmtPctSigned(spyPostAnn)],
    ] as (string | number | null)[][],
  });

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          Portfolio summary
        </span>
        <ExportButton filename="summary.csv" build={build} />
      </div>

      {/* Headline */}
      <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Total portfolio value
        </p>
        <p className="mt-1 font-display text-[2.5rem] font-medium leading-none tracking-tightest text-zinc-900 tabular-nums dark:text-zinc-50">
          {fmtCurrency(summary.market_value_portfolio)}
        </p>
      </div>

      {/* Sub-headline metrics in a row */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-zinc-200 py-6 dark:border-zinc-800 sm:grid-cols-4">
        <Stat label="Equities" value={fmtCurrency(summary.market_value_equities)} />
        <Stat label="Cash" value={fmtCurrency(summary.cash_balance)} />
        <Stat
          label="Cash position"
          value={fmtPctPlain(summary.cash_position_pct, 2)}
        />
        <Stat
          label="V/P (ex-cash)"
          value={fmtNumber(summary.equity_vp_ex_cash, 2)}
        />
      </dl>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:grid-cols-2">
        <Stat
          label="Intrinsic value of portfolio"
          value={fmtCurrency(summary.intrinsic_value_portfolio)}
        />
      </dl>

      {/* Performance vs benchmark */}
      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="mb-3 grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] gap-x-6 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          <div>Performance</div>
          <div className="text-right">CIMG</div>
          <div className="text-right">SPY</div>
          <div className="text-right">Δ vs SPY</div>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
          {performance.map((p) => (
            <PerfLine key={p.label} row={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

type PerfRow = {
  label: string;
  hint?: string;
  cimg: number | null;
  spy: number | null;
};

function PerfLine({ row }: { row: PerfRow }) {
  const delta =
    row.cimg !== null && row.spy !== null ? row.cimg - row.spy : null;
  return (
    <div className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] items-baseline gap-x-6 py-3 text-sm">
      <div className="text-zinc-700 dark:text-zinc-300">
        {row.label}
        {row.hint && (
          <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
            {row.hint}
          </span>
        )}
      </div>
      <div
        className={`text-right tabular-nums ${toneClass(row.cimg)}`}
      >
        {fmtPctSigned(row.cimg)}
      </div>
      <div className={`text-right tabular-nums ${toneClass(row.spy)}`}>
        {fmtPctSigned(row.spy)}
      </div>
      <div className={`text-right tabular-nums ${toneClass(delta)}`}>
        {fmtPctSigned(delta)}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-base font-medium text-zinc-900 tabular-nums dark:text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

function yearsBetween(startIso: string | null, endIso: string): number {
  if (!startIso) return 0;
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  return (end - start) / (365.25 * 24 * 60 * 60 * 1000);
}

function annualize(totalPct: number | null, years: number): number | null {
  if (totalPct === null || years <= 0) return null;
  return Math.pow(1 + totalPct, 1 / years) - 1;
}
