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
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    onImport(await file.text());
  }

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="text-lg font-semibold">Privacy-first data</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="focus-ring rounded-md bg-[#0f7668] px-3 py-2 text-sm font-semibold text-white"
          onClick={handleExport}
          type="button"
        >
          Export
        </button>
        <label className="focus-ring rounded-md border border-[#b7cbc5] bg-white/75 px-3 py-2 text-sm font-semibold text-[#18302a]">
          Import
          <input
            accept="application/json"
            className="hidden"
            onChange={(event) => void handleImport(event.target.files?.[0])}
            type="file"
          />
        </label>
        <button
          className="focus-ring rounded-md border border-[#efb2a7] bg-[#fff4f1] px-3 py-2 text-sm font-semibold text-[#934133]"
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
