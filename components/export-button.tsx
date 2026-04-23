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
      className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      {label}
    </button>
  );
}
