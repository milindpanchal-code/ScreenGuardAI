export type DailyStats = {
  date: string;
  activeMs: number;
  postureScore: number | null;
  postureSampleCount: number;
  sessions: number;
  warnings: number;
};

export type StoredStatistics = {
  activeSessionStartedAt: string | null;
  days: DailyStats[];
};

export const defaultStatistics: StoredStatistics = {
  activeSessionStartedAt: null,
  days: []
};

function numberOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function sanitizeDailyStats(value: unknown): DailyStats | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  if (typeof source.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(source.date)) {
    return null;
  }

  const postureScore =
    typeof source.postureScore === "number" && Number.isFinite(source.postureScore)
      ? Math.min(100, Math.max(0, source.postureScore))
      : null;

  return {
    date: source.date,
    activeMs: numberOrFallback(source.activeMs, 0),
    postureScore,
    postureSampleCount: numberOrFallback(source.postureSampleCount, postureScore === null ? 0 : 1),
    sessions: numberOrFallback(source.sessions, 0),
    warnings: numberOrFallback(source.warnings, 0)
  };
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Sanitizes local statistics and discards malformed daily records. */
export function sanitizeStatistics(value: unknown): StoredStatistics {
  if (!value || typeof value !== "object") {
    return defaultStatistics;
  }

  const source = value as Record<string, unknown>;
  const days = Array.isArray(source.days)
    ? source.days.map(sanitizeDailyStats).filter((day): day is DailyStats => Boolean(day))
    : [];
  const activeSessionStartedAt =
    typeof source.activeSessionStartedAt === "string" ? source.activeSessionStartedAt : null;

  return {
    activeSessionStartedAt,
    days
  };
}

export function ensureDay(statistics: StoredStatistics, dateKey: string): DailyStats {
  const existingDay = statistics.days.find((day) => day.date === dateKey);
  if (existingDay) {
    return existingDay;
  }

  const day = {
    date: dateKey,
    activeMs: 0,
    postureScore: null,
    postureSampleCount: 0,
    sessions: 0,
    warnings: 0
  };
  statistics.days.push(day);
  return day;
}

/** Formats a duration for compact popup and statistics displays. */
export function formatDuration(ms: number): string {
  if (ms < 60_000) {
    return `${Math.floor(ms / 1000)}s`;
  }

  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
