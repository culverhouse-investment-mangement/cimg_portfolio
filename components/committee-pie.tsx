"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CommitteeAllocation } from "@/lib/calc/portfolio";

export function CommitteePie({ data }: { data: CommitteeAllocation[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        No positions yet
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:gap-8">
      <div className="h-56 w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={88}
              paddingAngle={1}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, entry) => [
                `$${value.toLocaleString()} (${(((entry.payload as CommitteeAllocation).pct) * 100).toFixed(1)}%)`,
                (entry.payload as CommitteeAllocation).name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex w-full flex-col gap-2 text-sm sm:w-1/2 sm:justify-center">
        {data.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="truncate text-gray-800 dark:text-gray-200">
                {d.name}
              </span>
            </div>
            <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
              {(d.pct * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
