// Display-layer formatting helpers. Every number that lives in the UI
// passes through one of these — keeps tabular alignment and locale
// rules consistent (and lets us shift the look in one place when we
// later add e.g. compact-currency or per-locale variants).

export function fmtCurrency(n: number | null): string {
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtSignedCurrency(n: number | null): string {
  if (n === null) return "—";
  const sign = n >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtPctSigned(pct: number | null): string {
  if (pct === null) return "—";
  const sign = pct >= 0 ? "+" : "−";
  return `${sign}${(Math.abs(pct) * 100).toFixed(2)}%`;
}

export function fmtPctPlain(pct: number | null, digits = 1): string {
  if (pct === null) return "—";
  return `${(pct * 100).toFixed(digits)}%`;
}

export function fmtNumber(n: number | null, digits = 2): string {
  if (n === null) return "—";
  return n.toFixed(digits);
}

export function fmtInteger(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString();
}

export function fmtDateShort(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return "—";
  return `${m}/${d}/${y}`;
}

export function toneClass(n: number | null): string {
  // Default text — used wherever a value has no positive/negative tone
  // (e.g. zero, null, non-pnl numbers). Falls back to the page's body
  // color rather than overriding it.
  if (n === null || n === 0) return "text-zinc-700 dark:text-zinc-300";
  return n > 0
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-rose-700 dark:text-rose-400";
}
