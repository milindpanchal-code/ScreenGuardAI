import { useTodayStats } from "../../features/statistics/use-today-stats";

export function StatisticsView() {
  const { reset, summary } = useTodayStats();
  const cards = [
    ["Today", summary.activeTime],
    ["Posture score", summary.postureScore],
    ["Warnings", summary.warnings],
    ["Sessions", summary.sessions]
  ];

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Statistics</h2>
        <button
          className="focus-ring rounded-md border border-[#efb2a7] bg-[#fff4f1] px-3 py-2 text-sm font-semibold text-[#934133]"
          onClick={() => void reset()}
          type="button"
        >
          Reset stats
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <div className="rounded-lg bg-white/65 p-4" key={label}>
            <p className="text-sm text-[#435651]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
