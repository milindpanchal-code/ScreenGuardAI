import { OptionsHeader } from "./components/options-header";
import { SettingsView } from "./components/settings-view";
import { StatisticsView } from "./components/statistics-view";
import { useOptionsView } from "./use-options-view";

export function OptionsApp() {
  const { activeView, setView } = useOptionsView();

  return (
    <main className="min-h-screen bg-[#edf6f3] px-4 py-6 text-[#12211d]">
      <div className="mx-auto max-w-5xl">
        <OptionsHeader activeView={activeView} onViewChange={setView} />
        {activeView === "settings" ? <SettingsView /> : <StatisticsView />}
      </div>
    </main>
  );
}
