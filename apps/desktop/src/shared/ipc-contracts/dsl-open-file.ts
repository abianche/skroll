export const DslOpenFileChannel = "dsl:openFile" as const;

export type DslOpenFileReq = { path: string };
export type DslOpenFileRes = { path: string; text: string };
