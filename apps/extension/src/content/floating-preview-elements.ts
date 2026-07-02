const BADGE_PRESENTATIONS: Record<string, [string, string]> = {
  healthy: ["Posture good", "rgba(15, 118, 104, .82)"],
  leaning: ["Head is tilted", "rgba(180, 83, 9, .86)"],
  "too-close": ["Move farther back", "rgba(145, 38, 30, .88)"],
  unknown: ["Face not detected", "rgba(10, 22, 19, .58)"],
  unavailable: ["Analysis unavailable", "rgba(112, 35, 24, .84)"]
};
const DEFAULT_BADGE_PRESENTATION: [string, string] = ["Analyzing posture", "rgba(10, 22, 19, .58)"];

function getPostureBadge(host: HTMLElement) {
  return host.querySelector<HTMLElement>("[data-screenguard-posture]");
}

/** Creates the full-frame camera startup and error overlay. */
export function createStatusOverlay() {
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

/** Updates the camera status overlay without replacing its DOM node. */
export function setOverlayStatus(
  host: HTMLElement,
  message: string,
  tone: "neutral" | "error" = "neutral"
) {
  const status = host.querySelector<HTMLElement>("[data-screenguard-status]");
  if (!status) return;
  status.textContent = message;
  status.hidden = message.length === 0;
  status.style.background = tone === "error" ? "rgba(112, 35, 24, .84)" : "rgba(10, 22, 19, .58)";
}

/** Creates the compact live posture status badge. */
export function createPostureBadge() {
  const badge = document.createElement("div");
  badge.dataset.screenguardPosture = "true";
  badge.dataset.screenguardNormal = "true";
  badge.textContent = DEFAULT_BADGE_PRESENTATION[0];
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
    background: DEFAULT_BADGE_PRESENTATION[1],
    color: "white",
    backdropFilter: "blur(14px) saturate(160%)",
    font: "700 11px system-ui, sans-serif",
    zIndex: "2"
  });
  return badge;
}

/** Applies the standard text and color for a posture state. */
export function updatePostureBadge(host: HTMLElement, state: string) {
  const badge = getPostureBadge(host);
  if (!badge) return;
  const [message, background] = BADGE_PRESENTATIONS[state] ?? DEFAULT_BADGE_PRESENTATION;
  badge.textContent = message;
  badge.style.background = background;
}

/** Applies temporary calibration feedback to the posture badge. */
export function setPostureBadgeMessage(host: HTMLElement, message: string, background: string) {
  const badge = getPostureBadge(host);
  if (!badge) return;
  badge.textContent = message;
  badge.style.background = background;
}

/** Creates the high-contrast in-preview warning announcement. */
export function createWarningToast() {
  const toast = document.createElement("div");
  toast.dataset.screenguardWarningToast = "true";
  toast.setAttribute("role", "alert");
  Object.assign(toast.style, {
    position: "absolute",
    inset: "90px 12px auto 12px",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,.8)",
    borderRadius: "8px",
    background: "rgba(153, 36, 28, .96)",
    color: "white",
    boxShadow: "0 10px 28px rgba(0,0,0,.34)",
    font: "700 13px system-ui, sans-serif",
    lineHeight: "1.3",
    textAlign: "center",
    zIndex: "4"
  });
  return toast;
}

/** Creates an accessible circular overlay control. */
export function createIconButton(label: string, text: string, onClick: () => void) {
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

/** Creates the full-width stop-monitoring command. */
export function createStopButton(onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Stop monitoring";
  button.title = "Stop monitoring";
  button.dataset.screenguardNormal = "true";
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
  button.addEventListener("click", onClick);
  return button;
}
