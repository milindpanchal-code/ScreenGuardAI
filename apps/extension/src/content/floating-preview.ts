import { getPreviewDimensions, getPreviewOpacity } from "../features/preview/preview-settings";
import { PostureEventAccumulator } from "../features/monitoring/posture-event-accumulator";
import {
  POSTURE_SAMPLE_BATCH_MESSAGE,
  POSTURE_WARNING_MESSAGE
} from "../features/monitoring/monitoring-messages";
import { setPreviewActiveState } from "../features/preview/preview-state-storage";
import { setPreviewTabId } from "../features/preview/preview-session-storage";
import { getSettings, saveSettings } from "../features/settings/settings-storage";
import {
  startMonitoringSession,
  STATISTICS_STORAGE_KEY,
  stopMonitoringSession
} from "../features/statistics/statistics-storage";
import type { PostureEstimate } from "@screenguard/vision";
import {
  createIconButton,
  createPostureBadge,
  createStatusOverlay,
  createStopButton,
  createWarningToast,
  setOverlayStatus,
  setPostureBadgeMessage,
  updatePostureBadge
} from "./floating-preview-elements";

const HOST_ID = "screenguard-ai-floating-preview";
const CREATING_ATTRIBUTE = "data-screenguard-preview-creating";
const STOP_MONITORING_EVENT = "screenguard:stop-monitoring";
const CONTROLLER_KEY = "__screenGuardPreviewController";
const CORNERS = ["top-right", "bottom-right", "bottom-left", "top-left"] as const;
const FRAME_ALLOW_POLICY = "camera *; autoplay *";

type Corner = (typeof CORNERS)[number];

let currentCornerIndex = 1;
let isMirrored = false;
let isMinimized = false;
let selectedOpacity = 0.75;
let restoredWidth = 320;
let restoredHeight = 220;
let calibrationFeedbackUntil = 0;
let isCalibrationActive = false;
let postureEventAccumulator: PostureEventAccumulator | null = null;
let warningToastTimer: number | null = null;
let previewIframe: HTMLIFrameElement | null = null;

type PreviewController = {
  show: () => void;
};

declare global {
  interface Window {
    [CONTROLLER_KEY]?: PreviewController;
  }
}

function getRuntimeUrl(path: string) {
  return chrome.runtime.getURL(path);
}

function getHost() {
  return document.getElementById(HOST_ID);
}

function isExtensionContextInvalidated(caughtError: unknown) {
  return String(caughtError).includes("Extension context invalidated");
}

function runSafely(task: Promise<unknown>) {
  void task.catch((caughtError: unknown) => {
    if (isExtensionContextInvalidated(caughtError)) {
      getHost()?.remove();
      document.documentElement.removeAttribute(CREATING_ATTRIBUTE);
      return;
    }

    console.error("ScreenGuard AI task failed:", caughtError);
  });
}

function applyCorner(host: HTMLElement, corner: Corner) {
  host.style.top = corner.includes("top") ? "24px" : "auto";
  host.style.bottom = corner.includes("bottom") ? "24px" : "auto";
  host.style.left = corner.includes("left") ? "24px" : "auto";
  host.style.right = corner.includes("right") ? "24px" : "auto";
}

function postPreviewMessage(host: HTMLElement, type: string, payload?: unknown) {
  const iframe = host.querySelector("iframe");
  iframe?.contentWindow?.postMessage({ source: "screenguard-ai", type, payload }, "*");
}

function setControlsVisibility(host: HTMLElement) {
  host.querySelectorAll<HTMLElement>("[data-screenguard-normal]").forEach((element) => {
    element.hidden = isMinimized;
    element.style.display = isMinimized ? "none" : "flex";
  });
  host.querySelectorAll<HTMLElement>("[data-screenguard-minimized]").forEach((element) => {
    element.hidden = !isMinimized;
    element.style.display = isMinimized ? "flex" : "none";
  });
  host.style.resize = isMinimized ? "none" : "both";
}

