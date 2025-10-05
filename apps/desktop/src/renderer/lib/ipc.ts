import type {
  AppRecentRes,
  DslCompileTextRes,
  DslOpenFileRes,
  DslSaveFileRes,
  SkrollApi,
} from "@skroll/ipc-contracts";

function resolveSkrollApi(): SkrollApi {
  if (typeof window === "undefined" || !window.skroll) {
    throw new Error("Skroll IPC API is not available on window.skroll");
  }

  return window.skroll;
}

const skrollApi = resolveSkrollApi();

export function compileText(text: string): Promise<DslCompileTextRes> {
  return skrollApi.dsl.compileText(text);
}

export function openFile(path: string): Promise<DslOpenFileRes> {
  return skrollApi.dsl.openFile(path);
}

export function saveFile(path: string, text: string): Promise<DslSaveFileRes> {
  return skrollApi.dsl.saveFile(path, text);
}

export function recentFiles(): Promise<AppRecentRes> {
  return skrollApi.app.recentFiles();
}
