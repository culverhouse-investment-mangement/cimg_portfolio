import type { WinnersLosers, MoverRow } from "@/lib/portfolio/types";
import { fmtPctSigned } from "./format";

export function WinnersLosersPanel({
  moves,
}: {
  moves: WinnersLosers;
}) {
  return (
    <div className="flex flex-col gap-8">
      <MoversList title="Today's gainers" rows={moves.winners} variant="up" />
      <MoversList title="Today's decliners" rows={moves.losers} variant="down" />
    </div>
  );
}

function MoversList({
  title,
  rows,
  variant,
}: {
  title: string;
  rows: MoverRow[];
  variant: "up" | "down";
}) {
  const tone =
    variant === "up"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-rose-700 dark:text-rose-400";

  const padded: (MoverRow | null)[] = [...rows];
  while (padded.length < 3) padded.push(null);

  return (
    <div>
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
        {title}
      </h3>
      <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {padded.map((m, i) => (
          <li
            key={m?.ticker ?? `empty-${i}`}
            className="flex items-center justify-between py-3 text-sm"
          >
            {m ? (
              <>
                <div className="min-w-0 flex-1 pr-4">
                  <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {m.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    {m.ticker}
                  </div>
                </div>
                <div className={`tabular-nums ${tone}`}>
                  {fmtPctSigned(m.day_change_pct)}
                </div>
              </>
            ) : (
              <span className="text-zinc-300 dark:text-zinc-700">—</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
