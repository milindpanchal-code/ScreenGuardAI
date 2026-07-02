import { useCallback, useEffect, useState } from "react";
import { getCalibrationProfile } from "../calibration/calibration-storage";
import { getPreviewActiveState, setPreviewActiveState } from "../preview/preview-state-storage";
import { setPreviewTabId } from "../preview/preview-session-storage";
import { getSettings } from "../settings/settings-storage";
import { getMonitoringActiveState, stopMonitoringSession } from "../statistics/statistics-storage";

type OptionsView = "settings" | "statistics";

const PREVIEW_SCRIPT_FILE = "assets/floating-preview.js";
const STOP_MONITORING_EVENT = "screenguard:stop-monitoring";

function getActiveTabQuery(): chrome.tabs.QueryInfo {
  return {
    active: true,
    currentWindow: true
  };
}

function isInjectableTab(
  tab: chrome.tabs.Tab | undefined
): tab is chrome.tabs.Tab & { id: number } {
  return Boolean(tab?.id && tab.url && /^https?:\/\//.test(tab.url));
}

async function getActiveInjectableTab() {
  const [tab] = await chrome.tabs.query(getActiveTabQuery());
  if (!isInjectableTab(tab)) {
    throw new Error("Open a normal website tab before starting the preview.");
  }

  return tab;
}

export function useFloatingPreviewControls() {
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void Promise.all([getPreviewActiveState(), getMonitoringActiveState(), getCalibrationProfile()])
      .then(([previewActive, monitoringActive, calibration]) => {
        if (!isMounted) return;
        setIsPreviewActive(previewActive);
        setIsMonitoringActive(monitoringActive);
        setIsCalibrated(Boolean(calibration));
      })
      .catch(() => {
        if (isMounted) setError("ScreenGuard status could not be loaded.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const startPreview = useCallback(async () => {
    setError(null);
    setIsBusy(true);

    try {
      const settings = await getSettings();
      if (!settings.cameraPreviewEnabled) {
        throw new Error("Enable Camera Preview in Settings before starting the preview.");
      }

      const tab = await getActiveInjectableTab();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [PREVIEW_SCRIPT_FILE]
      });
      await setPreviewActiveState(true);
      await setPreviewTabId(tab.id);
      setIsPreviewActive(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to start the camera preview.";
      setError(message);
    } finally {
      setIsBusy(false);
    }
  }, []);

  const stopMonitoring = useCallback(async () => {
    setError(null);
    setIsBusy(true);

    try {
      const [tab] = await chrome.tabs.query(getActiveTabQuery());
      if (isInjectableTab(tab)) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (eventName: string) => window.dispatchEvent(new CustomEvent(eventName)),
          args: [STOP_MONITORING_EVENT]
        });
      }

      await stopMonitoringSession();
      await setPreviewActiveState(false);
      await setPreviewTabId(null);
      setIsMonitoringActive(false);
      setIsPreviewActive(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to stop monitoring.");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const openOptionsPage = useCallback((view: OptionsView) => {
    void chrome.tabs.create({
      url: chrome.runtime.getURL(`options.html#${view}`)
    });
  }, []);

  return {
    error,
    isBusy,
    isCalibrated,
    isMonitoringActive,
    isPreviewActive,
    openOptionsPage,
    startPreview,
    stopMonitoring
  };
}
