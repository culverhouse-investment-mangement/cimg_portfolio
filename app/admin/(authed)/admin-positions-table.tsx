"use client";

import { useMemo, useState } from "react";
import type { TickerPosition } from "@/lib/portfolio/positions";
import { SellSharesButton } from "./sell-shares-button";
import {
  fmtCurrency,
  fmtInteger,
  fmtPctSigned,
  fmtSignedCurrency,
  toneClass,
} from "@/components/format";

type SortKey =
  | "ticker"
  | "name"
  | "committee"
  | "shares_remaining"
  | "avg_cost_basis"
  | "current_price"
  | "market_value"
  | "unrealized_pnl"
  | "realized_pnl";
type SortDir = "asc" | "desc";

type ColumnDef = {
  key: SortKey;
  label: string;
  right?: boolean;
};

const BASE_COLUMNS: ColumnDef[] = [
  { key: "ticker", label: "Ticker" },
  { key: "name", label: "Company" },
  { key: "committee", label: "Committee" },
  { key: "shares_remaining", label: "Shares", right: true },
  { key: "avg_cost_basis", label: "Avg Cost", right: true },
  { key: "current_price", label: "Current", right: true },
  { key: "market_value", label: "Market Value", right: true },
  { key: "unrealized_pnl", label: "Unrealized", right: true },
  { key: "realized_pnl", label: "Realized", right: true },
];

export function AdminPositionsTable({
  rows,
  closable,
}: {
  rows: TickerPosition[];
  closable: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);

  function onHeaderClick(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-400 dark:text-gray-500 shadow-sm">
        No positions.
      </div>
    );
  }

  return (
    <div className="scroll-hint overflow-x-auto rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm text-left text-[11px] uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
          <tr>
            {BASE_COLUMNS.map((c) => (
              <SortableTh
                key={c.key}
                active={sortKey === c.key}
                direction={sortKey === c.key ? sortDir : null}
                right={c.right}
                onClick={() => onHeaderClick(c.key)}
              >
                {c.label}
              </SortableTh>
            ))}
            {closable && (
              <th className="whitespace-nowrap px-3 py-2.5 font-medium text-right select-none">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map((p) => (
            <tr key={p.ticker} className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
              <Td strong>
                <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                  {p.ticker}
                </span>
              </Td>
              <Td strong>{p.name}</Td>
              <Td>
                {p.committee ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.committee.color ?? "#9ca3af" }}
                      aria-hidden
                    />
                    <span>{p.committee.name}</span>
                  </span>
                ) : (
                  "—"
                )}
              </Td>
              <Td right>{fmtInteger(p.shares_remaining)}</Td>
              <Td right>{fmtCurrency(p.avg_cost_basis)}</Td>
              <Td right>{fmtCurrency(p.current_price)}</Td>
              <Td right>{fmtCurrency(p.market_value)}</Td>
              <Td right tone={p.unrealized_pnl}>
                {p.unrealized_pnl !== null && p.unrealized_pct !== null ? (
                  <span>
                    {fmtSignedCurrency(p.unrealized_pnl)}{" "}
                    <span className="text-xs opacity-70">
                      ({fmtPctSigned(p.unrealized_pct)})
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </Td>
              <Td right tone={p.realized_pnl}>
                {p.realized_pnl !== 0 ? fmtSignedCurrency(p.realized_pnl) : "—"}
              </Td>
              {closable && (
                <td className="px-3 py-2 text-right">
                  {p.shares_remaining > 0 ? (
                    <SellSharesButton
                      ticker={p.ticker}
                      maxShares={p.shares_remaining}
                    />
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">closed</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sortRows(rows: TickerPosition[], key: SortKey, dir: SortDir): TickerPosition[] {
  const copy = [...rows];
  const mult = dir === "asc" ? 1 : -1;

  copy.sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * mult;
    return String(av).localeCompare(String(bv)) * mult;
  });
  return copy;
}

function sortValue(p: TickerPosition, key: SortKey): string | number | null {
  switch (key) {
    case "ticker": return p.ticker;
    case "name": return p.name;
    case "committee": return p.committee?.name ?? null;
    case "shares_remaining": return p.shares_remaining;
    case "avg_cost_basis": return p.avg_cost_basis;
    case "current_price": return p.current_price;
    case "market_value": return p.market_value;
    case "unrealized_pnl": return p.unrealized_pnl;
    case "realized_pnl": return p.realized_pnl;
  }
}

function SortableTh({
  children,
  active,
  direction,
  right,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  direction: SortDir | null;
  right?: boolean;
  onClick: () => void;
}) {
  const arrow = active ? (direction === "asc" ? " ↑" : " ↓") : "";
  return (
    <th className={`whitespace-nowrap px-3 py-2.5 font-medium select-none ${right ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full ${right ? "text-right" : "text-left"} transition-colors ${
          active ? "text-gray-900 dark:text-gray-100" : "hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        {children}
        <span className="tabular-nums">{arrow}</span>
      </button>
    </th>
  );
}

function Td({
  children,
  right,
  strong,
  tone,
}: {
  children: React.ReactNode;
  right?: boolean;
  strong?: boolean;
  tone?: number | null;
}) {
  const base = right ? "text-right tabular-nums" : "";
  const weight = strong
    ? "font-medium text-gray-900 dark:text-gray-100"
    : "text-gray-700 dark:text-gray-300";
  const color = tone !== undefined ? toneClass(tone) : weight;
  return (
    <td className={`whitespace-nowrap px-3 py-2 ${base} ${color}`}>{children}</td>
  );
}
