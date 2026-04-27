import type { PortfolioSummary } from "@/lib/portfolio/types";
import { fmtNumber, fmtPctPlain } from "./format";

// Four standard fund-reporting metrics, computed over the post-
// capital-injection window so the Mar-2020 step doesn't skew them.

export function RiskMetricsPanel({ summary }: { summary: PortfolioSummary }) {
  const items: Item[] = [
    {
      label: "Beta vs S&P 500",
      value: fmtNumber(summary.beta, 2),
      sublabel: describeBeta(summary.beta),
    },
    {
      label: "Volatility",
      value: fmtPctPlain(summary.volatility, 1),
      sublabel: "Annualized, daily-return σ × √252",
    },
    {
      label: "Sharpe ratio",
      value: fmtNumber(summary.sharpe, 2),
      sublabel: "Net of 4% risk-free",
    },
    {
      label: "Max drawdown",
      value: fmtPctPlain(summary.max_drawdown, 1),
      sublabel: "Peak-to-trough since injection",
      negativeTone: true,
    },
  ];

  return (
    <div>
      <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
        Risk
      </h2>
      <dl className="grid grid-cols-2 gap-x-10 gap-y-7 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:grid-cols-4">
        {items.map((item) => (
          <Stat key={item.label} {...item} />
        ))}
      </dl>
    </div>
  );
}

type Item = {
  label: string;
  value: string;
  sublabel: string;
  negativeTone?: boolean;
};

function Stat({ label, value, sublabel, negativeTone }: Item) {
  const tone = negativeTone
    ? "text-rose-700 dark:text-rose-400"
    : "text-zinc-900 dark:text-zinc-50";
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd
        className={`mt-1.5 font-display text-3xl font-medium leading-none tabular-nums tracking-tight ${tone}`}
      >
        {value}
      </dd>
      <dd className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        {sublabel}
      </dd>
    </div>
  );
}

function describeBeta(beta: number | null): string {
  if (beta === null) return "Not enough history yet";
  if (beta < 0.8) return "Less volatile than SPY";
  if (beta > 1.2) return "More volatile than SPY";
  return "Tracks SPY closely";
}
