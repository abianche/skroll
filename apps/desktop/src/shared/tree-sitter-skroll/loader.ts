import { Parser, Language } from "web-tree-sitter";
import coreWasmUrl from "web-tree-sitter/tree-sitter.wasm";
import langWasmUrl from "./tree-sitter-skroll.wasm";
import { isElectronMainProcess } from "./env";

declare const __non_webpack_require__: ((moduleId: string) => unknown) | undefined;

let languagePromise: Promise<Language> | null = null;

export function resolveAssetUrl(asset: string): string {
  if (isElectronMainProcess()) {
    let nodeRequire: typeof require | undefined;
    if (typeof __non_webpack_require__ === "function") {
      nodeRequire = __non_webpack_require__ as unknown as typeof require;
    } else if (typeof require === "function") {
      nodeRequire = require;
    }

    if (nodeRequire) {
      try {
        const { join } = nodeRequire("node:path") as typeof import("node:path");
        return join(__dirname, asset);
      } catch {
        // Fall through to returning the raw asset so browser usage still works.
      }
    }
  }

  return asset;
}

export async function loadLanguage(): Promise<Language> {
  if (!languagePromise) {
    languagePromise = (async () => {
      await Parser.init({ locateFile: () => resolveAssetUrl(coreWasmUrl) });
      return Language.load(resolveAssetUrl(langWasmUrl));
    })();
  }
  return languagePromise;
}
