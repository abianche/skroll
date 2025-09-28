import { contextBridge, ipcRenderer } from "electron";

import type {
  AppRecentRes,
  DslCompileTextRes,
  DslOpenFileRes,
  DslSaveFileRes,
} from "@skroll/ipc-contracts";
import { Channels } from "@skroll/ipc-contracts";

const api = {
  dsl: {
    compileText: (text: string): Promise<DslCompileTextRes> =>
      ipcRenderer.invoke(Channels.DslCompileText, { text }),
    openFile: (path: string): Promise<DslOpenFileRes> =>
      ipcRenderer.invoke(Channels.DslOpenFile, { path }),
    saveFile: (path: string, text: string): Promise<DslSaveFileRes> =>
      ipcRenderer.invoke(Channels.DslSaveFile, { path, text }),
  },
  app: {
    recentFiles: (): Promise<AppRecentRes> => ipcRenderer.invoke(Channels.AppRecent),
  },
} as const;

contextBridge.exposeInMainWorld("skroll", api);
