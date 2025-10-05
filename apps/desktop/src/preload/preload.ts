// apps/desktop/src/preload.ts
import { contextBridge, ipcRenderer } from "electron";
import {
  Channels,
  type DslCompileTextRes,
  type DslOpenFileRes,
  type DslSaveFileRes,
  type SkrollApi,
  type SkrollAppApi,
  type SkrollDslApi,
} from "@skroll/ipc-contracts";

const invoke = <T>(
  channel: (typeof Channels)[keyof typeof Channels],
  payload?: unknown,
) => ipcRenderer.invoke(channel, payload) as Promise<T>;

const dslApi: SkrollDslApi = {
  compileText: (text) => invoke<DslCompileTextRes>(Channels.DslCompileText, { text }),

  // keep file I/O via main
  openFile: (path) => invoke<DslOpenFileRes>(Channels.DslOpenFile, { path }),
  saveFile: (path, text) => invoke<DslSaveFileRes>(Channels.DslSaveFile, { path, text }),
};

const appApi: SkrollAppApi = {
  recentFiles: () => ipcRenderer.invoke(Channels.AppRecent),
};

const api: SkrollApi = { dsl: dslApi, app: appApi };

contextBridge.exposeInMainWorld("skroll", api);
