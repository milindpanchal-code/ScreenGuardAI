import { useTodayStats } from "../../features/statistics/use-today-stats";

function getScoreMeaning(score: string) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) {
    return "Waiting for posture samples";
  }
  if (numericScore >= 85) {
    return "Strong posture consistency";
  }
  if (numericScore >= 65) {
    return "Some correction needed";
  }
  return "Frequent correction needed";
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short"
  });
}

export function StatisticsView() {
  const { isMonitoringActive, recentDays, reset, summary } = useTodayStats();
  const cards = [
    { label: "Active today", value: summary.activeTime, detail: "Camera monitoring time" },
    {
      label: "Posture score",
      value: summary.postureScore === "--" ? "--" : `${summary.postureScore}/100`,
      detail: getScoreMeaning(summary.postureScore)
    },
    {
      label: "Reminders",
      value: summary.warnings,
      detail: summary.warnings === "1" ? "Posture alert triggered" : "Posture alerts triggered"
    },
    { label: "Sessions", value: summary.sessions, detail: "Monitoring starts today" }
  ];

  return (
    <section>
      <div className="flex flex-col gap-3 border-b border-[#c8d9d4] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Today</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                isMonitoringActive ? "bg-[#d9f3ea] text-[#126353]" : "bg-[#e4ebe8] text-[#52645f]"
              }`}
            >
              {isMonitoringActive ? "Monitoring active" : "Monitoring paused"}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#52645f]">Your locally stored posture activity.</p>
        </div>
        <button
          className="focus-ring self-start rounded-md border border-[#efb2a7] bg-[#fff4f1] px-3 py-2 text-sm font-semibold text-[#934133]"
          onClick={() => void reset()}
          type="button"
        >
          Reset statistics
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article className="rounded-lg border border-[#d6e3df] bg-white p-4" key={card.label}>
            <p className="text-sm font-medium text-[#52645f]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#12211d]">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-[#60726d]">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-[#d6e3df] bg-white">
        <div className="border-b border-[#d6e3df] px-4 py-3">
          <h3 className="text-base font-semibold">Recent activity</h3>
        </div>
        {recentDays.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead className="bg-[#f2f7f5] text-[#52645f]">
                <tr>
                  <th className="px-4 py-3 font-medium">Day</th>
                  <th className="px-4 py-3 font-medium">Active time</th>
                  <th className="px-4 py-3 font-medium">Posture score</th>
                  <th className="px-4 py-3 font-medium">Reminders</th>
                  <th className="px-4 py-3 font-medium">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {recentDays.map((day) => (
                  <tr className="border-t border-[#e2ebe8]" key={day.date}>
                    <td className="px-4 py-3 font-medium">{formatDay(day.date)}</td>
                    <td className="px-4 py-3">{day.activeTime}</td>
                    <td className="px-4 py-3">
                      {day.postureScore === "--" ? "--" : `${day.postureScore}/100`}
                    </td>
                    <td className="px-4 py-3">{day.warnings}</td>
                    <td className="px-4 py-3">{day.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-[#60726d]">No activity recorded.</p>
        )}
      </div>
    </section>
  );
}
