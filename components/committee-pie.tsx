"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CommitteeAllocation } from "@/lib/calc/portfolio";
import { fmtCurrency } from "./format";

export function CommitteePie({ data }: { data: CommitteeAllocation[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-zinc-500 dark:text-zinc-500">
        No positions yet
      </div>
    );
  }

  // Sort committees so the legend reads from largest to smallest weight,
  // which is how a PM would naturally scan it.
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 gap-10 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sorted}
              dataKey="value"
              nameKey="name"
              innerRadius={66}
              outerRadius={110}
              paddingAngle={0.6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {sorted.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              contentStyle={{
                backgroundColor: "var(--chart-tooltip-bg)",
                border: "1px solid var(--chart-tooltip-border)",
                borderRadius: "2px",
                fontSize: "11px",
                padding: "8px 10px",
                boxShadow: "none",
              }}
              formatter={(value: number, _name, entry) => {
                const p = entry.payload as CommitteeAllocation;
                return [
                  `${fmtCurrency(value)} · ${(p.pct * 100).toFixed(1)}%`,
                  p.name,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="divide-y divide-zinc-100 self-center dark:divide-zinc-800/80">
        {sorted.map((d) => (
          <li
            key={d.id}
            className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="truncate text-zinc-800 dark:text-zinc-200">
                {d.name}
              </span>
            </div>
            <div className="flex items-baseline gap-3 tabular-nums">
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {fmtCurrency(d.value)}
              </span>
              <span className="w-12 text-right text-zinc-900 dark:text-zinc-100">
                {(d.pct * 100).toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
