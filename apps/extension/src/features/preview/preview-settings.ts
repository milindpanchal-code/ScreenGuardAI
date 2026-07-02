import type { CameraSize, ScreenGuardSettings } from "../settings/settings-schema";

export type PreviewDimensions = {
  width: number;
  height: number;
};

const PREVIEW_DIMENSIONS_BY_SIZE: Record<CameraSize, PreviewDimensions> = {
  compact: {
    width: 260,
    height: 178
  },
  comfortable: {
    width: 320,
    height: 220
  },
  large: {
    width: 400,
    height: 275
  }
};

export function getPreviewDimensions(size: CameraSize): PreviewDimensions {
  return PREVIEW_DIMENSIONS_BY_SIZE[size];
}

export function getPreviewOpacity(settings: ScreenGuardSettings): number {
  return settings.cameraOpacity / 100;
}
