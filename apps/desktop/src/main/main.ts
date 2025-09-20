import { app, BrowserWindow, ipcMain } from "electron";

import type {
  EngineChooseReq,
  EngineChooseRes,
  AppRecentRes,
  EngineStartReq,
  EngineStartRes,
  Story,
  StoryOpenReq,
  StoryOpenRes,
  StorySaveReq,
  StorySaveRes,
} from "@skroll/ipc-contracts";
import { Channels, EngineState } from "@skroll/ipc-contracts";
import { choose as engineChoose, start as engineStart, validate } from "@skroll/story-engine";
import { addRecent, listRecent, readJsonFile, writeJsonFile } from "@skroll/storage";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const engineStates = new Map<number, EngineState>();
const engineStories = new Map<number, Story>();

const SUPPORTED_EXTENSIONS = [".json", ".skroll.json"];

function isValidStoryPath(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function getWindowId(event: Electron.IpcMainInvokeEvent): number {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win?.id ?? event.sender.id;
}

async function createWindow(): Promise<BrowserWindow> {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  mainWindow.on("closed", () => {
    engineStates.delete(mainWindow.id);
    engineStories.delete(mainWindow.id);
  });

  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.once("ready-to-show", () => mainWindow.show());

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
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

ipcMain.handle(Channels.StoryOpen, async (_event, request: StoryOpenReq): Promise<StoryOpenRes> => {
  if (!isValidStoryPath(request.path)) {
    throw new Error("Only .json and .skroll.json files are supported");
  }

  const story = await readJsonFile<Story>(request.path);
  await addRecent(request.path);
  return { story };
});

ipcMain.handle(Channels.StorySave, async (_event, request: StorySaveReq): Promise<StorySaveRes> => {
  if (!isValidStoryPath(request.path)) {
    throw new Error("Only .json and .skroll.json files are supported");
  }

  await writeJsonFile(request.path, request.story);
  await addRecent(request.path);
  return { ok: true };
});

ipcMain.handle(
  Channels.EngineStart,
  async (event, request: EngineStartReq): Promise<EngineStartRes> => {
    const validation = validate(request.story);
    if (!validation.ok) {
      throw new Error(validation.errors?.join("\n") ?? "Story validation failed");
    }

    const result = engineStart(request.story);
    const windowId = getWindowId(event);
    engineStates.set(windowId, result.state);
    engineStories.set(windowId, request.story);
    return result;
  },
);

ipcMain.handle(
  Channels.EngineChoose,
  async (event, request: EngineChooseReq): Promise<EngineChooseRes> => {
    const windowId = getWindowId(event);
    const state = engineStates.get(windowId);
    const story = engineStories.get(windowId);

    if (!state || !story) {
      throw new Error("Engine state not found for this window");
    }

    const result = engineChoose(story, state, request.choiceId);
    engineStates.set(windowId, result.state);
    return result;
  },
);

ipcMain.handle(Channels.AppRecent, async (): Promise<AppRecentRes> => {
  const files = await listRecent();
  return { files };
});
