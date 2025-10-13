// Barrel exports for ipc-contracts
export * from "./types";
export * from "./dsl-compile-text";
export * from "./dsl-open-file";
export * from "./dsl-save-file";
export * from "./app-recent";
export * from "./api";

// Preserve Channels object for compatibility
import { DslCompileTextChannel } from "./dsl-compile-text";
import { DslOpenFileChannel } from "./dsl-open-file";
import { DslSaveFileChannel } from "./dsl-save-file";
import { AppRecentChannel } from "./app-recent";

export const Channels = {
  DslCompileText: DslCompileTextChannel,
  DslOpenFile: DslOpenFileChannel,
  DslSaveFile: DslSaveFileChannel,
  AppRecent: AppRecentChannel,
} as const;
