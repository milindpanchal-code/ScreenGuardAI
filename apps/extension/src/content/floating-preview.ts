import { getPreviewDimensions, getPreviewOpacity } from "../features/preview/preview-settings";
import { PostureEventAccumulator } from "../features/monitoring/posture-event-accumulator";
import {
  POSTURE_SAMPLE_BATCH_MESSAGE,
  POSTURE_WARNING_MESSAGE
} from "../features/monitoring/monitoring-messages";
import { setPreviewActiveState } from "../features/preview/preview-state-storage";
import { getSettings, saveSettings } from "../features/settings/settings-storage";
import {
  startMonitoringSession,
  stopMonitoringSession
} from "../features/statistics/statistics-storage";
import type { PostureEstimate } from "@screenguard/vision";

const HOST_ID = "screenguard-ai-floating-preview";
const CREATING_ATTRIBUTE = "data-screenguard-preview-creating";
const REMOVE_EVENT = "screenguard:remove-preview";
const STOP_MONITORING_EVENT = "screenguard:stop-monitoring";
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

function setOverlayStatus(
  host: HTMLElement,
  message: string,
  tone: "neutral" | "error" = "neutral"
) {
  const status = host.querySelector<HTMLElement>("[data-screenguard-status]");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.hidden = message.length === 0;
  status.style.background = tone === "error" ? "rgba(112, 35, 24, .84)" : "rgba(10, 22, 19, .58)";
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
  setControlsVisibility(host);
}

function createStatusOverlay() {
  const status = document.createElement("div");
  status.dataset.screenguardStatus = "true";
  status.textContent = "Starting camera...";
  Object.assign(status.style, {
    position: "absolute",
    inset: "0",
    display: "grid",
    placeItems: "center",
    padding: "18px",
    color: "white",
    background: "rgba(10, 22, 19, .58)",
    font: "600 13px system-ui, sans-serif",
    lineHeight: "1.45",
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0,0,0,.35)",
    zIndex: "1"
  });
  return status;
}

function createPostureBadge() {
  const badge = document.createElement("div");
  badge.dataset.screenguardPosture = "true";
  badge.dataset.screenguardNormal = "true";
  badge.textContent = "Analyzing posture";
  Object.assign(badge.style, {
    position: "absolute",
    inset: "50px auto auto 10px",
    display: "flex",
    alignItems: "center",
    minHeight: "30px",
    maxWidth: "130px",
    padding: "0 10px",
    border: "1px solid rgba(255,255,255,.5)",
    borderRadius: "8px",
    background: "rgba(10, 22, 19, .58)",
    color: "white",
    backdropFilter: "blur(14px) saturate(160%)",
    font: "700 11px system-ui, sans-serif",
    zIndex: "2"
  });
  return badge;
}

function updatePostureBadge(host: HTMLElement, state: string) {
  const badge = host.querySelector<HTMLElement>("[data-screenguard-posture]");
  if (!badge) {
    return;
  }

  const presentations: Record<string, [string, string]> = {
    healthy: ["Posture good", "rgba(15, 118, 104, .82)"],
    leaning: ["Head is tilted", "rgba(180, 83, 9, .86)"],
    "too-close": ["Move farther back", "rgba(145, 38, 30, .88)"],
    unknown: ["Face not detected", "rgba(10, 22, 19, .58)"],
    unavailable: ["Analysis unavailable", "rgba(112, 35, 24, .84)"]
  };
  const presentation = presentations[state] ?? ["Analyzing posture", "rgba(10, 22, 19, .58)"];

  badge.textContent = presentation[0];
  badge.style.background = presentation[1];
}

function setPostureBadgeMessage(host: HTMLElement, message: string, background: string) {
  const badge = host.querySelector<HTMLElement>("[data-screenguard-posture]");
  if (!badge) {
    return;
  }

  badge.textContent = message;
  badge.style.background = background;
}

function recordPostureEstimate(estimate: PostureEstimate) {
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
    runSafely(
      chrome.runtime.sendMessage({
        type: POSTURE_WARNING_MESSAGE,
        state: monitoringEvent.warning
      })
    );
  }
}

function makeIconButton(label: string, text: string, onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.title = label;
  button.setAttribute("aria-label", label);
  Object.assign(button.style, {
    width: "30px",
    height: "30px",
    border: "1px solid rgba(255,255,255,.5)",
    borderRadius: "999px",
    background: "rgba(10, 22, 19, .42)",
    color: "white",
    backdropFilter: "blur(14px) saturate(160%)",
    fontSize: "14px",
    lineHeight: "1"
  });
  button.addEventListener("click", onClick);
  return button;
}

