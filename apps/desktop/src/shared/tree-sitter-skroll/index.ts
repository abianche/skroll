import { Node as SyntaxNode, Parser, type Language } from "web-tree-sitter";
import { loadLanguage } from "./loader";

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
