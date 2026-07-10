import { BarChart3, RotateCcw } from "lucide-react";
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
  const trendDays = recentDays.slice().reverse();
  const hasTrendData = trendDays.some((day) => Number.isFinite(Number(day.postureScore)));
  const cards = [
    { label: "Active today", value: summary.activeTime, detail: "Monitoring time" },
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
    <section className="statistics-page">
      <header className="options-view-header statistics-header">
        <div>
          <h1>Statistics</h1>
          <p>Your locally stored posture monitoring insights.</p>
        </div>
        <button
          className="focus-ring statistics-reset-button"
          onClick={() => void reset()}
          type="button"
        >
          <RotateCcw size={18} strokeWidth={2.1} />
          Reset statistics
        </button>
      </header>

      <div className="statistics-state">
        <span className={isMonitoringActive ? "is-active" : ""} />
        {isMonitoringActive ? "Monitoring active" : "Monitoring paused"}
      </div>

      <div className="statistics-cards">
        {cards.map((card) => (
          <article className="statistics-card" key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.detail}</span>
          </article>
        ))}
      </div>

      <section className="options-card statistics-table-card">
        <div className="statistics-section-heading">
          <BarChart3 size={20} strokeWidth={2.2} />
          <h2>Recent activity</h2>
        </div>
        {recentDays.length > 0 ? (
          <div className="statistics-table-scroll">
            <table>
              <thead>
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
                  <tr key={day.date}>
                    <td>{formatDay(day.date)}</td>
                    <td>{day.activeTime}</td>
                    <td>{day.postureScore === "--" ? "--" : `${day.postureScore}/100`}</td>
                    <td>{day.warnings}</td>
                    <td>{day.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="statistics-empty-state">No activity recorded yet.</p>
        )}

        <div className="statistics-section-heading statistics-trend-heading">
          <BarChart3 size={20} strokeWidth={2.2} />
          <div>
            <h2>Posture score trend</h2>
            <p>Last 7 recorded days</p>
          </div>
        </div>
        {hasTrendData ? (
          <div className="statistics-trend" role="img" aria-label="Posture score trend">
            {trendDays.map((day) => {
              const score = Number(day.postureScore);
              const height = Number.isFinite(score) ? Math.max(score, 6) : 6;

              return (
                <div className="statistics-trend-item" key={day.date}>
                  <span className="statistics-trend-value">
                    {Number.isFinite(score) ? `${score}` : "--"}
                  </span>
                  <span className="statistics-trend-bar" style={{ height: `${height}%` }} />
                  <small>{formatDay(day.date)}</small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="statistics-empty-state">Posture scores will appear after monitoring.</p>
        )}
      </section>
    </section>
  );
}
