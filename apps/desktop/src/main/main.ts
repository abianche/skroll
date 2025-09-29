import fs from "node:fs/promises";
import path from "node:path";

import { app, BrowserWindow, ipcMain } from "electron";

import type {
  AppRecentRes,
  DslCompileTextReq,
  DslCompileTextRes,
  DslOpenFileReq,
  DslOpenFileRes,
  DslSaveFileReq,
  DslSaveFileRes,
} from "@skroll/ipc-contracts";
import { Channels } from "@skroll/ipc-contracts";
import { addRecent, listRecent } from "@skroll/storage";
import { createSession } from "@skroll/engine-skroll";
import { parse } from "@skroll/parser-skroll";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const DSL_SUPPORTED_EXTENSIONS = [".skroll"];

function isValidDslPath(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return DSL_SUPPORTED_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

async function createWindow(): Promise<BrowserWindow> {
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

if (require("electron-squirrel-startup")) {
  app.quit();
}

app.whenReady().then(() => {
  void createWindow();

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

ipcMain.handle(
  Channels.DslCompileText,
  async (_event, request: DslCompileTextReq): Promise<DslCompileTextRes> => {
    const result = parse(request.text);
    const hasErrors = result.diagnostics.some((diagnostic) => diagnostic.severity === "error");

    if (!hasErrors) {
      try {
        createSession(result.runtime);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to initialise DSL engine: ${message}`);
      }
    }

    return { result };
  }
);

ipcMain.handle(Channels.DslOpenFile, async (_event, request: DslOpenFileReq): Promise<DslOpenFileRes> => {
  if (!isValidDslPath(request.path)) {
    throw new Error("Only .skroll files are supported");
  }

  const text = await fs.readFile(request.path, "utf-8");
  await addRecent(request.path);
  return { path: request.path, text };
});

ipcMain.handle(Channels.DslSaveFile, async (_event, request: DslSaveFileReq): Promise<DslSaveFileRes> => {
  if (!isValidDslPath(request.path)) {
    throw new Error("Only .skroll files are supported");
  }

  await fs.mkdir(path.dirname(request.path), { recursive: true });
  await fs.writeFile(request.path, request.text, "utf-8");
  await addRecent(request.path);
  return { ok: true };
});

ipcMain.handle(Channels.AppRecent, async (): Promise<AppRecentRes> => {
  const files = await listRecent();
  return { files };
});
