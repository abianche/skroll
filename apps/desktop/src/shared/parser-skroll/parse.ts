import type { Node as SyntaxNode, Parser } from "web-tree-sitter";
import { createParser } from "@skroll/tree-sitter-skroll";
import type {
  Action,
  Choice,
  Diagnostic,
  Node,
  NodeKind,
  ParseResult,
  Script,
  SourceRange,
  SayAction,
  StageAction,
  SetAction,
  EmitAction,
  GotoAction,
  AssignmentAction,
} from "./types";

let parserPromise: Promise<Parser> | undefined;

function ensureParser(): Promise<Parser> {
  if (!parserPromise) {
    parserPromise = createParser();
  }
  return parserPromise;
}

// Convert runtime node kinds into friendly labels for diagnostics.
function describeNodeKind(kind: NodeKind): string {
  switch (kind) {
    case "story":
      return "story";
    case "scene":
      return "scene";
    case "beat":
      return "beat";
    case "choice":
      return "choice";
    case "config":
      return "config";
    default:
      return "node";
  }
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}

function isSyntaxNode(node: SyntaxNode | null | undefined): node is SyntaxNode {
  return node !== null && node !== undefined;
}

function childNodes(node: SyntaxNode): SyntaxNode[] {
  return node.children.filter(isSyntaxNode);
}

function namedChildNodes(node: SyntaxNode): SyntaxNode[] {
  return node.namedChildren.filter(isSyntaxNode);
}

