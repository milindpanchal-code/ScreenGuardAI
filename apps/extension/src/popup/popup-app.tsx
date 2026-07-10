import { useMemo } from "react";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  Play,
  ScanLine,
  Settings,
  ShieldCheck,
  Square,
  UserRound,
  Video
} from "lucide-react";
import { useFloatingPreviewControls } from "../features/popup/use-floating-preview-controls";
import { getPopupSummaryRows } from "../features/popup/popup-summary";
import { useTodayStats } from "../features/statistics/use-today-stats";

const summaryIcons = {
  Monitoring: Clock3,
  Camera: Video,
  Calibration: ScanLine
};

export function PopupApp() {
  const {
    error,
    isBusy,
    isCalibrated,
    isMonitoringActive,
    isPreviewActive,
    startPreview,
    stopMonitoring,
    openOptionsPage
  } = useFloatingPreviewControls();
  const { summary } = useTodayStats();
  const summaryRows = useMemo(
    () => getPopupSummaryRows(isMonitoringActive, isPreviewActive, isCalibrated),
    [isMonitoringActive, isPreviewActive, isCalibrated]
  );

  return (
    <main className="popup-shell">
      <section className="popup-panel">
        <header className="popup-header">
          <div className="popup-brand">
            <span className="popup-brand-mark" aria-hidden="true">
              <ShieldCheck size={23} strokeWidth={2.4} />
            </span>
            <h1>ScreenGuard AI</h1>
          </div>
          <button
            aria-label="Open settings"
            className="focus-ring popup-icon-button"
            onClick={() => openOptionsPage("settings")}
            title="Settings"
            type="button"
          >
            <Settings size={21} strokeWidth={2.4} />
          </button>
        </header>

        <div className="popup-overview">
          <div className="posture-dial" aria-hidden="true">
            <div className="posture-dial-inner">
              <UserRound size={46} strokeWidth={1.9} />
            </div>
          </div>

          <div className="popup-status-list">
            {summaryRows.map((row) => {
              const Icon = summaryIcons[row.label as keyof typeof summaryIcons];

              return (
                <div className="popup-status-row" key={row.label}>
                  <span className="popup-status-label">
                    <Icon size={18} strokeWidth={2} />
                    {row.label}
                  </span>
                  <span
                    className={
                      row.value === "Not set" ? "popup-status-value" : "popup-status-value is-ready"
                    }
                  >
                    {row.value}
                  </span>
                </div>
              );
            })}
            <div className="popup-status-row">
              <span className="popup-status-label">
                <CalendarDays size={18} strokeWidth={2} />
                Today
              </span>
              <span className="popup-status-value">{summary.activeTime}</span>
            </div>
          </div>
        </div>

        {error ? <p className="popup-error">{error}</p> : null}

        <div className="popup-actions">
          <button
            className="focus-ring popup-button popup-button-primary"
            disabled={isBusy}
            onClick={startPreview}
            type="button"
          >
            <Play size={19} fill="currentColor" strokeWidth={2.2} />
            {isMonitoringActive && !isPreviewActive ? "Show Preview" : "Start Preview"}
          </button>
          <button
            className="focus-ring popup-button popup-button-secondary"
            disabled={isBusy}
            onClick={stopMonitoring}
            type="button"
          >
            <Square size={17} strokeWidth={2.4} />
            Stop Monitoring
          </button>
          <button
            className="focus-ring popup-button popup-button-secondary"
            onClick={() => openOptionsPage("settings")}
            type="button"
          >
            <Settings size={19} strokeWidth={2.2} />
            Settings
          </button>
          <button
            className="focus-ring popup-button popup-button-secondary"
            onClick={() => openOptionsPage("statistics")}
            type="button"
          >
            <BarChart3 size={19} strokeWidth={2.2} />
            Statistics
          </button>
        </div>

        <p className="popup-tagline">Your posture. Your health. Your productivity.</p>
      </section>
    </main>
  );
}
