import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import "./index.css";

import App from "./App";
import { ThemeProvider } from "./components/theme-provider";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
