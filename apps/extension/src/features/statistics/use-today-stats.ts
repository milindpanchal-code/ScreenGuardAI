import { useCallback, useEffect, useState } from "react";
import { formatDuration, type DailyStats } from "./statistics-schema";
import { getStatistics, getTodayStats, resetStatistics } from "./statistics-storage";

export type TodayStatsSummary = {
  activeTime: string;
  postureScore: string;
  sessions: string;
  warnings: string;
};

export type RecentDaySummary = TodayStatsSummary & {
  date: string;
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
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [recentDays, setRecentDays] = useState<RecentDaySummary[]>([]);

  const refresh = useCallback(async () => {
    const [today, statistics] = await Promise.all([getTodayStats(), getStatistics()]);
    setSummary(toSummary(today));
    setIsMonitoringActive(Boolean(statistics.activeSessionStartedAt));
    setRecentDays(
      statistics.days
        .map((day) => (day.date === today.date ? today : day))
        .sort((first, second) => second.date.localeCompare(first.date))
        .slice(0, 7)
        .map((day) => ({ date: day.date, ...toSummary(day) }))
    );
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 2_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const reset = useCallback(async () => {
    await resetStatistics();
    await refresh();
  }, [refresh]);

  return {
    refresh,
    reset,
    summary,
    isMonitoringActive,
    recentDays
  };
}
