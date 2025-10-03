import { readFile } from "node:fs/promises";
import path from "node:path";

import { Language, Parser } from "web-tree-sitter";

let languagePromise: Promise<Language> | null = null;

async function loadLanguage(): Promise<Language> {
  if (!languagePromise) {
    languagePromise = (async () => {
      await Parser.init();
      const wasmPath = path.resolve(__dirname, "..", "tree-sitter-skroll.wasm");
      const wasm = await readFile(wasmPath);
      return Language.load(wasm);
    })();
  }
  return languagePromise;
}

export async function getLanguage(): Promise<Language> {
  return loadLanguage();
}

export async function createParser(): Promise<Parser> {
  const language = await loadLanguage();
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
}

export type { Node as SyntaxNode } from "web-tree-sitter";