function setMinimized(host: HTMLElement, minimized: boolean) {
  isMinimized = minimized;
  host.dataset.minimized = String(isMinimized);
  host.style.width = isMinimized ? "132px" : `${restoredWidth}px`;
  host.style.height = isMinimized ? "64px" : `${restoredHeight}px`;
  if (isMinimized) {
    const toast = host.querySelector<HTMLElement>("[data-screenguard-warning-toast]");
    if (toast) {
      toast.style.display = "none";
    }
  }
  setControlsVisibility(host);
}

function showWarningToast(host: HTMLElement, state: "leaning" | "too-close") {
  const toast = host.querySelector<HTMLElement>("[data-screenguard-warning-toast]");
  if (!toast) {
    return;
  }

  toast.textContent =
    state === "too-close" ? "Move farther away from the screen" : "Return your head to upright";
  toast.style.display = "flex";
  if (warningToastTimer !== null) {
    window.clearTimeout(warningToastTimer);
  }
  warningToastTimer = window.setTimeout(() => {
    toast.style.display = "none";
    warningToastTimer = null;
  }, 4500);
}

function recordPostureEstimate(host: HTMLElement, estimate: PostureEstimate) {
  const monitoringEvent = postureEventAccumulator?.add(estimate);
  if (monitoringEvent?.batch) {
    runSafely(
      chrome.runtime.sendMessage({
        type: POSTURE_SAMPLE_BATCH_MESSAGE,
        ...monitoringEvent.batch
      })
    );
  }

  if (monitoringEvent?.warning) {
    showWarningToast(host, monitoringEvent.warning);
    runSafely(
      chrome.runtime.sendMessage({
        type: POSTURE_WARNING_MESSAGE,
        state: monitoringEvent.warning
      })
    );
  }
}

async function stopMonitoringAndClose() {
  const host = getHost();
  if (host) {
    postPreviewMessage(host, "stop-camera");
  }

  try {
    await stopMonitoringSession();
    await setPreviewActiveState(false);
    await setPreviewTabId(null);
  } finally {
    destroyController();
  }
}

async function persistMirrorPreference() {
  const settings = await getSettings();
  await saveSettings({
    ...settings,
    mirrorPreviewEnabled: isMirrored
  });
}

async function persistOpacityPreference(opacityPercent: number) {
  const settings = await getSettings();
  await saveSettings({
    ...settings,
    cameraOpacity: opacityPercent
  });
}

function createControls(host: HTMLElement) {
  const controls = document.createElement("div");
  controls.dataset.screenguardNormal = "true";
  Object.assign(controls.style, {
    position: "absolute",
    inset: "10px 10px auto auto",
    display: "flex",
    gap: "8px",
    zIndex: "2"
  });

  controls.append(
    createIconButton("Snap corner", "⌖", () => {
      currentCornerIndex = (currentCornerIndex + 1) % CORNERS.length;
      applyCorner(host, CORNERS[currentCornerIndex]);
    }),
    createIconButton("Mirror preview", "⇋", () => {
      isMirrored = !isMirrored;
      postPreviewMessage(host, "set-mirror", isMirrored);
      runSafely(persistMirrorPreference());
    }),
    createIconButton("Calibrate posture", "◎", () => {
      postPreviewMessage(host, "start-calibration");
    }),
    createIconButton("Minimize preview", "−", () => {
      setMinimized(host, true);
    }),
    createIconButton("Hide preview", "×", () => {
      hidePreview();
    })
  );

  return controls;
}

function createMinimizedControls(host: HTMLElement) {
  const controls = document.createElement("div");
  controls.dataset.screenguardMinimized = "true";
  controls.hidden = true;
  Object.assign(controls.style, {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    zIndex: "3"
  });

  controls.append(
    createIconButton("Restore preview", "□", () => {
      setMinimized(host, false);
    }),
    createIconButton("Stop monitoring", "■", () => {
      runSafely(stopMonitoringAndClose());
    }),
    createIconButton("Hide preview", "×", () => {
      hidePreview();
    })
  );

  return controls;
}

