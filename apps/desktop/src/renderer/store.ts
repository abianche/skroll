import { create } from "zustand";

import type { Diagnostic, DslParseResult, DslScript } from "../shared/ipc-contracts";

export type ScriptWorkspaceState = {
  filePath?: string;
  text: string;
  isDirty: boolean;
  isCompiling: boolean;
  diagnostics: Diagnostic[];
  runtime?: DslScript;
  parseError?: string;
  lastCompiledAt?: number;
  setFile(payload: { path?: string; text: string }): void;
  updateText(text: string): void;
  startCompile(): void;
  completeCompile(result: DslParseResult): void;
  failCompile(message: string): void;
  markSaved(path: string): void;
};

const DEFAULT_SCRIPT = "";

export const useScriptWorkspaceStore = create<ScriptWorkspaceState>((set) => ({
  filePath: undefined,
  text: DEFAULT_SCRIPT,
  isDirty: false,
  isCompiling: false,
  diagnostics: [],
  runtime: undefined,
  parseError: undefined,
  lastCompiledAt: undefined,
  setFile: ({ path, text }) =>
    set({
      filePath: path,
      text,
      isDirty: false,
      diagnostics: [],
      runtime: undefined,
      parseError: undefined,
      lastCompiledAt: undefined,
    }),
  updateText: (text) =>
    set({
      text,
      isDirty: true,
    }),
  startCompile: () =>
    set((state) => ({
      isCompiling: true,
      parseError: undefined,
      lastCompiledAt: state.lastCompiledAt,
    })),
  completeCompile: (result) =>
    set({
      isCompiling: false,
      diagnostics: result.diagnostics,
      runtime: result.runtime,
      parseError: undefined,
      lastCompiledAt: Date.now(),
    }),
  failCompile: (message) =>
    set({
      isCompiling: false,
      parseError: message,
    }),
  markSaved: (path) =>
    set({
      filePath: path,
      isDirty: false,
    }),
}));
