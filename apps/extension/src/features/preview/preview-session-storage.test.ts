import { afterEach, describe, expect, it, vi } from "vitest";
import { localStorageAdapter } from "../../platform/storage/local-storage";
import { getPreviewTabId } from "./preview-session-storage";

describe("getPreviewTabId", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts non-negative integer tab ids", async () => {
    vi.spyOn(localStorageAdapter, "get").mockResolvedValueOnce(42);
    await expect(getPreviewTabId()).resolves.toBe(42);
  });

  it("rejects malformed tab ids", async () => {
    vi.spyOn(localStorageAdapter, "get").mockResolvedValueOnce(-1);
    await expect(getPreviewTabId()).resolves.toBeNull();
  });
});
