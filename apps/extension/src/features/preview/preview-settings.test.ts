import { describe, expect, it } from "vitest";
import { defaultSettings } from "../settings/settings-schema";
import { getPreviewDimensions, getPreviewOpacity } from "./preview-settings";

describe("preview settings", () => {
  it("maps saved size names to stable dimensions", () => {
    expect(getPreviewDimensions("compact")).toEqual({
      width: 260,
      height: 178
    });
    expect(getPreviewDimensions("comfortable")).toEqual({
      width: 320,
      height: 220
    });
    expect(getPreviewDimensions("large")).toEqual({
      width: 400,
      height: 275
    });
  });

  it("converts stored opacity percent to css opacity", () => {
    expect(getPreviewOpacity({ ...defaultSettings, cameraOpacity: 64 })).toBe(0.64);
  });
});
