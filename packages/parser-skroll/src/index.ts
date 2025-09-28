import Parser from "tree-sitter";
import { createParser } from "@skroll/tree-sitter-skroll";

const parserInstance: Parser = createParser();

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface SourcePosition {
  /** Zero-based character offset from the start of the script. */
  offset: number;
  /** One-based line number. */
  line: number;
  /** One-based column number. */
  column: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface Diagnostic {
  code: string;
  message: string;
  severity: DiagnosticSeverity;
  range: SourceRange;
}

export type NodeKind = "story" | "scene" | "beat" | "choice" | "config" | "unknown";

export interface Choice {
  label: string;
  target?: string;
  when?: string;
  body?: string;
  range: SourceRange;
}

export interface Node {
  id: string;
  kind: NodeKind;
  when?: string;
  body: string;
  range: SourceRange;
  children: Node[];
  choices: Choice[];
}

export interface Script {
  type: "Script";
  metadata: Record<string, string>;
  nodes: Node[];
  range: SourceRange;
}

export interface ParseResult {
  runtime: Script;
  diagnostics: Diagnostic[];
}

function toRange(node: Parser.SyntaxNode): SourceRange {
  return {
    start: {
      offset: node.startIndex,
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
    },
    end: {
      offset: node.endIndex,
      line: node.endPosition.row + 1,
      column: node.endPosition.column + 1,
    },
  };
}

function extractText(source: string, start: number, end: number): string {
  return source.slice(start, end);
}

function unquote(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

function blockBody(node: Parser.SyntaxNode, source: string): string {
  const blockStart = node.children.find((child) => child.type === "block_start");
  const blockEnd = [...node.children].reverse().find((child) => child.type === "block_end");
  if (!blockStart || !blockEnd) {
    return "";
  }
  return extractText(source, blockStart.endIndex, blockEnd.startIndex).trim();
}

function findWhenClause(node: Parser.SyntaxNode): string | undefined {
  const clause = node.namedChildren.find((child) => child.type === "when_clause");
  if (!clause) {
    return undefined;
  }
  const condition = clause.childForFieldName("condition");
  return condition ? condition.text.trim() : undefined;
}

function parseChoiceBlock(node: Parser.SyntaxNode, source: string): Choice[] {
  const blockCondition = findWhenClause(node);
  const choices: Choice[] = [];
  for (const child of node.namedChildren) {
    if (child.type !== "option_entry") {
      continue;
    }
    const labelNode =
      child.childForFieldName("label") ?? child.namedChildren.find((c) => c.type === "string");
    if (!labelNode) {
      continue;
    }
    const optionCondition = findWhenClause(child);
    const targetNode = child.childForFieldName("target");
    const blockStart = child.children.find((c) => c.type === "block_start");
    const blockEnd = [...child.children].reverse().find((c) => c.type === "block_end");
    let body: string | undefined;
    if (blockStart && blockEnd) {
      body = extractText(source, blockStart.endIndex, blockEnd.startIndex).trim();
    }
    const conditions = [blockCondition, optionCondition].filter(Boolean);
    choices.push({
      label: unquote(labelNode.text),
      target: targetNode?.text.trim(),
      when: conditions.length ? conditions.join(" and ") : undefined,
      body: body && body.length > 0 ? body : undefined,
      range: toRange(child),
    });
  }
  return choices;
}

function toKind(type: string): NodeKind {
  switch (type) {
    case "story_declaration":
      return "story";
    case "scene_declaration":
      return "scene";
    case "beat_declaration":
      return "beat";
    case "choice_block":
      return "choice";
    case "config_block":
      return "config";
    default:
      return "unknown";
  }
}

function buildNode(node: Parser.SyntaxNode, source: string): Node {
  const idNode = node.childForFieldName("name");
  const id = idNode ? idNode.text : "";
  const when = findWhenClause(node);
  const children: Node[] = [];
  const choices: Choice[] = [];

  for (const child of node.namedChildren) {
    switch (child.type) {
      case "scene_declaration":
      case "beat_declaration":
        children.push(buildNode(child, source));
        break;
      case "choice_block":
        choices.push(...parseChoiceBlock(child, source));
        break;
      default:
        break;
    }
  }

  return {
    id,
    kind: toKind(node.type),
    when,
    body: blockBody(node, source),
    range: toRange(node),
    children,
    choices,
  };
}

function parseMetadata(root: Parser.SyntaxNode, source: string): Record<string, string> {
  const metadataNode = root.namedChildren.find((child) => child.type === "metadata_fence");
  if (!metadataNode) {
    return {};
  }
  const metadata: Record<string, string> = {};
  for (const entry of metadataNode.namedChildren) {
    if (entry.type !== "metadata_entry") {
      continue;
    }
    const keyNode = entry.childForFieldName("key");
    if (!keyNode) {
      continue;
    }
    const valueNode = entry.childForFieldName("value");
    const rawValue = valueNode
      ? extractText(source, valueNode.startIndex, valueNode.endIndex).trim()
      : "";
    metadata[keyNode.text] = valueNode?.type === "string" ? unquote(valueNode.text) : rawValue;
  }
  return metadata;
}

function buildScript(root: Parser.SyntaxNode, source: string): Script {
  const metadata = parseMetadata(root, source);
  const nodes: Node[] = [];
  for (const child of root.namedChildren) {
    if (
      child.type === "story_declaration" ||
      child.type === "scene_declaration" ||
      child.type === "beat_declaration"
    ) {
      nodes.push(buildNode(child, source));
    }
  }
  return {
    type: "Script",
    metadata,
    nodes,
    range: toRange(root),
  };
}

function collectDiagnostics(root: Parser.SyntaxNode, source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const stack: Parser.SyntaxNode[] = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.type === "ERROR") {
      const snippet = extractText(source, current.startIndex, current.endIndex).trim();
      diagnostics.push({
        code: "SKR001",
        message: snippet.length ? `Unexpected token near "${snippet}".` : "Unexpected token.",
        severity: "error",
        range: toRange(current),
      });
    }
    if (current.isMissing) {
      diagnostics.push({
        code: "SKR002",
        message: `Missing ${current.type.toLowerCase()} segment.`,
        severity: "error",
        range: toRange(current),
      });
    }
    if (current.type === "inconsistent_indentation") {
      diagnostics.push({
        code: "SKR003",
        message: "Inconsistent indentation detected.",
        severity: "error",
        range: toRange(current),
      });
    }
    for (const child of current.children) {
      stack.push(child);
    }
  }
  return diagnostics;
}

export function parse(script: string): ParseResult {
  const tree = parserInstance.parse(script);
  return {
    runtime: buildScript(tree.rootNode, script),
    diagnostics: collectDiagnostics(tree.rootNode, script),
  };
}

export { getLanguage } from "@skroll/tree-sitter-skroll";
