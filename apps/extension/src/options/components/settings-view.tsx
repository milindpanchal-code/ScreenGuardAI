import { useSettingsDraft } from "../../features/settings/use-settings-draft";
import { SettingsActions } from "./settings-actions";

export function SettingsView() {
  const { draft, exportDraft, importDraft, message, resetDraft, saveDraft, updateDraft } =
    useSettingsDraft();

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="glass-panel rounded-lg p-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            <span>Safe distance</span>
            <input
              className="w-full rounded-md border border-[#b7cbc5] px-3 py-2"
              max={100}
              min={35}
              onChange={(event) => updateDraft("safeDistanceCm", Number(event.target.value))}
              type="number"
              value={draft.safeDistanceCm}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Sensitivity</span>
            <select
              className="w-full rounded-md border border-[#b7cbc5] px-3 py-2"
              onChange={(event) =>
                updateDraft("sensitivity", event.target.value as typeof draft.sensitivity)
              }
              value={draft.sensitivity}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Preview opacity</span>
            <input
              max={100}
              min={35}
              onChange={(event) => updateDraft("cameraOpacity", Number(event.target.value))}
              type="range"
              value={draft.cameraOpacity}
            />
            <span className="block text-xs text-[#435651]">{draft.cameraOpacity}%</span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Preview size</span>
            <select
              className="w-full rounded-md border border-[#b7cbc5] px-3 py-2"
              onChange={(event) =>
                updateDraft("cameraSize", event.target.value as typeof draft.cameraSize)
              }
              value={draft.cameraSize}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="large">Large</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["cameraPreviewEnabled", "Camera preview"],
            ["mirrorPreviewEnabled", "Mirror preview"],
            ["notificationSoundEnabled", "Notification sound"],
            ["autoStartMonitoring", "Auto-start monitoring"],
            ["darkModeEnabled", "Dark mode"]
          ].map(([key, label]) => (
            <label className="flex items-center gap-3 rounded-md bg-white/65 px-3 py-2" key={key}>
              <input
                checked={Boolean(draft[key as keyof typeof draft])}
                onChange={(event) =>
                  updateDraft(key as keyof typeof draft, event.target.checked as never)
                }
                type="checkbox"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>

        <button
          className="focus-ring mt-5 rounded-md bg-[#0f7668] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void saveDraft()}
          type="button"
        >
          Save settings
        </button>
        {message ? <p className="mt-3 text-sm text-[#287466]">{message}</p> : null}
      </section>

      <div className="space-y-4">
        <section className="glass-panel rounded-lg p-4">
          <h2 className="text-lg font-semibold">Camera permission</h2>
          <p className="mt-2 text-sm leading-6 text-[#435651]">
            Camera access is requested only by the extension preview context.
          </p>
        </section>
        <SettingsActions
          onExport={exportDraft}
          onImport={(json) => void importDraft(json)}
          onReset={() => void resetDraft()}
        />
      </div>
    </div>
  );
}
