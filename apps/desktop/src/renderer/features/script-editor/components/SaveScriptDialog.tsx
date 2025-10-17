import { Button } from "@components/ui/button";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { Alert } from "@components/ui/alert";

export type SaveScriptDialogProps = {
  open: boolean;
  pendingPath: string;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onChangePath: (value: string) => void;
  onSubmit: () => void | Promise<void>;
};

export function SaveScriptDialog({
  open,
  pendingPath,
  error,
  isSaving,
  onClose,
  onChangePath,
  onSubmit,
}: Readonly<SaveScriptDialogProps>) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        onClose();
      }}
    >
      <DialogContent>
        <h3 className="mb-2 text-lg font-semibold">Save Script</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-2">
            <label htmlFor="save-path" className="text-sm font-medium">
              File Path
            </label>
            <Textarea
              id="save-path"
              className="min-h-[60px]"
              value={pendingPath}
              onChange={(event) => onChangePath(event.currentTarget.value)}
            />
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
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
  );
}
