import { describe, expect, it } from "vitest";
import { classifyPosture, isBenignMediaPipeDiagnostic, type FaceGeometry } from "./index";

function geometry(faceWidthRatio: number, headTiltDegrees: number): FaceGeometry {
  return { faceWidthRatio, headTiltDegrees };
}

describe("classifyPosture", () => {
  it("returns unknown when no face geometry is available", () => {
    expect(classifyPosture(null).state).toBe("unknown");
  });

  it("detects when the face is too close", () => {
    expect(classifyPosture(geometry(0.52, 2)).state).toBe("too-close");
  });

  it("detects a tilted posture", () => {
    expect(classifyPosture(geometry(0.3, -14)).state).toBe("leaning");
  });

  it("reports healthy posture inside both thresholds", () => {
    const estimate = classifyPosture(geometry(0.3, 3));
    expect(estimate.state).toBe("healthy");
    expect(estimate.confidence).toBeGreaterThan(0.5);
  });

  it("uses a calibration baseline for relative distance and tilt", () => {
    const calibration = {
      baselineFaceWidthRatio: 0.3,
      baselineHeadTiltDegrees: 4
    };
    expect(classifyPosture(geometry(0.38, 4), calibration).state).toBe("too-close");
    expect(classifyPosture(geometry(0.3, 15), calibration).state).toBe("leaning");
  });
});

describe("isBenignMediaPipeDiagnostic", () => {
  it("recognizes known native startup diagnostics", () => {
    expect(
      isBenignMediaPipeDiagnostic("INFO: Created TensorFlow Lite XNNPACK delegate for CPU.")
    ).toBe(true);
    expect(isBenignMediaPipeDiagnostic("OpenGL error checking is disabled")).toBe(true);
    expect(
      isBenignMediaPipeDiagnostic(
        "Feedback manager requires a model with a single signature inference."
      )
    ).toBe(true);
  });

  it("does not hide unknown MediaPipe errors", () => {
    expect(isBenignMediaPipeDiagnostic("Model file could not be loaded")).toBe(false);
  });
});
