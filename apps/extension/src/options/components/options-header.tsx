import { BarChart3, CircleCheck, Settings, ShieldCheck } from "lucide-react";
import type { OptionsView } from "../options-view";

type OptionsHeaderProps = {
  activeView: OptionsView;
  onViewChange: (view: OptionsView) => void;
};

export function OptionsHeader({ activeView, onViewChange }: OptionsHeaderProps) {
  return (
    <aside className="options-sidebar">
      <div className="options-brand">
        <span className="options-brand-mark" aria-hidden="true">
          <ShieldCheck size={23} strokeWidth={2.4} />
        </span>
        <span>ScreenGuard AI</span>
      </div>
      <nav aria-label="Control center sections" className="options-nav">
        {[
          { view: "settings" as const, label: "Settings", Icon: Settings },
          { view: "statistics" as const, label: "Statistics", Icon: BarChart3 }
        ].map(({ view, label, Icon }) => (
          <button
            aria-current={activeView === view ? "page" : undefined}
            className={`focus-ring options-nav-button ${activeView === view ? "is-active" : ""}`}
            key={view}
            onClick={() => onViewChange(view)}
            type="button"
          >
            <Icon size={19} strokeWidth={2.2} />
            {label}
          </button>
        ))}
      </nav>
      <div className="options-sidebar-footer">
        <span>
          <CircleCheck size={15} fill="currentColor" strokeWidth={2.5} />
          Local-first storage
        </span>
        <span>Changes are saved on this device.</span>
      </div>
    </aside>
  );
}
