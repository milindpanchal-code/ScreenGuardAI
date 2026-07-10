import { OptionsHeader } from "./components/options-header";
import { SettingsView } from "./components/settings-view";
import { StatisticsView } from "./components/statistics-view";
import { useOptionsView } from "./use-options-view";

export function OptionsApp() {
  const { activeView, setView } = useOptionsView();

  return (
    <main className="options-page">
      <div className="options-shell">
        <OptionsHeader activeView={activeView} onViewChange={setView} />
        <section className="options-content">
          <p className="options-eyebrow">Control Center</p>
          {activeView === "settings" ? <SettingsView /> : <StatisticsView />}
        </section>
      </div>
    </main>
  );
}
