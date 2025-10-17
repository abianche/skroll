import { Alert } from "@components/ui/alert";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { ScrollArea } from "@components/ui/scroll-area";
import type { PreviewState } from "../ScriptEditorView";

export type PreviewPanelProps = {
  preview?: PreviewState;
  previewError?: string;
  hasBlockingErrors: boolean;
  isCompiling: boolean;
  onReset: () => void;
  onChoose: (choiceId: string) => void;
};

export function PreviewPanel({
  preview,
  previewError,
  hasBlockingErrors,
  isCompiling,
  onReset,
  onChoose,
}: Readonly<PreviewPanelProps>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Live Preview</h3>
        <Button variant="ghost" onClick={onReset} disabled={!preview && !previewError}>
          Restart preview
        </Button>
      </div>
      {previewError ? <Alert variant="destructive">{previewError}</Alert> : null}
      {isCompiling ? <p className="text-sm text-muted-foreground">Compiling…</p> : null}
      {hasBlockingErrors && !previewError ? (
        <Badge variant="destructive">Fix errors to enable preview</Badge>
      ) : null}
      {preview ? (
        <div className="rounded-md border text-primary p-4">
          <div className="flex flex-col gap-3">
            <ScrollArea className="h-40">
              <p>{preview.text || "(This beat has no dialogue yet.)"}</p>
            </ScrollArea>
            <div className="flex gap-2 space-y-2">
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
      ) : null}
      {!preview && !previewError ? (
        <p className="text-muted-foreground">
          Preview will appear once the script compiles without errors.
        </p>
      ) : null}
    </div>
  );
}
