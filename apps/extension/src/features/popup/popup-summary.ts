export type PopupSummaryRow = {
  label: string;
  value: string;
};

export function getPopupSummaryRows(
  isMonitoringActive: boolean,
  isPreviewVisible: boolean,
  isCalibrated = false
): PopupSummaryRow[] {
  return [
    {
      label: "Monitoring",
      value: isMonitoringActive ? "Active" : "Paused"
    },
    {
      label: "Camera",
      value: isPreviewVisible ? "Preview visible" : "Ready"
    },
    {
      label: "Calibration",
      value: isCalibrated ? "Ready" : "Not set"
    }
  ];
}
