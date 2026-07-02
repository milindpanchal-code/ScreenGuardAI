import { describe, expect, it } from "vitest";
import { sanitizeCalibrationProfile } from "./calibration-schema";

describe("sanitizeCalibrationProfile", () => {
  it("accepts a valid local geometry baseline", () => {
    expect(
      sanitizeCalibrationProfile({
        calibratedAt: "2026-07-02T12:00:00.000Z",
        baselineFaceWidthRatio: 0.31,
        baselineHeadTiltDegrees: -1.5,
        sampleCount: 12
      })
    ).toEqual({
      calibratedAt: "2026-07-02T12:00:00.000Z",
      baselineFaceWidthRatio: 0.31,
      baselineHeadTiltDegrees: -1.5,
      sampleCount: 12
    });
  });

  it("rejects incomplete and invalid profiles", () => {
    expect(sanitizeCalibrationProfile(null)).toBeNull();
    expect(sanitizeCalibrationProfile({ baselineFaceWidthRatio: -1 })).toBeNull();
  });
});
