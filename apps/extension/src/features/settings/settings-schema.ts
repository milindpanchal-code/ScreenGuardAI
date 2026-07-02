export type CameraSize = "compact" | "comfortable" | "large";
export type Sensitivity = "low" | "medium" | "high";

export type ScreenGuardSettings = {
  cameraPreviewEnabled: boolean;
  cameraOpacity: number;
  cameraSize: CameraSize;
  mirrorPreviewEnabled: boolean;
  safeDistanceCm: number;
  sensitivity: Sensitivity;
  notificationCooldownMinutes: number;
  notificationSoundEnabled: boolean;
  autoStartMonitoring: boolean;
  darkModeEnabled: boolean;
  selectedCameraDeviceId: string;
};

export const defaultSettings: ScreenGuardSettings = {
  cameraPreviewEnabled: true,
  cameraOpacity: 75,
  cameraSize: "comfortable",
  mirrorPreviewEnabled: false,
  safeDistanceCm: 55,
  sensitivity: "medium",
  notificationCooldownMinutes: 15,
  notificationSoundEnabled: true,
  autoStartMonitoring: false,
  darkModeEnabled: false,
  selectedCameraDeviceId: ""
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function sanitizeCameraSize(value: unknown): CameraSize {
  return value === "compact" || value === "comfortable" || value === "large"
    ? value
    : defaultSettings.cameraSize;
}

function sanitizeSensitivity(value: unknown): Sensitivity {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : defaultSettings.sensitivity;
}

function booleanOrFallback(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Converts untrusted persisted or imported data into bounded extension settings. */
export function sanitizeSettings(value: unknown): ScreenGuardSettings {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    cameraPreviewEnabled: booleanOrFallback(
      source.cameraPreviewEnabled,
      defaultSettings.cameraPreviewEnabled
    ),
    cameraOpacity: clampNumber(source.cameraOpacity, defaultSettings.cameraOpacity, 35, 100),
    cameraSize: sanitizeCameraSize(source.cameraSize),
    mirrorPreviewEnabled: booleanOrFallback(
      source.mirrorPreviewEnabled,
      defaultSettings.mirrorPreviewEnabled
    ),
    safeDistanceCm: clampNumber(source.safeDistanceCm, defaultSettings.safeDistanceCm, 35, 100),
    sensitivity: sanitizeSensitivity(source.sensitivity),
    notificationCooldownMinutes: clampNumber(
      source.notificationCooldownMinutes,
      defaultSettings.notificationCooldownMinutes,
      1,
      120
    ),
    notificationSoundEnabled: booleanOrFallback(
      source.notificationSoundEnabled,
      defaultSettings.notificationSoundEnabled
    ),
    autoStartMonitoring: booleanOrFallback(
      source.autoStartMonitoring,
      defaultSettings.autoStartMonitoring
    ),
    darkModeEnabled: booleanOrFallback(source.darkModeEnabled, defaultSettings.darkModeEnabled),
    selectedCameraDeviceId:
      typeof source.selectedCameraDeviceId === "string" ? source.selectedCameraDeviceId : ""
  };
}
