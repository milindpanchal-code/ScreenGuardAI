import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  classifyPosture,
  getFaceGeometry,
  type PostureEstimate,
  type VisionCalibration
} from "./posture-classifier";

export type MediaPipeMonitoringEngineOptions = {
  modelAssetPath: string;
  wasmRoot: string;
};

export interface MonitoringEngine {
  estimate(frame: VideoFrame | HTMLVideoElement): Promise<PostureEstimate>;
  close(): void;
}

const BENIGN_MEDIAPIPE_DIAGNOSTICS = [
  "Sets FaceBlendshapesGraph acceleration to xnnpack by default",
  "OpenGL error checking is disabled",
  "Created TensorFlow Lite XNNPACK delegate for CPU",
  "Feedback manager requires a model with a single signature inference"
];

/** Returns true only for known non-actionable MediaPipe startup diagnostics. */
export function isBenignMediaPipeDiagnostic(message: string) {
  return BENIGN_MEDIAPIPE_DIAGNOSTICS.some((diagnostic) => message.includes(diagnostic));
}

async function withFilteredMediaPipeDiagnostics<T>(operation: () => Promise<T>): Promise<T> {
  const originalError = console.error;
  const originalWarn = console.warn;
  const filter =
    (originalLogger: typeof console.error) =>
    (...data: unknown[]) => {
      if (!isBenignMediaPipeDiagnostic(data.map(String).join(" "))) {
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

/** Owns one MediaPipe face-landmarker instance and exposes posture estimates. */
export class MediaPipeMonitoringEngine implements MonitoringEngine {
  private calibration: VisionCalibration | null = null;

  private constructor(private readonly faceLandmarker: FaceLandmarker) {}

  static async create(options: MediaPipeMonitoringEngineOptions) {
    const fileset = await FilesetResolver.forVisionTasks(options.wasmRoot);
    const faceLandmarker = await withFilteredMediaPipeDiagnostics(() =>
      FaceLandmarker.createFromOptions(fileset, {
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
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
