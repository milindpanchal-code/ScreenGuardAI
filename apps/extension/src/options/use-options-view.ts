import { useEffect, useState } from "react";
import { getOptionsViewFromHash, type OptionsView } from "./options-view";

export function useOptionsView() {
  const [activeView, setActiveView] = useState<OptionsView>(() =>
    getOptionsViewFromHash(window.location.hash)
  );

  useEffect(() => {
    const handleHashChange = () => setActiveView(getOptionsViewFromHash(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function setView(view: OptionsView) {
    window.location.hash = view;
    setActiveView(view);
  }

  return {
    activeView,
    setView
  };
}
