import { useCallback, useEffect, useState } from "react";
import {
  exportSettingsToJson,
  getSettings,
  importSettingsFromJson,
  resetSettings,
  saveSettings
} from "./settings-storage";
import { defaultSettings, type ScreenGuardSettings } from "./settings-schema";

export function useSettingsDraft() {
  const [draft, setDraft] = useState<ScreenGuardSettings>(defaultSettings);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void getSettings()
      .then((settings) => {
        if (isMounted) setDraft(settings);
      })
      .catch(() => {
        if (isMounted) setMessage("Settings could not be loaded.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateDraft = useCallback(
    <Key extends keyof ScreenGuardSettings>(key: Key, value: ScreenGuardSettings[Key]) => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        [key]: value
      }));
    },
    []
  );

  const saveDraft = useCallback(async () => {
    try {
      await saveSettings(draft);
      setMessage("Settings saved locally.");
    } catch {
      setMessage("Settings could not be saved.");
    }
  }, [draft]);

  const resetDraft = useCallback(async () => {
    try {
      const settings = await resetSettings();
      setDraft(settings);
      setMessage("Settings reset.");
    } catch {
      setMessage("Settings could not be reset.");
    }
  }, []);

  const importDraft = useCallback(async (json: string) => {
    try {
      const settings = await importSettingsFromJson(json);
      setDraft(settings);
      setMessage("Settings imported.");
    } catch {
      setMessage("Import failed. Choose a valid ScreenGuard AI settings JSON file.");
    }
  }, []);

  const exportDraft = useCallback(() => exportSettingsToJson(draft), [draft]);

  return {
    draft,
    exportDraft,
    importDraft,
    message,
    resetDraft,
    saveDraft,
    updateDraft
  };
}
