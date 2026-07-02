import type { OptionsView } from "../options-view";

type OptionsHeaderProps = {
  activeView: OptionsView;
  onViewChange: (view: OptionsView) => void;
};

export function OptionsHeader({ activeView, onViewChange }: OptionsHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#287466]">
          ScreenGuard AI
        </p>
        <h1 className="mt-1 text-3xl font-semibold">Control center</h1>
      </div>
      <div className="inline-flex rounded-lg border border-[#b7cbc5] bg-white/70 p-1">
        {(["settings", "statistics"] as const).map((view) => (
          <button
            className={`focus-ring rounded-md px-4 py-2 text-sm font-semibold capitalize ${
              activeView === view ? "bg-[#0f7668] text-white" : "text-[#29423c]"
            }`}
            key={view}
            onClick={() => onViewChange(view)}
            type="button"
          >
            {view}
          </button>
        ))}
      </div>
    </header>
  );
}
