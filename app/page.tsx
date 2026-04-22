export default function Home() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">CIMG Portfolio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Live dashboard — setup in progress.
        </p>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total value" value="—" />
        <StatCard label="Daily P&L" value="—" />
        <StatCard label="YTD P&L" value="—" />
        <StatCard label="Since inception" value="—" />
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Fund vs S&amp;P 500</h2>
          <div className="text-xs text-gray-400">1D / 1M / 3M / 6M / YTD / 1Y / All</div>
        </div>
        <Placeholder className="h-64">Performance chart</Placeholder>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-medium">Committee allocation</h2>
          <Placeholder className="h-56">Pie chart</Placeholder>
        </div>
        <div className="rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Positions</h2>
            <div className="text-xs text-gray-400">Portfolio / Fundamentals</div>
          </div>
          <Placeholder className="h-56">Positions table</Placeholder>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Placeholder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-gray-50 text-sm text-gray-400 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
