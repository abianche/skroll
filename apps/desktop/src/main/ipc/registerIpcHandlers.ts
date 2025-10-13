import fs from "node:fs/promises";
import path from "node:path";
import { ipcMain } from "electron";
import { Channels } from "@skroll/ipc-contracts";
import type {
  DslCompileTextReq,
  DslCompileTextRes,
  DslOpenFileReq,
  DslOpenFileRes,
  DslSaveFileReq,
  DslSaveFileRes,
  AppRecentRes,
} from "@skroll/ipc-contracts";
import { addRecent, listRecent } from "@skroll/storage";
import { parse } from "@skroll/parser-skroll";
import { isValidDslPath, DSL_SUPPORTED_EXTENSIONS } from "../utils/fileValidation";

export function registerIpcHandlers(): void {
  ipcMain.handle(
    Channels.DslCompileText,
    async (_event, request: DslCompileTextReq): Promise<DslCompileTextRes> => {
      try {
        const result = await parse(request.text);
        return { result };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(String(error));
      }
    }
  );

  ipcMain.handle(
    Channels.DslOpenFile,
    async (_event, request: DslOpenFileReq): Promise<DslOpenFileRes> => {
      if (!isValidDslPath(request.path)) {
        throw new Error(`Only ${DSL_SUPPORTED_EXTENSIONS.join(", ")} files are supported.`);
      }

      const text = await fs.readFile(request.path, "utf-8");
      await addRecent(request.path);
      return { path: request.path, text };
    }
  );

  ipcMain.handle(
    Channels.DslSaveFile,
    async (_event, request: DslSaveFileReq): Promise<DslSaveFileRes> => {
      if (!isValidDslPath(request.path)) {
        throw new Error(`Only ${DSL_SUPPORTED_EXTENSIONS.join(", ")} files are supported.`);
      }

      await fs.mkdir(path.dirname(request.path), { recursive: true });
      await fs.writeFile(request.path, request.text, "utf-8");
      await addRecent(request.path);
      return { ok: true };
    }
  );

  ipcMain.handle(Channels.AppRecent, async (): Promise<AppRecentRes> => {
    const files = await listRecent();
    return { files };
  });
}
