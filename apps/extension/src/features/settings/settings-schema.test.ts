import { describe, expect, it } from "vitest";
import { defaultSettings, sanitizeSettings } from "./settings-schema";

describe("sanitizeSettings", () => {
  it("falls back to defaults for invalid values", () => {
    expect(
      sanitizeSettings({
        cameraPreviewEnabled: "yes",
        cameraOpacity: 500,
        cameraSize: "huge",
        safeDistanceCm: 10,
        sensitivity: "maximum",
        selectedCameraDeviceId: 42
      })
    ).toMatchObject({
      cameraPreviewEnabled: defaultSettings.cameraPreviewEnabled,
      cameraOpacity: 100,
      cameraSize: defaultSettings.cameraSize,
      safeDistanceCm: 35,
      sensitivity: defaultSettings.sensitivity,
      selectedCameraDeviceId: ""
    });
  });

  it("keeps valid settings", () => {
    expect(
      sanitizeSettings({
        cameraPreviewEnabled: false,
        cameraOpacity: 64,
        cameraSize: "large",
        safeDistanceCm: 70,
        sensitivity: "high",
        notificationCooldownMinutes: 3,
        selectedCameraDeviceId: "camera-1"
      })
    ).toMatchObject({
      cameraPreviewEnabled: false,
      cameraOpacity: 64,
      cameraSize: "large",
      safeDistanceCm: 70,
      sensitivity: "high",
      notificationCooldownMinutes: 3,
      selectedCameraDeviceId: "camera-1"
    });
  });
});
