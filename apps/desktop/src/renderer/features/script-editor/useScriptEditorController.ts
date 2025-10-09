import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createSession, type Session } from "@skroll/engine-skroll";

import { compileText, saveFile } from "../../lib/ipc";
import { useScriptWorkspaceStore } from "../../store";
import type { Diagnostic } from "@skroll/ipc-contracts";
import type { PreviewState } from "./ScriptEditorView";

const COMPILE_DEBOUNCE_MS = 400;

type PreviewErrorState = string | undefined;

function getPreviewState(session: Session): PreviewState {
  return {
    text: session.getText(),
    choices: session.getChoices(),
    ended: session.isEnded(),
  };
}

export type UseScriptEditorControllerResult = {
  filePath?: string;
  text: string;
  isDirty: boolean;
  isCompiling: boolean;
  diagnostics: Diagnostic[];
  parseError?: string;
  preview?: PreviewState;
  previewError?: string;
  isSaveModalOpen: boolean;
  pendingSavePath: string;
  saveError: string | null;
  isSaving: boolean;
  handleChangeText: (value: string) => void;
  requestSave: () => void;
  requestSaveAs: () => void;
  closeSaveModal: () => void;
  updatePendingSavePath: (value: string) => void;
  submitSave: () => void;
  choose: (choiceId: string) => void;
  resetPreview: () => void;
};

export function useScriptEditorController(): UseScriptEditorControllerResult {
  const filePath = useScriptWorkspaceStore((state) => state.filePath);
  const text = useScriptWorkspaceStore((state) => state.text);
  const isDirty = useScriptWorkspaceStore((state) => state.isDirty);
  const isCompiling = useScriptWorkspaceStore((state) => state.isCompiling);
  const diagnostics = useScriptWorkspaceStore((state) => state.diagnostics);
  const runtime = useScriptWorkspaceStore((state) => state.runtime);
  const parseError = useScriptWorkspaceStore((state) => state.parseError);
  const lastCompiledAt = useScriptWorkspaceStore((state) => state.lastCompiledAt);

  const updateText = useScriptWorkspaceStore((state) => state.updateText);
  const startCompile = useScriptWorkspaceStore((state) => state.startCompile);
  const completeCompile = useScriptWorkspaceStore((state) => state.completeCompile);
  const failCompile = useScriptWorkspaceStore((state) => state.failCompile);
  const markSaved = useScriptWorkspaceStore((state) => state.markSaved);

  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingSavePath, setPendingSavePath] = useState<string>("story.skr");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [preview, setPreview] = useState<PreviewState | undefined>(undefined);
  const [previewError, setPreviewError] = useState<PreviewErrorState>(undefined);
  const sessionRef = useRef<Session | undefined>(undefined);

  const hasBlockingErrors = useMemo(
    () => diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    [diagnostics]
  );

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      startCompile();
      void (async () => {
        try {
          const { result } = await compileText(text);
          if (!cancelled) {
            completeCompile(result);
          }
        } catch (error) {
          if (cancelled) {
            return;
          }
          const message = error instanceof Error ? error.message : String(error);
          failCompile(message);
        }
      })();
    }, COMPILE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [text, startCompile, completeCompile, failCompile]);

  useEffect(() => {
    if (parseError) {
      sessionRef.current = undefined;
      setPreview(undefined);
      setPreviewError(undefined);
      return;
    }

    if (!runtime) {
      sessionRef.current = undefined;
      setPreview(undefined);
      setPreviewError(undefined);
      return;
    }

    if (hasBlockingErrors) {
      sessionRef.current = undefined;
      setPreview(undefined);
      setPreviewError("Resolve script errors to preview.");
      return;
    }

    try {
      const session = createSession(runtime);
      sessionRef.current = session;
      setPreview(getPreviewState(session));
      setPreviewError(undefined);
    } catch (error) {
      sessionRef.current = undefined;
      setPreview(undefined);
      const message = error instanceof Error ? error.message : String(error);
      setPreviewError(message);
    }
  }, [runtime, hasBlockingErrors, parseError, lastCompiledAt]);

  useEffect(() => {
    if (!isSaveModalOpen) {
      setPendingSavePath(filePath ?? "story.skr");
      setSaveError(null);
    }
  }, [filePath, isSaveModalOpen]);

  const handleChangeText = useCallback(
    (value: string) => {
      updateText(value);
    },
    [updateText]
  );

  const closeSaveModal = useCallback(() => {
    setSaveModalOpen(false);
    setSaveError(null);
  }, []);

  const performSave = useCallback(
    async (targetPath: string) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        await saveFile(targetPath, text);
        markSaved(targetPath);
        setSaveModalOpen(false);
        return true;
      } catch (error) {
        console.error("Failed to save script", error);
        const message = error instanceof Error ? error.message : String(error);
        setSaveError(message);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [markSaved, text]
  );

  const requestSave = useCallback(() => {
    if (filePath) {
      void performSave(filePath);
      return;
    }
    setSaveModalOpen(true);
  }, [filePath, performSave]);

  const requestSaveAs = useCallback(() => {
    setPendingSavePath(filePath ?? "story.skr");
    setSaveModalOpen(true);
    setSaveError(null);
  }, [filePath]);

  const submitSave = useCallback(async () => {
    const trimmedPath = pendingSavePath.trim();
    if (!trimmedPath) {
      setSaveError("File path is required.");
      return;
    }
    const success = await performSave(trimmedPath);
    if (success) {
      setPendingSavePath(trimmedPath);
    }
  }, [pendingSavePath, performSave]);

  const updatePendingSavePath = useCallback((value: string) => {
    setPendingSavePath(value);
  }, []);

  const choose = useCallback(
    (choiceId: string) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      try {
        session.choose(choiceId);
        setPreview(getPreviewState(session));
        setPreviewError(undefined);
      } catch (error) {
        console.error("Failed to progress preview", error);
        const message = error instanceof Error ? error.message : String(error);
        setPreviewError(message);
      }
    },
    []
  );

  const resetPreview = useCallback(() => {
    if (!runtime || parseError || hasBlockingErrors) {
      return;
    }
    try {
      const session = createSession(runtime);
      sessionRef.current = session;
      setPreview(getPreviewState(session));
      setPreviewError(undefined);
    } catch (error) {
      sessionRef.current = undefined;
      setPreview(undefined);
      const message = error instanceof Error ? error.message : String(error);
      setPreviewError(message);
    }
  }, [runtime, parseError, hasBlockingErrors]);

  return {
    filePath,
    text,
    isDirty,
    isCompiling,
    diagnostics,
    parseError,
    preview,
    previewError,
    isSaveModalOpen,
    pendingSavePath,
    saveError,
    isSaving,
    handleChangeText,
    requestSave,
    requestSaveAs,
    closeSaveModal,
    updatePendingSavePath,
    submitSave,
    choose,
    resetPreview,
  };
}
