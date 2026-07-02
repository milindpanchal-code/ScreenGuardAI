import { localStorageAdapter } from "../../platform/storage/local-storage";

const PREVIEW_ACTIVE_KEY = "screenguard.preview.active";

export async function getPreviewActiveState() {
  return localStorageAdapter.getBoolean(PREVIEW_ACTIVE_KEY, false);
}

export async function setPreviewActiveState(isActive: boolean) {
  await localStorageAdapter.set(PREVIEW_ACTIVE_KEY, isActive);
}
