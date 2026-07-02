import { localStorageAdapter } from "../../platform/storage/local-storage";
import {
  defaultStatistics,
  ensureDay,
  getLocalDateKey,
  sanitizeStatistics,
  type DailyStats,
  type StoredStatistics
} from "./statistics-schema";

export const STATISTICS_STORAGE_KEY = "screenguard.statistics";
const MAX_STORED_DAYS = 45;

function trimOldDays(statistics: StoredStatistics): StoredStatistics {
  return {
    ...statistics,
    days: [...statistics.days].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_STORED_DAYS)
  };
}

export async function getStatistics(): Promise<StoredStatistics> {
  const storedStatistics = await localStorageAdapter.get<unknown>(
    STATISTICS_STORAGE_KEY,
    defaultStatistics
  );
  return trimOldDays(sanitizeStatistics(storedStatistics));
}

export async function saveStatistics(statistics: StoredStatistics): Promise<void> {
  await localStorageAdapter.set(
    STATISTICS_STORAGE_KEY,
    trimOldDays(sanitizeStatistics(statistics))
  );
}

export async function resetStatistics(): Promise<StoredStatistics> {
  await saveStatistics(defaultStatistics);
  return defaultStatistics;
}

/** Starts one idempotent monitoring session and increments today's session count. */
export async function startMonitoringSession(now = new Date()): Promise<StoredStatistics> {
  const statistics = await getStatistics();
  if (statistics.activeSessionStartedAt) {
    return statistics;
  }

  const dateKey = getLocalDateKey(now);
  ensureDay(statistics, dateKey).sessions += 1;
  statistics.activeSessionStartedAt = now.toISOString();
  await saveStatistics(statistics);
  return statistics;
}

export async function getMonitoringActiveState(): Promise<boolean> {
  return Boolean((await getStatistics()).activeSessionStartedAt);
}

/** Finishes the active session and adds its elapsed time to the start day. */
export async function stopMonitoringSession(now = new Date()): Promise<StoredStatistics> {
  const statistics = await getStatistics();
  if (!statistics.activeSessionStartedAt) {
    return statistics;
  }

  const startedAt = new Date(statistics.activeSessionStartedAt);
  const elapsedMs = Math.max(0, now.getTime() - startedAt.getTime());
  const dateKey = getLocalDateKey(startedAt);
  ensureDay(statistics, dateKey).activeMs += elapsedMs;
  statistics.activeSessionStartedAt = null;
  await saveStatistics(statistics);
  return statistics;
}

export async function getTodayStats(now = new Date()): Promise<DailyStats> {
  const statistics = await getStatistics();
  const dateKey = getLocalDateKey(now);
  const today = ensureDay(statistics, dateKey);

  if (!statistics.activeSessionStartedAt) {
    return today;
  }

  const startedAt = new Date(statistics.activeSessionStartedAt);
  if (getLocalDateKey(startedAt) !== dateKey) {
    return today;
  }

  return {
    ...today,
    activeMs: today.activeMs + Math.max(0, now.getTime() - startedAt.getTime())
  };
}

/** Merges an aggregated posture-score batch into today's weighted average. */
export async function recordPostureSampleBatch(
  scoreTotal: number,
  sampleCount: number,
  now = new Date()
): Promise<StoredStatistics> {
  if (!Number.isFinite(scoreTotal) || !Number.isFinite(sampleCount) || sampleCount <= 0) {
    return getStatistics();
  }

  const statistics = await getStatistics();
  const day = ensureDay(statistics, getLocalDateKey(now));
  const existingTotal = (day.postureScore ?? 0) * day.postureSampleCount;
  day.postureSampleCount += sampleCount;
  day.postureScore = (existingTotal + scoreTotal) / day.postureSampleCount;
  await saveStatistics(statistics);
  return statistics;
}

export async function recordPostureWarning(now = new Date()): Promise<StoredStatistics> {
  const statistics = await getStatistics();
  ensureDay(statistics, getLocalDateKey(now)).warnings += 1;
  await saveStatistics(statistics);
  return statistics;
}
