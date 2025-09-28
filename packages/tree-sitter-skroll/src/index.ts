import Parser from "tree-sitter";

// Cache the compiled grammar so repeated consumers don't reload the native binding.
let cachedLanguage: Parser.Language | null = null;

// Lazily require the generated Tree-sitter binding only when the language is requested.
function loadLanguage(): Parser.Language {
  if (!cachedLanguage) {
    const binding = require("../bindings/node") as { language: Parser.Language };
    cachedLanguage = binding.language;
  }
  return cachedLanguage;
}

export function getLanguage(): Parser.Language {
  // Surface the cached language directly for callers that only need the grammar object.
  return loadLanguage();
}

export function createParser(): Parser {
  const parser = new Parser();
  // Build a parser preconfigured with the Skroll grammar.
  parser.setLanguage(loadLanguage());
  return parser;
}

export type { SyntaxNode } from "tree-sitter";
