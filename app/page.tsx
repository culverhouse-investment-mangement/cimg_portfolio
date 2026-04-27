import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSummary } from "@/lib/portfolio/summary";
import { getPositions } from "@/lib/portfolio/positions";
import { getWinnersLosers } from "@/lib/portfolio/winners-losers";
import { getCommitteeAllocations } from "@/lib/portfolio/committees";
import { getDividendSummary } from "@/lib/portfolio/dividends";
import { CommitteePie } from "@/components/committee-pie";
import { PerformanceChart } from "@/components/performance-chart";
import { PositionsTable } from "@/components/positions-table";
import { SummaryPanel } from "@/components/summary-panel";
import { WinnersLosersPanel } from "@/components/winners-losers-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExportAllButton } from "@/components/export-all-button";
import { RiskMetricsPanel } from "@/components/risk-metrics-panel";
import { AttributionPanel } from "@/components/attribution-panel";
import { DividendPanel } from "@/components/dividend-panel";
import { fmtDateShort } from "@/components/format";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const [summary, positions, moves, committees, dividends] = await Promise.all([
    getSummary(supabase),
    getPositions(supabase),
    getWinnersLosers(supabase),
    getCommitteeAllocations(supabase),
    getDividendSummary(supabase),
  ]);

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-12 flex flex-col items-start gap-5 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Culverhouse Investment Management Group
          </p>
          <h1 className="mt-2 font-display text-[2.75rem] font-medium leading-[1.05] tracking-tightest text-zinc-900 dark:text-zinc-50 sm:text-[3.25rem]">
            Portfolio
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Prices as of {fmtDateShort(summary.as_of)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportAllButton
            summary={summary}
            positions={positions}
            moves={moves}
          />
          <Link
            href="/admin"
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Admin Sign In
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <Section>
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SummaryPanel summary={summary} />
          </div>
          <div className="lg:col-span-1">
            <WinnersLosersPanel moves={moves} />
          </div>
        </div>
      </Section>

      <Section>
        <RiskMetricsPanel summary={summary} />
      </Section>

      <Section>
        <AttributionPanel positions={positions} summary={summary} />
      </Section>

      <Section>
        <DividendPanel summary={dividends} />
      </Section>

      <Section>
        <PerformanceChart
          postInjection={{
            startDate: summary.capital_injection_date,
            asOf: summary.as_of,
            cimgTotalPct: summary.cimg_post_capital_injection_pct,
            spyTotalPct: summary.spy_post_capital_injection_pct,
          }}
        />
      </Section>

      <Section>
        <SectionHead eyebrow="Holdings" title="Positions" />
        <PositionsTable positions={positions} />
      </Section>

      <Section>
        <SectionHead eyebrow="Allocation" title="Committee weights" />
        <CommitteePie data={committees} />
      </Section>

      <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800 pt-6 text-xs text-zinc-500 dark:text-zinc-500">
        <a
          href="https://github.com/jaxsonliening/cimg_portfolio"
          className="hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          Source on GitHub
        </a>
      </footer>
    </main>
  );
}

// Single shared section spacer. Keeps the layout's vertical rhythm in
// one place — every block of the dashboard breathes the same way.
function Section({ children }: { children: React.ReactNode }) {
  return <section className="mb-14 sm:mb-16">{children}</section>;
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
        {eyebrow}
      </span>
      <h2 className="font-display text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
    </div>
  );
}
