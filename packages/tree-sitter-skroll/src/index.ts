import { Node as SyntaxNode, Parser, Language } from "web-tree-sitter";
import coreWasmUrl from "web-tree-sitter/tree-sitter.wasm";
import langWasmUrl from "../tree-sitter-skroll.wasm";

let languagePromise: Promise<Language> | null = null;

async function loadLanguage(): Promise<Language> {
  if (!languagePromise) {
    languagePromise = (async () => {
      await Parser.init({ locateFile: () => coreWasmUrl });
      return Language.load(langWasmUrl);
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
