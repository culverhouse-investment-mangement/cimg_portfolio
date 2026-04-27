"use client";

import { downloadCsv, toCsv } from "./export";

type Props = {
  filename: string;
  build: () => { headers: string[]; rows: (string | number | null | undefined)[][] };
  label?: string;
};

export function ExportButton({ filename, build, label = "Export CSV" }: Props) {
  function onClick() {
    const { headers, rows } = build();
    downloadCsv(filename, toCsv(headers, rows));
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </button>
  );
}
