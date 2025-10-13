import type { DslParseResult } from "./types";

export const DslCompileTextChannel = "dsl:compileText" as const;

export type DslCompileTextReq = { text: string };
export type DslCompileTextRes = { result: DslParseResult };