function createOpacityControl(host: HTMLElement, opacityPercent: number) {
  const wrap = document.createElement("label");
  wrap.dataset.screenguardNormal = "true";
  const value = document.createElement("span");
  const input = document.createElement("input");

  input.type = "range";
  input.min = "35";
  input.max = "100";
  input.value = String(opacityPercent);
  value.textContent = `${opacityPercent}%`;

  Object.assign(wrap.style, {
    position: "absolute",
    left: "12px",
    right: "12px",
    bottom: "52px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "white",
    font: "600 12px system-ui, sans-serif",
    zIndex: "2",
    textShadow: "0 1px 2px rgba(0,0,0,.35)"
  });

  input.style.flex = "1";
  input.addEventListener("input", () => {
    const opacity = Number(input.value) / 100;
    selectedOpacity = opacity;
    host.dataset.opacity = String(selectedOpacity);
    host.style.opacity = String(selectedOpacity);
    value.textContent = `${input.value}%`;
    runSafely(persistOpacityPreference(Number(input.value)));
  });

  wrap.append(input, value);
  return wrap;
}

async function createPreviewHost() {
  const settings = await getSettings();
  postureEventAccumulator = new PostureEventAccumulator(settings.sensitivity);
  const dimensions = getPreviewDimensions(settings.cameraSize);
  const opacity = getPreviewOpacity(settings);
  isMirrored = settings.mirrorPreviewEnabled;
  selectedOpacity = opacity;
  restoredWidth = dimensions.width;
  restoredHeight = dimensions.height;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.dataset.opacity = String(opacity);

  Object.assign(host.style, {
    position: "fixed",
    zIndex: "2147483647",
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    minWidth: "54px",
    minHeight: "54px",
    resize: "both",
    overflow: "hidden",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,.6)",
    background: "rgba(12, 24, 21, .46)",
    boxShadow: "0 22px 60px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.55)",
    backdropFilter: "blur(18px) saturate(160%)",
    opacity: String(opacity),
    transition: "opacity .18s ease, width .18s ease, height .18s ease"
  });

  applyCorner(host, CORNERS[currentCornerIndex]);

  const iframe = document.createElement("iframe");
  previewIframe = iframe;
  iframe.src = getRuntimeUrl("preview-frame.html");
  iframe.title = "ScreenGuard AI camera preview";
  iframe.allow = FRAME_ALLOW_POLICY;
  iframe.setAttribute("allow", FRAME_ALLOW_POLICY);
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "0",
    display: "block"
  });

  iframe.addEventListener("load", () => {
    postPreviewMessage(host, "set-mirror", isMirrored);
  });

  host.addEventListener("mouseenter", () => {
    host.style.opacity = "1";
  });
  host.addEventListener("mouseleave", () => {
    host.style.opacity = host.dataset.opacity ?? String(selectedOpacity);
  });

  host.append(
    iframe,
    createStatusOverlay(),
    createPostureBadge(),
    createWarningToast(),
    createControls(host),
    createMinimizedControls(host),
    createOpacityControl(host, settings.cameraOpacity),
    createStopButton(() => {
      runSafely(stopMonitoringAndClose());
    })
  );
  setControlsVisibility(host);
  document.documentElement.append(host);
}

function hidePreview() {
  const host = getHost();
  if (!host) {
    return;
  }

  host.style.display = "none";
  runSafely(setPreviewActiveState(false));
}

function showPreview() {
  const host = getHost();
  if (!host) {
    return;
  }

  host.style.display = "block";
  runSafely(setPreviewActiveState(true));
}

function handleStopMonitoringEvent() {
  runSafely(stopMonitoringAndClose());
}

