import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type PostureState = "unknown" | "healthy" | "leaning" | "too-close";

export type PostureEstimate = {
  state: PostureState;
  confidence: number;
  faceWidthRatio: number | null;
  headTiltDegrees: number | null;
};

export type FaceGeometry = {
  faceWidthRatio: number;
  headTiltDegrees: number;
};

export type VisionCalibration = {
  baselineFaceWidthRatio: number;
  baselineHeadTiltDegrees: number;
};

const LANDMARK_INDEX = {
  leftEyeEdge: 33,
  leftFaceEdge: 234,
  rightEyeEdge: 263,
  rightFaceEdge: 454
} as const;
const DEFAULT_TOO_CLOSE_FACE_WIDTH = 0.42;
const CALIBRATED_TOO_CLOSE_MULTIPLIER = 1.18;
const LEANING_HEAD_TILT_DEGREES = 8;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function distance(first: NormalizedLandmark, second: NormalizedLandmark) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

/** Extracts normalized face width and eye-line angle from MediaPipe landmarks. */
export function getFaceGeometry(landmarks: NormalizedLandmark[]): FaceGeometry | null {
  const leftFaceEdge = landmarks[LANDMARK_INDEX.leftFaceEdge];
  const rightFaceEdge = landmarks[LANDMARK_INDEX.rightFaceEdge];
  const leftEyeEdge = landmarks[LANDMARK_INDEX.leftEyeEdge];
  const rightEyeEdge = landmarks[LANDMARK_INDEX.rightEyeEdge];
  if (!leftFaceEdge || !rightFaceEdge || !leftEyeEdge || !rightEyeEdge) {
    return null;
  }

  return {
    faceWidthRatio: distance(leftFaceEdge, rightFaceEdge),
    headTiltDegrees:
      (Math.atan2(rightEyeEdge.y - leftEyeEdge.y, rightEyeEdge.x - leftEyeEdge.x) * 180) / Math.PI
  };
}

/** Classifies face geometry using the established fixed or calibrated thresholds. */
export function classifyPosture(
  geometry: FaceGeometry | null,
  calibration: VisionCalibration | null = null
): PostureEstimate {
  if (!geometry) {
    return {
      state: "unknown",
      confidence: 0,
      faceWidthRatio: null,
      headTiltDegrees: null
    };
  }

  const tooCloseThreshold = calibration
    ? calibration.baselineFaceWidthRatio * CALIBRATED_TOO_CLOSE_MULTIPLIER
    : DEFAULT_TOO_CLOSE_FACE_WIDTH;
  const tiltDifference = Math.abs(
    geometry.headTiltDegrees - (calibration?.baselineHeadTiltDegrees ?? 0)
  );

  if (geometry.faceWidthRatio >= tooCloseThreshold) {
    return {
      state: "too-close",
      confidence: clamp(0.65 + (geometry.faceWidthRatio - tooCloseThreshold) * 2),
      ...geometry
    };
  }

  if (tiltDifference >= LEANING_HEAD_TILT_DEGREES) {
    return {
      state: "leaning",
      confidence: clamp(0.65 + (tiltDifference - LEANING_HEAD_TILT_DEGREES) / 30),
      ...geometry
    };
  }

  const distanceMargin = (tooCloseThreshold - geometry.faceWidthRatio) / tooCloseThreshold;
  const tiltMargin = (LEANING_HEAD_TILT_DEGREES - tiltDifference) / LEANING_HEAD_TILT_DEGREES;
  return {
    state: "healthy",
    confidence: clamp(0.6 + Math.min(distanceMargin, tiltMargin) * 0.35),
    ...geometry
  };
}
