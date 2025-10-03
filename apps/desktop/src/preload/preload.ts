// apps/desktop/src/preload.ts
import { contextBridge, ipcRenderer } from "electron";
import { parse } from "@skroll/parser-skroll";

import {
  Channels,
  type SkrollApi,
  type SkrollAppApi,
  type SkrollDslApi,
  type DslCompileTextRes,
} from "@skroll/ipc-contracts";

// compileText runs in preload (renderer context) to avoid loading WASM in main
const dslApi: SkrollDslApi = {
  compileText: async (text): Promise<DslCompileTextRes> => {
    const result = await parse(text);
    return { result };
  },

  // keep file I/O via main
  openFile: (path) => ipcRenderer.invoke(Channels.DslOpenFile, { path }),
  saveFile: (path, text) => ipcRenderer.invoke(Channels.DslSaveFile, { path, text }),
};

const appApi: SkrollAppApi = {
  recentFiles: () => ipcRenderer.invoke(Channels.AppRecent),
};

const api: SkrollApi = { dsl: dslApi, app: appApi };

contextBridge.exposeInMainWorld("skroll", api);
