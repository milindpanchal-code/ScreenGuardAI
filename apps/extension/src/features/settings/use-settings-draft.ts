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
    void getSettings().then(setDraft);
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
    await saveSettings(draft);
    setMessage("Settings saved locally.");
  }, [draft]);

  const resetDraft = useCallback(async () => {
    const settings = await resetSettings();
    setDraft(settings);
    setMessage("Settings reset.");
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
