import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { MantineProvider, createTheme } from "@mantine/core";

import "@mantine/core/styles.css";
import "./index.css";

import App from "./App";

const theme = createTheme({
  fontFamily: "Inter, Avenir, Helvetica, Arial, sans-serif",
  defaultRadius: "md",
  primaryColor: "blue",
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <HashRouter>
        <App />
      </HashRouter>
    </MantineProvider>
  </React.StrictMode>
);
