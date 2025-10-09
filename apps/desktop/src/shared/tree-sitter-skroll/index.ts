import { Node as SyntaxNode, Parser, Language } from "web-tree-sitter";
import coreWasmUrl from "web-tree-sitter/tree-sitter.wasm";
import langWasmUrl from "./tree-sitter-skroll.wasm";

let languagePromise: Promise<Language> | null = null;

declare const __non_webpack_require__: ((moduleId: string) => unknown) | undefined;

type ElectronProcess = NodeJS.Process & {
  type?: "browser" | "renderer" | "worker";
};

function isElectronMainProcess(): boolean {
  if (typeof process === "undefined") {
    return false;
  }

  const electronProcess = process as ElectronProcess;
  return Boolean(electronProcess.versions?.electron) && electronProcess.type === "browser";
}

function resolveAssetUrl(asset: string): string {
  if (isElectronMainProcess()) {
    const nodeRequire =
      typeof __non_webpack_require__ === "function"
        ? __non_webpack_require__
        : typeof require === "function"
          ? require
          : undefined;

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

async function loadLanguage(): Promise<Language> {
  if (!languagePromise) {
    languagePromise = (async () => {
      await Parser.init({ locateFile: () => resolveAssetUrl(coreWasmUrl) });
      return Language.load(resolveAssetUrl(langWasmUrl));
    })();
  }
  return languagePromise;
}

export async function createParser(): Promise<Parser> {
  const language = await loadLanguage();
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
}
export type { SyntaxNode };

export async function getLanguage(): Promise<Language> {
  return loadLanguage();
}
