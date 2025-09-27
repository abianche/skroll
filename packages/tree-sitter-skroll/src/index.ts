import Parser from "tree-sitter";

let cachedLanguage: Parser.Language | null = null;

function loadLanguage(): Parser.Language {
  if (!cachedLanguage) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const binding = require("../bindings/node") as { language: Parser.Language };
    cachedLanguage = binding.language;
  }
  return cachedLanguage;
}

export function getLanguage(): Parser.Language {
  return loadLanguage();
}

export function createParser(): Parser {
  const parser = new Parser();
  parser.setLanguage(loadLanguage());
  return parser;
}

export type { SyntaxNode } from "tree-sitter";
