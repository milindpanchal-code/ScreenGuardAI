export type OptionsView = "settings" | "statistics";

export function getOptionsViewFromHash(hash: string): OptionsView {
  return hash === "#statistics" ? "statistics" : "settings";
}
