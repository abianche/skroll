import { app, BrowserWindow } from "electron";
import { createWindow } from "./window/createWindow";
import { registerIpcHandlers } from "./ipc/registerIpcHandlers";

if (require("electron-squirrel-startup")) {
  app.quit();
}

app.whenReady().then(() => {
  void createWindow();
  registerIpcHandlers();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
