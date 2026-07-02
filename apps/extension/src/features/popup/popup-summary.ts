export type PopupSummaryRow = {
  label: string;
  value: string;
};

export function getPopupSummaryRows(
  isMonitoringActive: boolean,
  isPreviewVisible: boolean
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
      value: "Not set"
    }
  ];
}
