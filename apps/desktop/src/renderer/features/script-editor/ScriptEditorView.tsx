import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Textarea } from "../../components/ui/textarea";

import type { Diagnostic } from "@skroll/ipc-contracts";
import type { SessionChoice } from "@skroll/engine-skroll";

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

function formatLocation(diagnostic: Diagnostic): string {
  const { start } = diagnostic.range;
  return `Line ${start.line}, Col ${start.column}`;
}

function severityColor(severity: Diagnostic["severity"]): string {
  switch (severity) {
    case "error":
      return "destructive";
    case "warning":
      return "secondary";
    case "info":
    default:
      return "secondary";
  }
}

function DiagnosticsList({ diagnostics }: { diagnostics: Diagnostic[] }) {
  if (diagnostics.length === 0) return <p className="text-zinc-600">No diagnostics reported.</p>;
  return (
    <div className="space-y-2">
      {diagnostics.map((diagnostic) => (
        <div
          key={`${diagnostic.code}-${diagnostic.range.start.offset}`}
          className="rounded-md border border-zinc-200 p-3"
        >
          <div className="flex items-start justify-between">
            <Badge variant={severityColor(diagnostic.severity) as any}>{diagnostic.severity}</Badge>
            <span className="text-sm text-zinc-600">{formatLocation(diagnostic)}</span>
          </div>
          <div className="mt-1 text-sm font-medium">{diagnostic.code}</div>
          <div className="text-sm">{diagnostic.message}</div>
        </div>
      ))}
    </div>
  );
}

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
}: ScriptEditorViewProps) {
  const hasErrors = diagnostics.some((d) => d.severity === "error");

  return (
    <>
      <Dialog
        open={isSaveModalOpen}
        onOpenChange={(open) => (!open ? onCloseSaveModal() : undefined)}
      >
        <DialogContent>
          <h3 className="mb-2 text-lg font-semibold">Save Script</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmitSave();
            }}
          >
            <div className="space-y-2">
              <label htmlFor="save-path" className="text-sm font-medium">
                File Path
              </label>
              <Textarea
                id="save-path"
                className="min-h-[60px]"
                value={pendingSavePath}
                onChange={(event) => onUpdatePendingSavePath(event.currentTarget.value)}
              />
              {saveError ? <Alert variant="destructive">{saveError}</Alert> : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onCloseSaveModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

        {isCompiling ? <p className="text-sm text-muted-foreground">Compiling…</p> : null}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Live Preview</h3>
            <Button variant="ghost" onClick={onResetPreview} disabled={!preview && !previewError}>
              Restart preview
            </Button>
          </div>
          {previewError ? <Alert variant="destructive">{previewError}</Alert> : null}
          {preview ? (
            <div className="rounded-md border border-zinc-200 p-4">
              <div className="flex flex-col gap-3">
                <ScrollArea className="h-40">
                  <p>{preview.text || "(This beat has no dialogue yet.)"}</p>
                </ScrollArea>
                <div className="space-y-2">
                  {preview.ended ? (
                    <p className="text-muted-foreground">The story has ended.</p>
                  ) : (
                    <>
                      {preview.choices.length === 0 ? (
                        <p className="text-muted-foreground">No choices available.</p>
                      ) : (
                        preview.choices.map((choice) => (
                          <Button
                            key={choice.id}
                            variant="secondary"
                            onClick={() => onChoose(choice.id)}
                          >
                            {choice.label}
                          </Button>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {!previewError ? (
                <p className="text-muted-foreground">
                  Preview will appear once the script compiles without errors.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
