import type { PostureSampleBatch } from "./posture-event-accumulator";

export const POSTURE_SAMPLE_BATCH_MESSAGE = "screenguard:posture-sample-batch";
export const POSTURE_WARNING_MESSAGE = "screenguard:posture-warning";

export type MonitoringMessage =
  | ({ type: typeof POSTURE_SAMPLE_BATCH_MESSAGE } & PostureSampleBatch)
  | {
      type: typeof POSTURE_WARNING_MESSAGE;
      state: "leaning" | "too-close";
    };

export function isMonitoringMessage(value: unknown): value is MonitoringMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Record<string, unknown>;
  if (source.type === POSTURE_SAMPLE_BATCH_MESSAGE) {
    return (
      typeof source.scoreTotal === "number" &&
      Number.isFinite(source.scoreTotal) &&
      typeof source.sampleCount === "number" &&
      Number.isFinite(source.sampleCount) &&
      source.sampleCount > 0
    );
  }

  return (
    source.type === POSTURE_WARNING_MESSAGE &&
    (source.state === "leaning" || source.state === "too-close")
  );
}
