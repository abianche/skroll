import { app, BrowserWindow } from "electron";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export async function createWindow(): Promise<BrowserWindow> {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: !app.isPackaged, // Show immediately in dev, wait in prod
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  if (app.isPackaged) {
    mainWindow.once("ready-to-show", () => {
      mainWindow.show();
    });
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "right" });
  }

  return mainWindow;
}
