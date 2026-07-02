import { describe, expect, it } from "vitest";
import type { PostureEstimate, PostureState } from "@screenguard/vision";
import { PostureEventAccumulator } from "./posture-event-accumulator";

function estimate(state: PostureState): PostureEstimate {
  return {
    state,
    confidence: 0.9,
    faceWidthRatio: 0.3,
    headTiltDegrees: 0
  };
}

describe("PostureEventAccumulator", () => {
  it("batches twenty valid posture scores", () => {
    const accumulator = new PostureEventAccumulator("medium");
    for (let index = 0; index < 19; index += 1) {
      expect(accumulator.add(estimate("healthy"))).toEqual({});
    }

    expect(accumulator.add(estimate("healthy")).batch).toEqual({
      scoreTotal: 2000,
      sampleCount: 20
    });
  });

  it("warns once after sustained poor posture", () => {
    const accumulator = new PostureEventAccumulator("medium");
    expect(accumulator.add(estimate("leaning"), 1_000).warning).toBeUndefined();
    expect(accumulator.add(estimate("leaning"), 9_000).warning).toBe("leaning");
    expect(accumulator.add(estimate("leaning"), 12_000).warning).toBeUndefined();
  });

  it("resets the warning episode after healthy posture", () => {
    const accumulator = new PostureEventAccumulator("high");
    accumulator.add(estimate("too-close"), 0);
    expect(accumulator.add(estimate("too-close"), 5_000).warning).toBe("too-close");
    accumulator.add(estimate("healthy"), 6_000);
    accumulator.add(estimate("too-close"), 7_000);
    expect(accumulator.add(estimate("too-close"), 12_000).warning).toBe("too-close");
  });
});
