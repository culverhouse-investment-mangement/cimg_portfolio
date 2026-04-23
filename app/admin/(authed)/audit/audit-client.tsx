"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  changes: unknown;
  created_at: string;
};

export function AuditClient({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");

  const actionOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.action));
    return Array.from(s).sort();
  }, [rows]);

  const actorOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.actor_email).filter((e): e is string => !!e));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (actorFilter !== "all" && r.actor_email !== actorFilter) return false;
      if (q) {
        const hay = [
          r.action,
          r.actor_email ?? "",
          r.resource_type ?? "",
          r.resource_id ?? "",
          JSON.stringify(r.changes ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, actionFilter, actorFilter]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search action, actor, resource, or diff"
          className="flex-1 min-w-48 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
        >
          <option value="all">All actions</option>
          {actionOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
        >
          <option value="all">All actors</option>
          {actorOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-left text-[11px] uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Actor</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Resource</th>
              <th className="px-4 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  No events match.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {fmtDateTime(r.created_at)}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {r.actor_email ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 text-[11px] font-medium text-indigo-800 dark:text-indigo-300">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {r.resource_type ?? "—"}
                    {r.resource_id ? ` · ${shortId(r.resource_id)}` : ""}
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {r.changes ? (
                      <code className="block max-w-md truncate text-[11px]" title={JSON.stringify(r.changes)}>
                        {JSON.stringify(r.changes)}
                      </code>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {filtered.length} of {rows.length} events
      </p>
    </>
  );
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortId(id: string): string {
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}…`;
}
