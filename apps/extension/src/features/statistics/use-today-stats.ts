import { useCallback, useEffect, useState } from "react";
import { formatDuration, type DailyStats } from "./statistics-schema";
import { getTodayStats, resetStatistics } from "./statistics-storage";

export type TodayStatsSummary = {
  activeTime: string;
  postureScore: string;
  sessions: string;
  warnings: string;
};

function toSummary(stats: DailyStats): TodayStatsSummary {
  return {
    activeTime: formatDuration(stats.activeMs),
    postureScore: stats.postureScore === null ? "--" : String(Math.round(stats.postureScore)),
    sessions: String(stats.sessions),
    warnings: String(stats.warnings)
  };
}

export function useTodayStats() {
  const [summary, setSummary] = useState<TodayStatsSummary>(() =>
    toSummary({
      date: "",
      activeMs: 0,
      postureScore: null,
      postureSampleCount: 0,
      sessions: 0,
      warnings: 0
    })
  );

  const refresh = useCallback(async () => {
    setSummary(toSummary(await getTodayStats()));
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const reset = useCallback(async () => {
    await resetStatistics();
    await refresh();
  }, [refresh]);

  return {
    refresh,
    reset,
    summary
  };
}
