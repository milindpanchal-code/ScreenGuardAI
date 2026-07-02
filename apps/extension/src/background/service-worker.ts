import { setPreviewActiveState } from "../features/preview/preview-state-storage";
import {
  isMonitoringMessage,
  POSTURE_SAMPLE_BATCH_MESSAGE
} from "../features/monitoring/monitoring-messages";
import { getSettings } from "../features/settings/settings-storage";
import {
  recordPostureSampleBatch,
  recordPostureWarning
} from "../features/statistics/statistics-storage";
import { localStorageAdapter } from "../platform/storage/local-storage";

const LAST_WARNING_AT_KEY = "screenguard.notifications.last-warning-at";
let monitoringMessageQueue: Promise<void> = Promise.resolve();

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

chrome.runtime.onInstalled.addListener(() => {
  void chrome.alarms.create("screenguard.lifecycle", {
    periodInMinutes: 60
  });
});

chrome.tabs.onRemoved.addListener(() => {
  void setPreviewActiveState(false);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "screenguard.lifecycle") {
    return;
  }
});

chrome.runtime.onMessage.addListener((message) => {
  monitoringMessageQueue = monitoringMessageQueue
    .then(() => handleMonitoringMessage(message))
    .catch((caughtError: unknown) => {
      console.error("ScreenGuard monitoring message failed:", caughtError);
    });
});
