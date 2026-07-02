import { describe, expect, it } from "vitest";
import { formatDuration, getLocalDateKey, sanitizeStatistics } from "./statistics-schema";

describe("statistics schema", () => {
  it("formats local date keys", () => {
    expect(getLocalDateKey(new Date(2026, 6, 2, 9, 30))).toBe("2026-07-02");
  });

  it("formats active durations", () => {
    expect(formatDuration(59_000)).toBe("0m");
    expect(formatDuration(5 * 60_000)).toBe("5m");
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
  });

  it("sanitizes malformed statistics", () => {
    expect(
      sanitizeStatistics({
        activeSessionStartedAt: 123,
        days: [
          {
            date: "2026-07-02",
            activeMs: 10,
            postureScore: 120,
            postureSampleCount: 5,
            sessions: 2,
            warnings: 1
          },
          {
            date: "bad-date"
          }
        ]
      })
    ).toEqual({
      activeSessionStartedAt: null,
      days: [
        {
          date: "2026-07-02",
          activeMs: 10,
          postureScore: 100,
          postureSampleCount: 5,
          sessions: 2,
          warnings: 1
        }
      ]
    });
  });
});
