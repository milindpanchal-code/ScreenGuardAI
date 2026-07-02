import { describe, expect, it } from "vitest";
import { getOptionsViewFromHash } from "./options-view";

describe("getOptionsViewFromHash", () => {
  it("routes statistics hash to statistics view", () => {
    expect(getOptionsViewFromHash("#statistics")).toBe("statistics");
  });

  it("falls back to settings for unknown hashes", () => {
    expect(getOptionsViewFromHash("#anything")).toBe("settings");
    expect(getOptionsViewFromHash("")).toBe("settings");
  });
});
