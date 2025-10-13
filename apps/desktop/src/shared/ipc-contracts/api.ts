import type { DslCompileTextRes } from "./dsl-compile-text";
import type { DslOpenFileRes } from "./dsl-open-file";
import type { DslSaveFileRes } from "./dsl-save-file";
import type { AppRecentRes } from "./app-recent";

export type SkrollDslApi = {
  compileText(text: string): Promise<DslCompileTextRes>;
  openFile(path: string): Promise<DslOpenFileRes>;
  saveFile(path: string, text: string): Promise<DslSaveFileRes>;
};

export type SkrollAppApi = {
  recentFiles(): Promise<AppRecentRes>;
};

export type SkrollApi = {
  dsl: SkrollDslApi;
  app: SkrollAppApi;
};

declare global {
  interface Window {
    skroll?: SkrollApi;
  }
}
