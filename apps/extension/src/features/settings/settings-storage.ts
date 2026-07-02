import { localStorageAdapter } from "../../platform/storage/local-storage";
import { defaultSettings, sanitizeSettings, type ScreenGuardSettings } from "./settings-schema";

const SETTINGS_KEY = "screenguard.settings";

/** Reads and sanitizes the locally persisted settings. */
export async function getSettings(): Promise<ScreenGuardSettings> {
  const storedSettings = await localStorageAdapter.get<unknown>(SETTINGS_KEY, defaultSettings);
  return sanitizeSettings(storedSettings);
}

/** Sanitizes and persists the complete settings document. */
export async function saveSettings(settings: ScreenGuardSettings): Promise<void> {
  await localStorageAdapter.set(SETTINGS_KEY, sanitizeSettings(settings));
}

export async function resetSettings(): Promise<ScreenGuardSettings> {
  await saveSettings(defaultSettings);
  return defaultSettings;
}

/** Parses, sanitizes, and persists an imported settings document. */
export async function importSettingsFromJson(json: string): Promise<ScreenGuardSettings> {
  const parsed = JSON.parse(json) as unknown;
  const settings = sanitizeSettings(parsed);
  await saveSettings(settings);
  return settings;
}

export function exportSettingsToJson(settings: ScreenGuardSettings): string {
  return JSON.stringify(settings, null, 2);
}
