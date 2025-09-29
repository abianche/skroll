import { z, type ZodType } from "zod";

export const Channels = {
  DslCompileText: "dsl:compileText",
  DslOpenFile: "dsl:openFile",
  DslSaveFile: "dsl:saveFile",
  AppRecent: "app:recentFiles",
} as const;

export type AppRecentRes = { files: string[] };

export const DiagnosticSeveritySchema = z.enum(["error", "warning", "info"]);

export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;

export const SourcePositionSchema = z.object({
  offset: z.number().int().min(0),
  line: z.number().int().min(1),
  column: z.number().int().min(1),
});

export type SourcePosition = z.infer<typeof SourcePositionSchema>;

export const SourceRangeSchema = z.object({
  start: SourcePositionSchema,
  end: SourcePositionSchema,
});

export type SourceRange = z.infer<typeof SourceRangeSchema>;

export const DiagnosticSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: DiagnosticSeveritySchema,
  range: SourceRangeSchema,
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;

export const DslChoiceSchema = z.object({
  label: z.string(),
  target: z.string().optional(),
  when: z.string().optional(),
  body: z.string().optional(),
  range: SourceRangeSchema,
});

export type DslChoice = z.infer<typeof DslChoiceSchema>;

export const DslNodeKindSchema = z.enum(["story", "scene", "beat", "choice", "config", "unknown"]);

export type DslNodeKind = z.infer<typeof DslNodeKindSchema>;

export type DslNode = {
  id: string;
  kind: DslNodeKind;
  when?: string;
  body: string;
  range: SourceRange;
  children: DslNode[];
  choices: DslChoice[];
};

export const DslNodeSchema: ZodType<DslNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    kind: DslNodeKindSchema,
    when: z.string().optional(),
    body: z.string(),
    range: SourceRangeSchema,
    children: z.array(DslNodeSchema),
    choices: z.array(DslChoiceSchema),
  })
);

export const DslScriptSchema = z.object({
  type: z.literal("Script"),
  metadata: z.record(z.string(), z.string()),
  nodes: z.array(DslNodeSchema),
  range: SourceRangeSchema,
});

export type DslScript = z.infer<typeof DslScriptSchema>;

export const DslParseResultSchema = z.object({
  runtime: DslScriptSchema,
  diagnostics: z.array(DiagnosticSchema),
});

export type DslParseResult = z.infer<typeof DslParseResultSchema>;

export type DslCompileTextReq = { text: string };
export type DslCompileTextRes = { result: DslParseResult };
export type DslOpenFileReq = { path: string };
export type DslOpenFileRes = { path: string; text: string };
export type DslSaveFileReq = { path: string; text: string };
export type DslSaveFileRes = { ok: true };

declare global {
  interface Window {
    skroll: {
      dsl: {
        compileText(text: string): Promise<DslCompileTextRes>;
        openFile(path: string): Promise<DslOpenFileRes>;
        saveFile(path: string, text: string): Promise<DslSaveFileRes>;
      };
      app: {
        recentFiles(): Promise<AppRecentRes>;
      };
    };
  }
}

export {};

