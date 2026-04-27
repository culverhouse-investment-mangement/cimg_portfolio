import type { PortfolioSummary, PositionRow } from "@/lib/portfolio/types";
import { fmtPctSigned, fmtSignedCurrency, toneClass } from "./format";

// "Where is our return coming from?" The summary panel shows aggregate
// P&L; this card breaks it down three ways so the PM can answer the
// classic attribution question without a spreadsheet:
//
//   - Top contributors: five positions with the largest positive
//     unrealized P&L, as a share of the full portfolio.
//   - Top detractors: five with the most negative.
//   - By committee: net unrealized P&L per committee, sorted by size.
//
// Contribution is expressed as percentage points of portfolio value,
// so the numbers sum (approximately) to the total unrealized return.

type CommitteeLine = {
  name: string;
  color: string | null;
  pnl: number;
  contribution: number;
};

export function AttributionPanel({
  positions,
  summary,
}: {
  positions: PositionRow[];
  summary: PortfolioSummary;
}) {
  const portfolioValue = summary.market_value_portfolio;
  if (positions.length === 0 || portfolioValue <= 0) {
    return null;
  }

  const withContribution = positions
    .filter((p) => p.unrealized_pnl !== null)
    .map((p) => ({
      ...p,
      pnl: p.unrealized_pnl as number,
      contribution: (p.unrealized_pnl as number) / portfolioValue,
    }));

  const contributors = [...withContribution]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);
  const detractors = [...withContribution]
    .sort((a, b) => a.contribution - b.contribution)
    .slice(0, 5);

  const byCommittee = new Map<string, CommitteeLine>();
  for (const p of withContribution) {
    if (!p.committee) continue;
    const key = p.committee.id;
    const existing = byCommittee.get(key);
    if (existing) {
      existing.pnl += p.pnl;
      existing.contribution += p.contribution;
    } else {
      byCommittee.set(key, {
        name: p.committee.name,
        color: p.committee.color,
        pnl: p.pnl,
        contribution: p.contribution,
      });
    }
  }
  const committees = Array.from(byCommittee.values()).sort(
    (a, b) => b.contribution - a.contribution,
  );

  return (
    <div>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          Attribution
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          Unrealized P&amp;L as a share of total portfolio value
        </span>
      </div>
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 border-t border-zinc-200 pt-6 dark:border-zinc-800 md:grid-cols-3">
        <ContributorsList title="Top contributors" rows={contributors} tone="up" />
        <ContributorsList title="Top detractors" rows={detractors} tone="down" />
        <CommitteeList rows={committees} />
      </div>
    </div>
  );
}

function ContributorsList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: (PositionRow & { pnl: number; contribution: number })[];
  tone: "up" | "down";
}) {
  void tone;
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
        {title}
      </h3>
      {rows.length === 0 ? (
        <div className="text-sm text-zinc-400 dark:text-zinc-600">—</div>
      ) : (
        <ul className="divide-y divide-zinc-100 border-t border-zinc-200 dark:divide-zinc-800/80 dark:border-zinc-800">
          {rows.map((p) => (
            <li
              key={p.ticker}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {p.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500">
                  {p.ticker} · {fmtSignedCurrency(p.pnl)}
                </div>
              </div>
              <div
                className={`shrink-0 tabular-nums ${toneClass(p.contribution)}`}
              >
                {fmtPctSigned(p.contribution)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommitteeList({ rows }: { rows: CommitteeLine[] }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
        By committee
      </h3>
      {rows.length === 0 ? (
        <div className="text-sm text-zinc-400 dark:text-zinc-600">—</div>
      ) : (
        <ul className="divide-y divide-zinc-100 border-t border-zinc-200 dark:divide-zinc-800/80 dark:border-zinc-800">
          {rows.map((c) => (
            <li
              key={c.name}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color ?? "#a1a1aa" }}
                  aria-hidden
                />
                <span className="truncate text-zinc-800 dark:text-zinc-200">
                  {c.name}
                </span>
              </div>
              <div
                className={`shrink-0 tabular-nums ${toneClass(c.contribution)}`}
              >
                {fmtPctSigned(c.contribution)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