function handlePreviewMessage(event: MessageEvent) {
  const host = getHost();
  if (
    !host ||
    event.source !== previewIframe?.contentWindow ||
    event.data?.source !== "screenguard-ai"
  ) {
    return;
  }

  switch (event.data.type) {
    case "camera-ready":
      setOverlayStatus(host, "");
      runSafely(setPreviewActiveState(true));
      runSafely(startMonitoringSession());
      break;
    case "camera-error":
      setOverlayStatus(host, event.data.message ?? "Camera preview is unavailable.", "error");
      runSafely(setPreviewActiveState(false));
      runSafely(setPreviewTabId(null));
      runSafely(stopMonitoringSession());
      break;
    case "posture-estimate":
      if (!isCalibrationActive && Date.now() >= calibrationFeedbackUntil) {
        updatePostureBadge(host, event.data.payload?.state ?? "unknown");
        recordPostureEstimate(host, event.data.payload as PostureEstimate);
      }
      break;
    case "calibration-started":
      isCalibrationActive = true;
      setPostureBadgeMessage(host, "Sit upright and hold still", "rgba(15, 118, 104, .88)");
      break;
    case "calibration-progress": {
      const collected = Number(event.data.payload?.collected ?? 0);
      const target = Number(event.data.payload?.target ?? 12);
      setPostureBadgeMessage(host, `Calibrating ${collected}/${target}`, "rgba(15, 118, 104, .88)");
      break;
    }
    case "calibration-complete":
      isCalibrationActive = false;
      calibrationFeedbackUntil = Date.now() + 2500;
      setPostureBadgeMessage(host, "Calibration saved", "rgba(15, 118, 104, .88)");
      break;
    case "calibration-error":
      isCalibrationActive = false;
      calibrationFeedbackUntil = Date.now() + 3500;
      setPostureBadgeMessage(
        host,
        event.data.message ?? "Calibration failed",
        "rgba(145, 38, 30, .88)"
      );
      break;
    case "vision-error":
      updatePostureBadge(host, "unavailable");
      break;
  }
}

function handleStorageChange(
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
) {
  if (areaName !== "local") {
    return;
  }

  const statisticsChange = changes[STATISTICS_STORAGE_KEY];
  const previousSession = statisticsChange?.oldValue?.activeSessionStartedAt;
  const nextSession = statisticsChange?.newValue?.activeSessionStartedAt;
  if (typeof previousSession !== "string" || nextSession !== null) {
    return;
  }

  destroyController();
  runSafely(setPreviewActiveState(false));
  runSafely(setPreviewTabId(null));
}

function showOrCreatePreview() {
  if (getHost()) {
    showPreview();
    return;
  }

  if (document.documentElement.hasAttribute(CREATING_ATTRIBUTE)) {
    return;
  }

  document.documentElement.setAttribute(CREATING_ATTRIBUTE, "true");
  runSafely(
    createPreviewHost().finally(() => {
      document.documentElement.removeAttribute(CREATING_ATTRIBUTE);
    })
  );
}

function destroyController() {
  const host = getHost();
  if (host) {
    postPreviewMessage(host, "stop-camera");
    host.remove();
  }
  previewIframe = null;
  if (warningToastTimer !== null) {
    window.clearTimeout(warningToastTimer);
    warningToastTimer = null;
  }
  window.removeEventListener("message", handlePreviewMessage);
  window.removeEventListener(STOP_MONITORING_EVENT, handleStopMonitoringEvent);
  chrome.storage.onChanged.removeListener(handleStorageChange);
  delete window[CONTROLLER_KEY];
}

const existingController = window[CONTROLLER_KEY];
if (existingController) {
  existingController.show();
} else {
  window[CONTROLLER_KEY] = { show: showOrCreatePreview };
  window.addEventListener("message", handlePreviewMessage);
  window.addEventListener(STOP_MONITORING_EVENT, handleStopMonitoringEvent);
  chrome.storage.onChanged.addListener(handleStorageChange);
  showOrCreatePreview();
}
