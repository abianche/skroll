export const DslSaveFileChannel = "dsl:saveFile" as const;

export type DslSaveFileReq = { path: string; text: string };
export type DslSaveFileRes = { ok: true };
