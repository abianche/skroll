import * as React from "react";
import { createRoot } from "react-dom/client";

import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import App from "./App";

const theme = createTheme({
  fontFamily: "Inter, Avenir, Helvetica, Arial, sans-serif",
  defaultRadius: "md",
  primaryColor: "blue",
});

const root = createRoot(document.body);
root.render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
