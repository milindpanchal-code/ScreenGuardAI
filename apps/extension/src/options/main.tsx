import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/global.css";
import "../styles/options.css";
import { OptionsApp } from "./options-app";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
