// Supabase caps row returns at ~1000 per request by default. `.range()`
// alone asks for more but the server still clamps; for 9k-row queries
// like "every daily close for every ticker" we need to page through
// with explicit ranges until the response comes back short.
//
// `queryBuilder` is a factory that returns a fresh Supabase query each
// call — the same PostgrestFilterBuilder can't be reused once its
// range has been set. Callers hand us a builder they've already
// narrowed with .eq/.in/.gte/.order/etc; we re-apply .range() each page.

// Supabase's PostgrestFilterBuilder has a thenable `.range()` that
// matches this shape when awaited — we keep the helper permissive
// so callers can pass any query without fighting the generic type
// system. The row type comes from the caller via the T generic.
type RangeableBuilder = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

const PAGE_SIZE = 1000;

export async function paginateSelect<T>(
  queryBuilder: () => RangeableBuilder,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await queryBuilder().range(from, to);
    if (error) throw new Error(error.message);
    const rows = (data as T[] | null) ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    // Safety valve — 50 pages is 50k rows, far more than we'd
    // legitimately need. If we're still going past that, something
    // is wrong (missing filter, unbounded growth) and we should
    // fail loud rather than hang.
    if (page >= 49) {
      throw new Error(
        "paginateSelect: hit 50-page safety cap (50k rows). Add a tighter filter.",
      );
    }
  }
  return all;
}
