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

export interface SayAction {
  type: "say";
  speaker: string;
  text: string;
  range: SourceRange;
}

export interface StageAction {
  type: "stage";
  text: string;
  range: SourceRange;
}

export interface SetAction {
  type: "set";
  state: string;
  value: string;
  range: SourceRange;
}

export interface EmitAction {
  type: "emit";
  event: string;
  payload?: string;
  range: SourceRange;
}

export interface GotoAction {
  type: "goto";
  target: string;
  range: SourceRange;
}

export interface EndAction {
  type: "end";
  range: SourceRange;
}

export interface ReturnAction {
  type: "return";
  range: SourceRange;
}

export interface AssignmentAction {
  type: "assignment";
  name: string;
  value: string;
  range: SourceRange;
}

export type Action =
  | SayAction
  | StageAction
  | SetAction
  | EmitAction
  | GotoAction
  | EndAction
  | ReturnAction
  | AssignmentAction;

export interface Choice {
  label: string;
  target?: string;
  when?: string;
  actions: Action[];
  choices: Choice[];
  range: SourceRange;
}

export interface Node {
  id: string;
  kind: NodeKind;
  when?: string;
  body: string;
  actions: Action[];
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