function makeStopButton(onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Stop monitoring";
  button.title = "Stop monitoring";
  Object.assign(button.style, {
    position: "absolute",
    left: "12px",
    right: "12px",
    bottom: "10px",
    height: "34px",
    border: "1px solid rgba(255,255,255,.72)",
    borderRadius: "8px",
    background: "rgba(145, 38, 30, .88)",
    color: "white",
    backdropFilter: "blur(14px) saturate(160%)",
    font: "700 12px system-ui, sans-serif",
    cursor: "pointer",
    zIndex: "2"
  });
  button.dataset.screenguardNormal = "true";
  button.addEventListener("click", onClick);
  return button;
}

async function stopMonitoringAndClose() {
  const host = getHost();
  if (host) {
    postPreviewMessage(host, "stop-camera");
  }

  await stopMonitoringSession();
  await setPreviewActiveState(false);
  host?.remove();
}

async function persistMirrorPreference() {
  const settings = await getSettings();
  postureEventAccumulator = new PostureEventAccumulator(settings.sensitivity);
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
    makeIconButton("Snap corner", "⌖", () => {
      currentCornerIndex = (currentCornerIndex + 1) % CORNERS.length;
      applyCorner(host, CORNERS[currentCornerIndex]);
    }),
    makeIconButton("Mirror preview", "⇋", () => {
      isMirrored = !isMirrored;
      postPreviewMessage(host, "set-mirror", isMirrored);
      runSafely(persistMirrorPreference());
    }),
    makeIconButton("Calibrate posture", "◎", () => {
      postPreviewMessage(host, "start-calibration");
    }),
    makeIconButton("Minimize preview", "−", () => {
      setMinimized(host, true);
    }),
    makeIconButton("Hide preview", "×", () => {
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
    makeIconButton("Restore preview", "□", () => {
      setMinimized(host, false);
    }),
    makeIconButton("Stop monitoring", "■", () => {
      runSafely(stopMonitoringAndClose());
    }),
    makeIconButton("Hide preview", "×", () => {
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

  window.addEventListener("message", (event) => {
    if (event.source !== iframe.contentWindow || event.data?.source !== "screenguard-ai") {
      return;
    }

    if (event.data.type === "camera-ready") {
      setOverlayStatus(host, "");
      runSafely(setPreviewActiveState(true));
      runSafely(startMonitoringSession());
      return;
    }

    if (event.data.type === "camera-error") {
      setOverlayStatus(host, event.data.message ?? "Camera preview is unavailable.", "error");
      runSafely(setPreviewActiveState(false));
      runSafely(stopMonitoringSession());
      return;
    }

    if (event.data.type === "posture-estimate") {
      if (!isCalibrationActive && Date.now() >= calibrationFeedbackUntil) {
        updatePostureBadge(host, event.data.payload?.state ?? "unknown");
        recordPostureEstimate(event.data.payload as PostureEstimate);
      }
      return;
    }

    if (event.data.type === "calibration-started") {
      isCalibrationActive = true;
      setPostureBadgeMessage(host, "Sit upright and hold still", "rgba(15, 118, 104, .88)");
      return;
    }

    if (event.data.type === "calibration-progress") {
      const collected = Number(event.data.payload?.collected ?? 0);
      const target = Number(event.data.payload?.target ?? 12);
      setPostureBadgeMessage(host, `Calibrating ${collected}/${target}`, "rgba(15, 118, 104, .88)");
      return;
    }

    if (event.data.type === "calibration-complete") {
      isCalibrationActive = false;
      calibrationFeedbackUntil = Date.now() + 2500;
      setPostureBadgeMessage(host, "Calibration saved", "rgba(15, 118, 104, .88)");
      return;
    }

    if (event.data.type === "calibration-error") {
      isCalibrationActive = false;
      calibrationFeedbackUntil = Date.now() + 3500;
      setPostureBadgeMessage(
        host,
        event.data.message ?? "Calibration failed",
        "rgba(145, 38, 30, .88)"
      );
      return;
    }

    if (event.data.type === "vision-error") {
      updatePostureBadge(host, "unavailable");
    }
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
    createControls(host),
    createMinimizedControls(host),
    createOpacityControl(host, settings.cameraOpacity),
    makeStopButton(() => {
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

if (getHost()) {
  showPreview();
} else if (!document.documentElement.hasAttribute(CREATING_ATTRIBUTE)) {
  document.documentElement.setAttribute(CREATING_ATTRIBUTE, "true");
  runSafely(
    createPreviewHost().finally(() => {
      document.documentElement.removeAttribute(CREATING_ATTRIBUTE);
    })
  );
}

window.removeEventListener(REMOVE_EVENT, hidePreview);
window.addEventListener(REMOVE_EVENT, hidePreview);
window.removeEventListener(STOP_MONITORING_EVENT, handleStopMonitoringEvent);
window.addEventListener(STOP_MONITORING_EVENT, handleStopMonitoringEvent);
