import { setPreviewActiveState } from "../features/preview/preview-state-storage";

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
