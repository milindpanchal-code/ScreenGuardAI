import { useMemo } from "react";
import { useFloatingPreviewControls } from "../features/popup/use-floating-preview-controls";
import { getPopupSummaryRows } from "../features/popup/popup-summary";
import { useTodayStats } from "../features/statistics/use-today-stats";

export function PopupApp() {
  const {
    error,
    isBusy,
    isMonitoringActive,
    isPreviewActive,
    startPreview,
    stopMonitoring,
    openOptionsPage
  } = useFloatingPreviewControls();
  const { summary } = useTodayStats();
  const summaryRows = useMemo(
    () => getPopupSummaryRows(isMonitoringActive, isPreviewActive),
    [isMonitoringActive, isPreviewActive]
  );

  return (
    <main className="w-[360px] bg-[#edf6f3] p-3 text-[#13241f]">
      <section className="glass-panel rounded-lg p-4">
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#287466]">
            ScreenGuard AI
          </p>
          <h1 className="mt-1 text-xl font-semibold leading-tight">Posture preview</h1>
        </header>

        <div className="space-y-2">
          {summaryRows.map((row) => (
            <div
              className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2 text-sm"
              key={row.label}
            >
              <span className="text-[#435651]">{row.label}</span>
              <span className="font-medium text-[#10231e]">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-md bg-white/60 px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#435651]">Today</span>
            <span className="font-medium text-[#10231e]">{summary.activeTime}</span>
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-[#efb2a7] bg-[#fff4f1] px-3 py-2 text-sm text-[#934133]">
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="focus-ring rounded-md bg-[#0f7668] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isBusy}
            onClick={startPreview}
            type="button"
          >
            {isMonitoringActive && !isPreviewActive ? "Show Preview" : "Start Preview"}
          </button>
          <button
            className="focus-ring rounded-md border border-[#b7cbc5] bg-white/78 px-3 py-2 text-sm font-semibold text-[#18302a] disabled:opacity-60"
            disabled={isBusy}
            onClick={stopMonitoring}
            type="button"
          >
            Stop Monitoring
          </button>
          <button
            className="focus-ring rounded-md border border-[#b7cbc5] bg-white/78 px-3 py-2 text-sm font-semibold text-[#18302a]"
            onClick={() => openOptionsPage("settings")}
            type="button"
          >
            Settings
          </button>
          <button
            className="focus-ring rounded-md border border-[#b7cbc5] bg-white/78 px-3 py-2 text-sm font-semibold text-[#18302a]"
            onClick={() => openOptionsPage("statistics")}
            type="button"
          >
            Statistics
          </button>
        </div>
      </section>
    </main>
  );
}
