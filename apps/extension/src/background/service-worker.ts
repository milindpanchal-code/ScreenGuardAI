import { setPreviewActiveState } from "../features/preview/preview-state-storage";
import { getPreviewTabId, setPreviewTabId } from "../features/preview/preview-session-storage";
import {
  isMonitoringMessage,
  POSTURE_SAMPLE_BATCH_MESSAGE
} from "../features/monitoring/monitoring-messages";
import { getSettings } from "../features/settings/settings-storage";
import {
  recordPostureSampleBatch,
  recordPostureWarning,
  stopMonitoringSession
} from "../features/statistics/statistics-storage";
import { localStorageAdapter } from "../platform/storage/local-storage";

const LAST_WARNING_AT_KEY = "screenguard.notifications.last-warning-at";
let monitoringMessageQueue: Promise<void> = Promise.resolve();

function reportBackgroundError(context: string, caughtError: unknown) {
  console.error(`ScreenGuard ${context} failed:`, caughtError);
}

function runBackgroundTask(context: string, task: Promise<unknown>) {
  void task.catch((caughtError: unknown) => reportBackgroundError(context, caughtError));
}

async function finishTrackedTabSession(tabId: number) {
  if ((await getPreviewTabId()) !== tabId) {
    return;
  }

  await Promise.all([stopMonitoringSession(), setPreviewActiveState(false), setPreviewTabId(null)]);
}

async function showPostureWarning(state: "leaning" | "too-close") {
  const settings = await getSettings();
  const lastWarningAt = await localStorageAdapter.get<number>(LAST_WARNING_AT_KEY, 0);
  const now = Date.now();
  if (now - lastWarningAt < settings.notificationCooldownMinutes * 60_000) {
    return;
  }

  const message =
    state === "too-close"
      ? "Move a little farther from your screen."
      : "Bring your head back to your calibrated upright position.";
  await chrome.notifications.create(`screenguard-posture-${now}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon-128.png"),
    title: "ScreenGuard posture reminder",
    message,
    silent: !settings.notificationSoundEnabled
  });
  await recordPostureWarning();
  await localStorageAdapter.set(LAST_WARNING_AT_KEY, now);
}

async function handleMonitoringMessage(message: unknown) {
  if (!isMonitoringMessage(message)) {
    return;
  }

  if (message.type === POSTURE_SAMPLE_BATCH_MESSAGE) {
    await recordPostureSampleBatch(message.scoreTotal, message.sampleCount);
    return;
  }

  await showPostureWarning(message.state);
}

chrome.tabs.onRemoved.addListener((tabId) => {
  runBackgroundTask("tab removal cleanup", finishTrackedTabSession(tabId));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    runBackgroundTask("tab navigation cleanup", finishTrackedTabSession(tabId));
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const operation = monitoringMessageQueue.then(() => handleMonitoringMessage(message));
  monitoringMessageQueue = operation.catch((caughtError: unknown) => {
    reportBackgroundError("monitoring message", caughtError);
  });
  void operation.then(
    () => sendResponse({ ok: true }),
    () => sendResponse({ ok: false })
  );
  return true;
});
