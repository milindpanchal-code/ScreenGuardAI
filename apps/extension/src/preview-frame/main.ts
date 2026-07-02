import "./preview-frame.css";
import { MediaPipeMonitoringEngine, type PostureEstimate } from "@screenguard/vision";
import {
  getCalibrationProfile,
  saveCalibrationProfile
} from "../features/calibration/calibration-storage";
import type { CalibrationProfile } from "../features/calibration/calibration-schema";

const video = document.getElementById("preview") as HTMLVideoElement | null;
const status = document.getElementById("status") as HTMLParagraphElement | null;
let activeStream: MediaStream | null = null;
let monitoringEngine: MediaPipeMonitoringEngine | null = null;
let animationFrameId: number | null = null;
let lastInferenceAt = 0;
let inferenceInProgress = false;
const INFERENCE_INTERVAL_MS = 250;
const CALIBRATION_SAMPLE_TARGET = 12;
const CALIBRATION_TIMEOUT_MS = 10_000;
let calibrationStartedAt = 0;
let calibrationSamples: PostureEstimate[] = [];
let isCalibrating = false;

function setStatus(message: string) {
  if (status) {
    status.textContent = message;
    status.hidden = message.length === 0;
  }
}

function notifyParent(type: string, message = "", payload?: unknown) {
  window.parent.postMessage(
    {
      source: "screenguard-ai",
      type,
      message,
      payload
    },
    "*"
  );
}

function schedulePostureEstimate() {
  if (activeStream && monitoringEngine && animationFrameId === null) {
    animationFrameId = requestAnimationFrame(runPostureEstimate);
  }
}

function median(values: number[]) {
  const sortedValues = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
    : sortedValues[middle];
}

async function collectCalibrationSample(estimate: PostureEstimate) {
  if (!isCalibrating) {
    return;
  }

  if (performance.now() - calibrationStartedAt >= CALIBRATION_TIMEOUT_MS) {
    isCalibrating = false;
    calibrationSamples = [];
    notifyParent("calibration-error", "Keep your face visible and try calibration again.");
    return;
  }

  if (estimate.faceWidthRatio === null || estimate.headTiltDegrees === null) {
    return;
  }

  calibrationSamples.push(estimate);
  notifyParent("calibration-progress", "", {
    collected: calibrationSamples.length,
    target: CALIBRATION_SAMPLE_TARGET
  });
  if (calibrationSamples.length < CALIBRATION_SAMPLE_TARGET) {
    return;
  }

  isCalibrating = false;
  const profile: CalibrationProfile = {
    calibratedAt: new Date().toISOString(),
    baselineFaceWidthRatio: median(
      calibrationSamples.map((sample) => sample.faceWidthRatio as number)
    ),
    baselineHeadTiltDegrees: median(
      calibrationSamples.map((sample) => sample.headTiltDegrees as number)
    ),
    sampleCount: calibrationSamples.length
  };
  calibrationSamples = [];
  try {
    await saveCalibrationProfile(profile);
    monitoringEngine?.setCalibration(profile);
    notifyParent("calibration-complete", "Calibration saved locally.");
  } catch {
    notifyParent("calibration-error", "Calibration could not be saved.");
  }
}

function startCalibration() {
  if (!monitoringEngine) {
    notifyParent("calibration-error", "Wait for posture analysis to finish loading.");
    return;
  }

  calibrationSamples = [];
  calibrationStartedAt = performance.now();
  isCalibrating = true;
  notifyParent("calibration-started");
}

async function runPostureEstimate(timestamp: number) {
  animationFrameId = null;
  if (!video || !monitoringEngine || !activeStream) {
    return;
  }

  try {
    if (
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      !inferenceInProgress &&
      timestamp - lastInferenceAt >= INFERENCE_INTERVAL_MS
    ) {
      inferenceInProgress = true;
      lastInferenceAt = timestamp;
      const estimate: PostureEstimate = await monitoringEngine.estimate(video);
      notifyParent("posture-estimate", "", estimate);
      await collectCalibrationSample(estimate);
    }
  } catch (caughtError) {
    console.error("ScreenGuard posture inference failed:", caughtError);
  } finally {
    inferenceInProgress = false;
    schedulePostureEstimate();
  }
}

async function startPostureMonitoring() {
  try {
    setStatus("Loading local posture model...");
    monitoringEngine = await MediaPipeMonitoringEngine.create({
      modelAssetPath: chrome.runtime.getURL("models/face_landmarker.task"),
      wasmRoot: chrome.runtime.getURL("wasm")
    });
    monitoringEngine.setCalibration(await getCalibrationProfile());
    setStatus("");
    schedulePostureEstimate();
  } catch {
    setStatus("");
    notifyParent("vision-error", "Posture analysis is unavailable.");
  }
}

function getCameraErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof DOMException) {
    if (caughtError.name === "NotAllowedError") {
      return "Allow camera access for ScreenGuard AI.";
    }

    if (caughtError.name === "NotFoundError") {
      return "No camera was found on this device.";
    }

    if (caughtError.name === "NotReadableError") {
      return "Camera is already in use by another app.";
    }
  }

  return "Camera preview is unavailable.";
}

async function startCamera() {
  if (!video) {
    return;
  }

  try {
    setStatus("Starting camera...");
    video.muted = true;
    video.playsInline = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user"
      }
    });
    activeStream = stream;
    video.srcObject = stream;
    await video.play();
    setStatus("");
    notifyParent("camera-ready");
    await startPostureMonitoring();
  } catch (caughtError) {
    const message = getCameraErrorMessage(caughtError);
    setStatus(message);
    notifyParent("camera-error", message);
  }
}

function stopCamera() {
  isCalibrating = false;
  calibrationSamples = [];
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  monitoringEngine?.close();
  monitoringEngine = null;
  activeStream?.getTracks().forEach((track) => track.stop());
  activeStream = null;
  if (video) {
    video.srcObject = null;
  }
}

function handleParentMessage(event: MessageEvent) {
  if (event.source !== window.parent || event.data?.source !== "screenguard-ai") {
    return;
  }

  if (event.data.type === "stop-camera") {
    stopCamera();
    return;
  }

  if (event.data.type === "set-mirror" && video) {
    video.style.transform = event.data.payload ? "scaleX(-1)" : "scaleX(1)";
    return;
  }

  if (event.data.type === "start-calibration") {
    startCalibration();
  }
}

window.addEventListener("message", handleParentMessage);
window.addEventListener(
  "pagehide",
  () => {
    window.removeEventListener("message", handleParentMessage);
    stopCamera();
  },
  { once: true }
);
void startCamera().catch((caughtError: unknown) => {
  console.error("ScreenGuard camera startup failed:", caughtError);
});
