import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision";

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

export type MediaPipeMonitoringEngineOptions = {
  modelAssetPath: string;
  wasmRoot: string;
};

export interface MonitoringEngine {
  estimate(frame: VideoFrame | HTMLVideoElement): Promise<PostureEstimate>;
  close(): void;
}

const LEFT_FACE_EDGE = 234;
const RIGHT_FACE_EDGE = 454;
const LEFT_EYE_EDGE = 33;
const RIGHT_EYE_EDGE = 263;
const TOO_CLOSE_FACE_WIDTH = 0.48;
const LEANING_HEAD_TILT_DEGREES = 10;
const BENIGN_MEDIAPIPE_DIAGNOSTICS = [
  "Sets FaceBlendshapesGraph acceleration to xnnpack by default",
  "OpenGL error checking is disabled",
  "Created TensorFlow Lite XNNPACK delegate for CPU",
  "Feedback manager requires a model with a single signature inference"
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function distance(first: NormalizedLandmark, second: NormalizedLandmark) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function isBenignMediaPipeDiagnostic(message: string) {
  return BENIGN_MEDIAPIPE_DIAGNOSTICS.some((diagnostic) => message.includes(diagnostic));
}

async function withFilteredMediaPipeDiagnostics<T>(operation: () => Promise<T>): Promise<T> {
  const originalError = console.error;
  const originalWarn = console.warn;
  const filter =
    (originalLogger: typeof console.error) =>
    (...data: unknown[]) => {
      const message = data.map(String).join(" ");
      if (!isBenignMediaPipeDiagnostic(message)) {
        originalLogger(...data);
      }
    };

  console.error = filter(originalError);
  console.warn = filter(originalWarn);
  try {
    return await operation();
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

export function getFaceGeometry(landmarks: NormalizedLandmark[]): FaceGeometry | null {
  const leftFaceEdge = landmarks[LEFT_FACE_EDGE];
  const rightFaceEdge = landmarks[RIGHT_FACE_EDGE];
  const leftEyeEdge = landmarks[LEFT_EYE_EDGE];
  const rightEyeEdge = landmarks[RIGHT_EYE_EDGE];
  if (!leftFaceEdge || !rightFaceEdge || !leftEyeEdge || !rightEyeEdge) {
    return null;
  }

  return {
    faceWidthRatio: distance(leftFaceEdge, rightFaceEdge),
    headTiltDegrees:
      (Math.atan2(rightEyeEdge.y - leftEyeEdge.y, rightEyeEdge.x - leftEyeEdge.x) * 180) / Math.PI
  };
}

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
    ? calibration.baselineFaceWidthRatio * 1.22
    : TOO_CLOSE_FACE_WIDTH;
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

export class MediaPipeMonitoringEngine implements MonitoringEngine {
  private calibration: VisionCalibration | null = null;

  private constructor(private readonly faceLandmarker: FaceLandmarker) {}

  static async create(options: MediaPipeMonitoringEngineOptions) {
    const fileset = await FilesetResolver.forVisionTasks(options.wasmRoot);
    const taskOptions = {
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.55,
      minFacePresenceConfidence: 0.55,
      minTrackingConfidence: 0.5
    } as const;
    const faceLandmarker = await withFilteredMediaPipeDiagnostics(() =>
      FaceLandmarker.createFromOptions(fileset, {
        ...taskOptions,
        baseOptions: {
          modelAssetPath: options.modelAssetPath,
          delegate: "CPU"
        }
      })
    );

    return new MediaPipeMonitoringEngine(faceLandmarker);
  }

  async estimate(frame: VideoFrame | HTMLVideoElement): Promise<PostureEstimate> {
    const result = this.faceLandmarker.detectForVideo(frame, performance.now());
    return classifyPosture(getFaceGeometry(result.faceLandmarks[0] ?? []), this.calibration);
  }

  setCalibration(calibration: VisionCalibration | null) {
    this.calibration = calibration;
  }

  close() {
    this.faceLandmarker.close();
  }
}
