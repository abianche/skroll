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

export const DslActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("say"),
    speaker: z.string(),
    text: z.string(),
    range: SourceRangeSchema,
  }),
  z.object({
    type: z.literal("stage"),
    text: z.string(),
    range: SourceRangeSchema,
  }),
  z.object({
    type: z.literal("set"),
    state: z.string(),
    value: z.string(),
    range: SourceRangeSchema,
  }),
  z.object({
    type: z.literal("emit"),
    event: z.string(),
    payload: z.string().optional(),
    range: SourceRangeSchema,
  }),
  z.object({
    type: z.literal("goto"),
    target: z.string(),
    range: SourceRangeSchema,
  }),
  z.object({
    type: z.literal("end"),
    range: SourceRangeSchema,
  }),
  z.object({
    type: z.literal("return"),
    range: SourceRangeSchema,
  }),
  z.object({
    type: z.literal("assignment"),
    name: z.string(),
    value: z.string(),
    range: SourceRangeSchema,
  }),
]);

export type DslAction = z.infer<typeof DslActionSchema>;

type DslChoiceShape = {
  label: string;
  target?: string;
  when?: string;
  actions: DslAction[];
  choices: DslChoice[];
  range: SourceRange;
};

export type DslChoice = DslChoiceShape;

export const DslChoiceSchema: ZodType<DslChoice> = z.lazy(() =>
  z.object({
    label: z.string(),
    target: z.string().optional(),
    when: z.string().optional(),
    actions: z.array(DslActionSchema),
    choices: z.array(DslChoiceSchema),
    range: SourceRangeSchema,
  })
);

export const DslNodeKindSchema = z.enum(["story", "scene", "beat", "choice", "config", "unknown"]);

export type DslNodeKind = z.infer<typeof DslNodeKindSchema>;

type DslNodeShape = {
  id: string;
  kind: DslNodeKind;
  when?: string;
  body: string;
  actions: DslAction[];
  range: SourceRange;
  children: DslNode[];
  choices: DslChoice[];
};

export type DslNode = DslNodeShape;

export const DslNodeSchema: ZodType<DslNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    kind: DslNodeKindSchema,
    when: z.string().optional(),
    body: z.string(),
    actions: z.array(DslActionSchema),
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

export type SkrollDslApi = {
  compileText(text: string): Promise<DslCompileTextRes>;
  openFile(path: string): Promise<DslOpenFileRes>;
  saveFile(path: string, text: string): Promise<DslSaveFileRes>;
};

export type SkrollAppApi = {
  recentFiles(): Promise<AppRecentRes>;
};

export type SkrollApi = {
  dsl: SkrollDslApi;
  app: SkrollAppApi;
};

declare global {
  interface Window {
    skroll?: SkrollApi;
  }
}

