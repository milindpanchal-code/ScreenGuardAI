type SettingsActionsProps = {
  onExport: () => string;
  onImport: (json: string) => void;
  onReset: () => void;
};

export function SettingsActions({ onExport, onImport, onReset }: SettingsActionsProps) {
  function handleExport() {
    const blob = new Blob([onExport()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "screenguard-settings.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    onImport(await file.text());
  }

  return (
    <section className="options-card settings-actions-card">
      <h2>Manage settings</h2>
      <p>Back up or restore your locally stored preferences.</p>
      <div className="settings-actions-list">
        <button className="focus-ring settings-action-button" onClick={handleExport} type="button">
          <Upload size={18} strokeWidth={2.1} />
          Export settings
        </button>
        <label className="focus-ring settings-action-button">
          <Download size={18} strokeWidth={2.1} />
          Import settings
          <input
            accept="application/json"
            className="hidden"
            onChange={(event) => void handleImport(event.target.files?.[0])}
            type="file"
          />
        </label>
        <button
          className="focus-ring settings-action-button is-danger"
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={18} strokeWidth={2.1} />
          Reset settings
        </button>
      </div>
    </section>
  );
}
import { Download, RotateCcw, Upload } from "lucide-react";
