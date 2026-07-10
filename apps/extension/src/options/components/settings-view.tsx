import {
  Bell,
  Camera,
  LockKeyhole,
  MonitorUp,
  Moon,
  Save,
  SlidersHorizontal,
  Sparkles,
  Volume2
} from "lucide-react";
import { useSettingsDraft } from "../../features/settings/use-settings-draft";
import { SettingsActions } from "./settings-actions";

const preferenceItems = [
  {
    key: "cameraPreviewEnabled",
    label: "Camera preview",
    description: "See yourself during monitoring",
    Icon: Camera
  },
  {
    key: "mirrorPreviewEnabled",
    label: "Mirror preview",
    description: "Mirror the camera image",
    Icon: MonitorUp
  },
  {
    key: "notificationSoundEnabled",
    label: "Notification sound",
    description: "Play sound with reminders",
    Icon: Volume2
  },
  {
    key: "autoStartMonitoring",
    label: "Auto-start monitoring",
    description: "Start when the browser opens",
    Icon: Sparkles
  },
  {
    key: "darkModeEnabled",
    label: "Dark mode",
    description: "Use the dark interface theme",
    Icon: Moon
  }
] as const;

export function SettingsView() {
  const { draft, exportDraft, importDraft, message, resetDraft, saveDraft, updateDraft } =
    useSettingsDraft();

  return (
    <div className="settings-page">
      <header className="options-view-header">
        <h1>Settings</h1>
        <p>Customize your posture monitoring experience.</p>
      </header>
      <div className="settings-layout">
        <div className="settings-main-column">
          <section className="options-card">
            <div className="options-card-heading">
              <SlidersHorizontal size={20} strokeWidth={2.2} />
              <h2>Monitoring</h2>
            </div>
            <div className="settings-fields-grid">
              <label className="settings-field">
                <span>Safe distance (cm)</span>
                <input
                  max={100}
                  min={35}
                  onChange={(event) => updateDraft("safeDistanceCm", Number(event.target.value))}
                  type="number"
                  value={draft.safeDistanceCm}
                />
              </label>
              <label className="settings-field">
                <span>Sensitivity</span>
                <select
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
              <label className="settings-field settings-range-field">
                <span>Preview opacity</span>
                <div>
                  <strong>{draft.cameraOpacity}%</strong>
                  <input
                    max={100}
                    min={35}
                    onChange={(event) => updateDraft("cameraOpacity", Number(event.target.value))}
                    type="range"
                    value={draft.cameraOpacity}
                  />
                </div>
              </label>
              <label className="settings-field">
                <span>Preview size</span>
                <select
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
              <label className="settings-field">
                <span>Notification cooldown (minutes)</span>
                <input
                  max={120}
                  min={1}
                  onChange={(event) =>
                    updateDraft("notificationCooldownMinutes", Number(event.target.value))
                  }
                  type="number"
                  value={draft.notificationCooldownMinutes}
                />
                <small>Time between posture reminders.</small>
              </label>
            </div>
          </section>

          <section className="options-card">
            <div className="options-card-heading">
              <Bell size={20} strokeWidth={2.2} />
              <h2>Preferences</h2>
            </div>
            <div className="preference-grid">
              {preferenceItems.map(({ key, label, description, Icon }) => (
                <label className="preference-item" key={key}>
                  <Icon size={19} strokeWidth={2.1} />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <input
                    checked={draft[key]}
                    onChange={(event) => updateDraft(key, event.target.checked)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="settings-save-row">
            <button
              className="focus-ring settings-save-button"
              onClick={() => void saveDraft()}
              type="button"
            >
              <Save size={18} strokeWidth={2.3} />
              Save settings
            </button>
            <p>{message ?? "All changes are saved locally and never leave your device."}</p>
          </div>
        </div>

        <aside className="settings-side-column">
          <section className="options-card camera-permission-card">
            <span className="camera-permission-icon" aria-hidden="true">
              <Camera size={28} strokeWidth={2.1} />
            </span>
            <h2>Camera permission</h2>
            <p>Camera access is requested only in the extension preview context.</p>
          </section>

          <section className="options-card privacy-card">
            <LockKeyhole size={20} strokeWidth={2.2} />
            <h2>Privacy first</h2>
            <p>Your posture data stays on your device. We do not collect personal information.</p>
          </section>

          <SettingsActions
            onExport={exportDraft}
            onImport={(json) => void importDraft(json)}
            onReset={() => void resetDraft()}
          />
        </aside>
      </div>
    </div>
  );
}
