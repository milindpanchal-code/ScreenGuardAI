import type { PostureEstimate, PostureState } from "@screenguard/vision";
import type { Sensitivity } from "../settings/settings-schema";

export type PostureSampleBatch = {
  scoreTotal: number;
  sampleCount: number;
};

export type PostureMonitoringEvent = {
  batch?: PostureSampleBatch;
  warning?: Exclude<PostureState, "unknown" | "healthy">;
};

const SCORE_BY_STATE: Record<Exclude<PostureState, "unknown">, number> = {
  healthy: 100,
  leaning: 55,
  "too-close": 35
};
const WARNING_DELAY_MS: Record<Sensitivity, number> = {
  low: 8_000,
  medium: 5_000,
  high: 3_000
};
const BATCH_SIZE = 8;

/** Converts frame estimates into score batches and sustained-posture warnings. */
export class PostureEventAccumulator {
  private scoreTotal = 0;
  private sampleCount = 0;
  private poorState: "leaning" | "too-close" | null = null;
  private poorStateStartedAt = 0;
  private warnedForCurrentEpisode = false;

  constructor(private readonly sensitivity: Sensitivity) {}

  add(estimate: PostureEstimate, now = Date.now()): PostureMonitoringEvent {
    const event: PostureMonitoringEvent = {};
    if (estimate.state === "unknown") {
      this.resetPoorPostureEpisode();
      return event;
    }

    this.scoreTotal += SCORE_BY_STATE[estimate.state];
    this.sampleCount += 1;
    if (this.sampleCount >= BATCH_SIZE) {
      event.batch = {
        scoreTotal: this.scoreTotal,
        sampleCount: this.sampleCount
      };
      this.scoreTotal = 0;
      this.sampleCount = 0;
    }

    if (estimate.state === "healthy") {
      this.resetPoorPostureEpisode();
      return event;
    }

    if (this.poorState === null) {
      this.poorState = estimate.state;
      this.poorStateStartedAt = now;
      this.warnedForCurrentEpisode = false;
      return event;
    }

    this.poorState = estimate.state;

    if (
      !this.warnedForCurrentEpisode &&
      now - this.poorStateStartedAt >= WARNING_DELAY_MS[this.sensitivity]
    ) {
      this.warnedForCurrentEpisode = true;
      event.warning = estimate.state;
    }

    return event;
  }

  private resetPoorPostureEpisode() {
    this.poorState = null;
    this.poorStateStartedAt = 0;
    this.warnedForCurrentEpisode = false;
  }
}
