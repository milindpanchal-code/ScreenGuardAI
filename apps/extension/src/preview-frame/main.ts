import "./preview-frame.css";

const video = document.getElementById("preview") as HTMLVideoElement | null;
const status = document.getElementById("status") as HTMLParagraphElement | null;

function setStatus(message: string) {
  if (status) {
    status.textContent = message;
    status.hidden = message.length === 0;
  }
}

function notifyParent(type: "camera-ready" | "camera-error", message = "") {
  window.parent.postMessage(
    {
      source: "screenguard-ai",
      type,
      message
    },
    "*"
  );
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
    video.srcObject = stream;
    await video.play();
    setStatus("");
    notifyParent("camera-ready");
  } catch (caughtError) {
    const message = getCameraErrorMessage(caughtError);
    setStatus(message);
    notifyParent("camera-error", message);
  }
}

window.addEventListener("message", (event) => {
  if (event.data?.source !== "screenguard-ai" || event.data?.type !== "set-mirror" || !video) {
    return;
  }

  video.style.transform = event.data.payload ? "scaleX(-1)" : "scaleX(1)";
});

void startCamera();
