import { Alert } from "@components/ui/alert";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";

import type { Diagnostic } from "@skroll/ipc-contracts";
import type { SessionChoice } from "@skroll/engine-skroll";
import { SaveScriptDialog } from "./components/SaveScriptDialog";
import { DiagnosticsList } from "./components/DiagnosticsList";
import { PreviewPanel } from "./components/PreviewPanel";

export type PreviewState = {
  text: string;
  choices: SessionChoice[];
  ended: boolean;
};

export type ScriptEditorViewProps = {
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
  onChangeText: (value: string) => void;
  onRequestSave: () => void;
  onRequestSaveAs: () => void;
  onCloseSaveModal: () => void;
  onUpdatePendingSavePath: (value: string) => void;
  onSubmitSave: () => void | Promise<void>;
  onChoose: (choiceId: string) => void;
  onResetPreview: () => void;
};

export function ScriptEditorView({
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
  onChangeText,
  onRequestSave,
  onRequestSaveAs,
  onCloseSaveModal,
  onUpdatePendingSavePath,
  onSubmitSave,
  onChoose,
  onResetPreview,
}: Readonly<ScriptEditorViewProps>) {
  const hasErrors = diagnostics.some((d) => d.severity === "error");

  return (
    <>
      <SaveScriptDialog
        open={isSaveModalOpen}
        pendingPath={pendingSavePath}
        error={saveError}
        isSaving={isSaving}
        onClose={onCloseSaveModal}
        onChangePath={onUpdatePendingSavePath}
        onSubmit={onSubmitSave}
      />

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Script Editor</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{filePath ?? "Unsaved script"}</span>
              {isDirty ? <Badge variant="secondary">Unsaved changes</Badge> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onRequestSave}>
              Save
            </Button>
            <Button variant="outline" onClick={onRequestSaveAs}>
              Save As…
            </Button>
          </div>
        </div>

        {parseError ? <Alert variant="destructive">Failed to compile: {parseError}</Alert> : null}

        <div className="space-y-1">
          <label htmlFor="script-text" className="text-sm font-medium">
            Script
          </label>
          <Textarea
            id="script-text"
            className="min-h-[320px]"
            value={text}
            spellCheck={false}
            onChange={(event) => onChangeText(event.currentTarget.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Diagnostics</h3>
            {hasErrors ? (
              <Badge variant="destructive">Fix errors to enable preview</Badge>
            ) : (
              <Badge variant="secondary">No blocking errors</Badge>
            )}
          </div>
          <DiagnosticsList diagnostics={diagnostics} />
        </div>
        <PreviewPanel
          preview={preview}
          previewError={previewError}
          hasBlockingErrors={hasErrors}
          isCompiling={isCompiling}
          onReset={onResetPreview}
          onChoose={onChoose}
        />
      </div>
    </>
  );
}
