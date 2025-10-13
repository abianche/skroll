import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import "./index.css";

import App from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
