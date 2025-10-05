// apps/desktop/src/preload.ts
import { contextBridge, ipcRenderer } from "electron";
import {
  Channels,
  type SkrollApi,
  type SkrollAppApi,
  type SkrollDslApi,
  type DslCompileTextRes,
} from "@skroll/ipc-contracts";

const dslApi: SkrollDslApi = {
  compileText: (text): Promise<DslCompileTextRes> =>
    ipcRenderer.invoke(Channels.DslCompileText, { text }),

  // keep file I/O via main
  openFile: (path) => ipcRenderer.invoke(Channels.DslOpenFile, { path }),
  saveFile: (path, text) => ipcRenderer.invoke(Channels.DslSaveFile, { path, text }),
};

const appApi: SkrollAppApi = {
  recentFiles: () => ipcRenderer.invoke(Channels.AppRecent),
};

const api: SkrollApi = { dsl: dslApi, app: appApi };

contextBridge.exposeInMainWorld("skroll", api);