// Normalise Tree-sitter positional data into the SourceRange shape used throughout the runtime.
function toRange(node: SyntaxNode): SourceRange {
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

// Extract the textual body between `block_start` and `block_end` markers, trimming incidental whitespace.
function blockBody(node: SyntaxNode, source: string): string {
  const children = childNodes(node);
  const blockStart = children.find((child) => child.type === "block_start");
  const blockEnd = [...children].reverse().find((child) => child.type === "block_end");
  if (!blockStart || !blockEnd) {
    return "";
  }
  return extractText(source, blockStart.endIndex, blockEnd.startIndex).trim();
}

// Scan a node for an optional `when` condition and return its cleaned expression.
function findWhenClause(node: SyntaxNode): string | undefined {
  const clause = namedChildNodes(node).find((child) => child.type === "when_clause");
  if (!clause) {
    return undefined;
  }
  const condition = clause.childForFieldName("condition");
  return condition ? condition.text.trim() : undefined;
}

function expressionText(node: SyntaxNode, source: string): string {
  return extractText(source, node.startIndex, node.endIndex).trim();
}

function parseSayAction(node: SyntaxNode): SayAction | undefined {
  const speaker = node.childForFieldName("speaker");
  const text = node.childForFieldName("text");
  if (!speaker || !text) {
    return undefined;
  }
  return {
    type: "say",
    speaker: speaker.text.trim(),
    text: unquote(text.text),
    range: toRange(node),
  };
}

function parseStageAction(node: SyntaxNode): StageAction | undefined {
  const direction = node.childForFieldName("direction");
  if (!direction) {
    return undefined;
  }
  return {
    type: "stage",
    text: unquote(direction.text),
    range: toRange(node),
  };
}

function parseSetAction(node: SyntaxNode, source: string): SetAction | undefined {
  const state = node.childForFieldName("state");
  const value = node.childForFieldName("value");
  if (!state || !value) {
    return undefined;
  }
  return {
    type: "set",
    state: state.text.trim(),
    value: expressionText(value, source),
    range: toRange(node),
  };
}

function parseEmitAction(node: SyntaxNode, source: string): EmitAction | undefined {
  const event = node.childForFieldName("event");
  if (!event) {
    return undefined;
  }
  const payload = node.childForFieldName("payload");
  return {
    type: "emit",
    event: event.text.trim(),
    payload: payload ? expressionText(payload, source) : undefined,
    range: toRange(node),
  };
}

function parseGotoAction(node: SyntaxNode): GotoAction | undefined {
  const target = node.childForFieldName("target");
  if (!target) {
    return undefined;
  }
  return {
    type: "goto",
    target: target.text.trim(),
    range: toRange(node),
  };
}

function parseAssignmentAction(node: SyntaxNode, source: string): AssignmentAction | undefined {
  const name = node.childForFieldName("name");
  const value = node.childForFieldName("value");
  if (!name || !value) {
    return undefined;
  }
  return {
    type: "assignment",
    name: name.text.trim(),
    value: expressionText(value, source),
    range: toRange(node),
  };
}

function parseAction(node: SyntaxNode, source: string): Action | undefined {
  switch (node.type) {
    case "say_action":
      return parseSayAction(node);
    case "stage_action":
      return parseStageAction(node);
    case "set_action":
      return parseSetAction(node, source);
    case "emit_action":
      return parseEmitAction(node, source);
    case "goto_transition":
      return parseGotoAction(node);
    case "end_transition":
      return { type: "end", range: toRange(node) };
    case "return_transition":
      return { type: "return", range: toRange(node) };
    case "assignment":
      return parseAssignmentAction(node, source);
    default:
      return undefined;
  }
}

function parseBlockStatements(
  node: SyntaxNode,
  source: string
): {
  actions: Action[];
  choices: Choice[];
} {
  const actions: Action[] = [];
  const choices: Choice[] = [];
  let insideBlock = false;
  for (const child of childNodes(node)) {
    if (child.type === "block_start") {
      insideBlock = true;
      continue;
    }
    if (child.type === "block_end") {
      insideBlock = false;
      continue;
    }
    if (!insideBlock || !child.isNamed) {
      continue;
    }
    if (child.type === "choice_block") {
      choices.push(...parseChoiceBlock(child, source));
      continue;
    }
    const action = parseAction(child, source);
    if (action) {
      actions.push(action);
    }
  }
  return { actions, choices };
}

// Expand a choice block into individual option entries while composing inherited `when` clauses.
function parseChoiceBlock(node: SyntaxNode, source: string): Choice[] {
  const blockCondition = findWhenClause(node);
  const choices: Choice[] = [];
  for (const child of namedChildNodes(node)) {
    if (child.type !== "option_entry") {
      continue;
    }
    const labelNode =
      child.childForFieldName("label") ?? namedChildNodes(child).find((c) => c.type === "string");
    if (!labelNode) {
      continue;
    }
    const optionCondition = findWhenClause(child);
    const targetNode = child.childForFieldName("target");
    const { actions, choices: nestedChoices } = parseBlockStatements(child, source);
    const conditions = [blockCondition, optionCondition].filter((condition): condition is string =>
      Boolean(condition)
    );
    const combinedWhen =
      conditions.length > 1
        ? conditions.map((condition) => `(${condition})`).join(" and ")
        : conditions[0];
    choices.push({
      label: unquote(labelNode.text),
      target: targetNode?.text.trim(),
      when: combinedWhen || undefined,
      actions,
      choices: nestedChoices,
      range: toRange(child),
    });
  }
  return choices;
}

// Map parser node types to runtime node kinds that the engine understands.
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

// Recursively transform syntax tree declarations into runtime nodes with nested structure and choices.
function buildNode(node: SyntaxNode, source: string): Node {
  const idNode = node.childForFieldName("name");
  const id = idNode ? idNode.text : "";
  const when = findWhenClause(node);
  const children: Node[] = [];
  const choices: Choice[] = [];
  const { actions, choices: beatChoices } =
    node.type === "beat_declaration"
      ? parseBlockStatements(node, source)
      : { actions: [], choices: [] };
  if (beatChoices.length > 0) {
    choices.push(...beatChoices);
  }

  for (const child of namedChildNodes(node)) {
    switch (child.type) {
      case "scene_declaration":
      case "beat_declaration":
        children.push(buildNode(child, source));
        break;
      case "choice_block":
        if (node.type !== "beat_declaration") {
          choices.push(...parseChoiceBlock(child, source));
        }
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
    actions,
    range: toRange(node),
    children,
    choices,
  };
}

// Read fenced metadata entries and expose them as key-value pairs on the script.
function parseMetadata(root: SyntaxNode, source: string): Record<string, string> {
  const metadataNode = namedChildNodes(root).find((child) => child.type === "metadata_fence");
  if (!metadataNode) {
    return {};
  }
  const metadata: Record<string, string> = {};
  for (const entry of namedChildNodes(metadataNode)) {
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

// Assemble the top-level Script runtime object from the parsed syntax tree.
function buildScript(root: SyntaxNode, source: string): Script {
  const metadata = parseMetadata(root, source);
  const nodes: Node[] = [];
  for (const child of namedChildNodes(root)) {
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

// Walk the syntax tree to surface parser-level issues like errors, missing nodes, or indentation mismatches.
function collectDiagnostics(root: SyntaxNode, source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const stack: SyntaxNode[] = [root];
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
    for (const child of childNodes(current)) {
      stack.push(child);
    }
  }
  return diagnostics;
}

// Perform semantic validation that relies on the constructed runtime graph and raw syntax tree.
function collectSemanticDiagnostics(runtime: Script, root: SyntaxNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const validTargets = new Set<string>();

  function registerNodeIds(nodes: Node[]): void {
    for (const node of nodes) {
      if (node.id) {
        validTargets.add(node.id);
      }
      if (node.children.length > 0) {
        registerNodeIds(node.children);
      }
    }
  }

  registerNodeIds(runtime.nodes);

  // Utility helpers for node validations
  const SEMANTIC_KINDS: ReadonlySet<NodeKind> = new Set(["story", "scene", "beat"]);
  const hasNodeContent = (n: Node): boolean =>
    n.body.length > 0 || n.actions.length > 0 || n.children.length > 0 || n.choices.length > 0;

  function buildParentLabel(parent?: Node): string {
    if (!parent) return "";
    const parentName = describeNodeKind(parent.kind);
    const idSuffix = parent.id ? ` "${parent.id}"` : "";
    return ` within ${parentName}${idSuffix}`;
  }

  function reportDuplicate(node: Node, parent?: Node): void {
    const nodeLabel = describeNodeKind(node.kind);
    const idPart = node.id ? ` "${node.id}"` : "";
    const parentLabel = buildParentLabel(parent);
    diagnostics.push({
      code: "SKR101",
      message: `Duplicate ${nodeLabel}${idPart}${parentLabel}.`,
      severity: "error",
      range: node.range,
    });
  }

  function reportNoContent(node: Node): void {
    const label = capitalize(describeNodeKind(node.kind));
    const idPart = node.id ? ` "${node.id}"` : "";
    diagnostics.push({
      code: "SKR104",
      message: `${label}${idPart} has no content.`,
      severity: "error",
      range: node.range,
    });
  }

  // Ensure node identifiers remain unique and semantic nodes contain meaningful content.
  function validateNodeList(nodes: Node[], parent?: Node): void {
    const seen = new Map<string, Node>();
    for (const node of nodes) {
      if (node.id) {
        const duplicate = seen.get(node.id);
        if (duplicate) {
          reportDuplicate(node, parent);
        } else {
          seen.set(node.id, node);
        }
      }

      if (SEMANTIC_KINDS.has(node.kind) && !hasNodeContent(node)) {
        reportNoContent(node);
      }

      if (node.children.length > 0) {
        validateNodeList(node.children, node);
      }
    }
  }

  validateNodeList(runtime.nodes);

  // Inspect raw syntax for structural mistakes that the runtime representation alone cannot detect.
  function validateChoiceBlock(node: SyntaxNode, ancestors: SyntaxNode[]): void {
    const hasBeatAncestor = ancestors.some((a) => a.type === "beat_declaration");
    if (!hasBeatAncestor) {
      diagnostics.push({
        code: "SKR102",
        message: "Choice blocks must be nested inside a beat.",
        severity: "error",
        range: toRange(node),
      });
    }
  }

  function validateGotoTransition(node: SyntaxNode): void {
    const targetNode = node.childForFieldName("target");
    if (!targetNode) return;
    const target = targetNode.text;
    if (target && !validTargets.has(target)) {
      diagnostics.push({
        code: "SKR103",
        message: `Target "${target}" does not match any declared node.`,
        severity: "error",
        range: toRange(targetNode),
      });
    }
  }

  function validateOptionEntry(node: SyntaxNode): void {
    const targetNode = node.childForFieldName("target");
    if (targetNode) {
      const target = targetNode.text;
      if (target && !validTargets.has(target)) {
        diagnostics.push({
          code: "SKR103",
          message: `Target "${target}" does not match any declared node.`,
          severity: "error",
          range: toRange(targetNode),
        });
      }
      return;
    }
    const hasInlineBlock = childNodes(node).some((child) => child.type === "block_start");
    if (!hasInlineBlock) {
      const labelNode = node.childForFieldName("label");
      const label = labelNode ? ` "${unquote(labelNode.text)}"` : "";
      diagnostics.push({
        code: "SKR103",
        message: `Option${label} is missing a target or inline body.`,
        severity: "error",
        range: toRange(node),
      });
    }
  }

  function traverseSyntax(node: SyntaxNode, ancestors: SyntaxNode[]): void {
    // node-level validations
    if (node.type === "choice_block") validateChoiceBlock(node, ancestors);
    if (node.type === "goto_transition") validateGotoTransition(node);
    if (node.type === "option_entry") validateOptionEntry(node);

    // recurse
    ancestors.push(node);
    for (const child of namedChildNodes(node)) {
      traverseSyntax(child, ancestors);
    }
    ancestors.pop();
  }

  traverseSyntax(root, []);

  return diagnostics;
}

export async function parse(script: string): Promise<ParseResult> {
  const parser = await ensureParser();
  const tree = parser.parse(script);
  if (!tree) {
    throw new Error("Failed to parse Skroll script.");
  }
  const runtime = buildScript(tree.rootNode, script);
  return {
    runtime,
    diagnostics: [
      ...collectDiagnostics(tree.rootNode, script),
      ...collectSemanticDiagnostics(runtime, tree.rootNode),
    ],
  };
}

export { getLanguage } from "@skroll/tree-sitter-skroll";
