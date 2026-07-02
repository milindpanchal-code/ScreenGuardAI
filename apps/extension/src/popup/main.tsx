import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/global.css";
import { PopupApp } from "./popup-app";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
