import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  MoverRow,
  PositionRow,
  WinnersLosers,
} from "@/lib/portfolio/types";
import { getPositions } from "@/lib/portfolio/positions";

export async function getWinnersLosers(
  supabase: SupabaseClient<Database>,
): Promise<WinnersLosers> {
  const rows = await getPositions(supabase);
  return computeWinnersLosers(rows);
}

export function computeWinnersLosers(rows: PositionRow[]): WinnersLosers {
  const withChange = rows.filter(
    (r): r is PositionRow & { day_change_pct: number } =>
      r.day_change_pct !== null,
  );

  const winners: MoverRow[] = [...withChange]
    .sort((a, b) => b.day_change_pct - a.day_change_pct)
    .slice(0, 3)
    .map(toMoverRow);

  const losers: MoverRow[] = [...withChange]
    .sort((a, b) => a.day_change_pct - b.day_change_pct)
    .slice(0, 3)
    .map(toMoverRow);

  return { winners, losers };
}

function toMoverRow(r: PositionRow & { day_change_pct: number }): MoverRow {
  return {
    ticker: r.ticker,
    name: r.name,
    day_change_pct: r.day_change_pct,
  };
}
