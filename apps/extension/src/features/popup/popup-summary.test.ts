import { describe, expect, it } from "vitest";
import { getPopupSummaryRows } from "./popup-summary";

describe("getPopupSummaryRows", () => {
  it("reports paused preview state", () => {
    expect(getPopupSummaryRows(false, false)).toEqual([
      {
        label: "Monitoring",
        value: "Paused"
      },
      {
        label: "Camera",
        value: "Ready"
      },
      {
        label: "Calibration",
        value: "Not set"
      }
    ]);
  });

  it("reports active preview state", () => {
    expect(getPopupSummaryRows(true, true)[0]).toEqual({
      label: "Monitoring",
      value: "Active"
    });
  });

  it("reports saved calibration state", () => {
    expect(getPopupSummaryRows(true, true, true)[2]).toEqual({
      label: "Calibration",
      value: "Ready"
    });
  });
});
