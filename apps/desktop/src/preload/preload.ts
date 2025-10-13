// apps/desktop/src/preload.ts
import { contextBridge } from "electron";
import { api } from "./api";

contextBridge.exposeInMainWorld("skroll", api);
