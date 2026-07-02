export type CalibrationProfile = {
  calibratedAt: string;
  baselineFaceWidthRatio: number;
  baselineHeadTiltDegrees: number;
  sampleCount: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Validates persisted calibration geometry without retaining camera frames. */
export function sanitizeCalibrationProfile(value: unknown): CalibrationProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  if (
    typeof source.calibratedAt !== "string" ||
    !isFiniteNumber(source.baselineFaceWidthRatio) ||
    source.baselineFaceWidthRatio <= 0 ||
    !isFiniteNumber(source.baselineHeadTiltDegrees) ||
    !isFiniteNumber(source.sampleCount) ||
    source.sampleCount < 1
  ) {
    return null;
  }

  return {
    calibratedAt: source.calibratedAt,
    baselineFaceWidthRatio: source.baselineFaceWidthRatio,
    baselineHeadTiltDegrees: source.baselineHeadTiltDegrees,
    sampleCount: Math.floor(source.sampleCount)
  };
}
