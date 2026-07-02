import { describe, expect, it } from "vitest";
import {
  isMonitoringMessage,
  POSTURE_SAMPLE_BATCH_MESSAGE,
  POSTURE_WARNING_MESSAGE
} from "./monitoring-messages";

describe("isMonitoringMessage", () => {
  it("accepts valid sample batches and warning requests", () => {
    expect(
      isMonitoringMessage({
        type: POSTURE_SAMPLE_BATCH_MESSAGE,
        scoreTotal: 1800,
        sampleCount: 20
      })
    ).toBe(true);
    expect(isMonitoringMessage({ type: POSTURE_WARNING_MESSAGE, state: "leaning" })).toBe(true);
  });

  it("rejects malformed messages", () => {
    expect(isMonitoringMessage({ type: POSTURE_SAMPLE_BATCH_MESSAGE, sampleCount: 0 })).toBe(false);
    expect(isMonitoringMessage({ type: POSTURE_WARNING_MESSAGE, state: "healthy" })).toBe(false);
  });
});
