import { localStorageAdapter } from "../../platform/storage/local-storage";

const PREVIEW_TAB_ID_KEY = "screenguard.preview.tab-id";

/** Returns the tab that owns the single active monitoring session. */
export async function getPreviewTabId(): Promise<number | null> {
  const value = await localStorageAdapter.get<unknown>(PREVIEW_TAB_ID_KEY, null);
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

/** Persists or clears the tab that owns the monitoring session. */
export async function setPreviewTabId(tabId: number | null): Promise<void> {
  if (tabId === null) {
    await localStorageAdapter.remove(PREVIEW_TAB_ID_KEY);
    return;
  }

  await localStorageAdapter.set(PREVIEW_TAB_ID_KEY, tabId);
}
