import { Button } from "@components/ui/button";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

export type OpenStoryDialogProps = {
  open: boolean;
  manualPath: string;
  error: string | null;
  isOpening: boolean;
  onChangePath: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

export function OpenStoryDialog({
  open,
  manualPath,
  error,
  isOpening,
  onChangePath,
  onClose,
  onSubmit,
}: Readonly<OpenStoryDialogProps>) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        onClose();
      }}
    >
      <DialogContent>
        <h3 className="mb-2 text-lg font-semibold">Open Story</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="open-path">File Path</Label>
              <Input
                id="open-path"
                placeholder="path/to/story.skr"
                value={manualPath}
                onChange={(event) => onChangePath(event.currentTarget.value)}
                autoFocus
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isOpening}>
                {isOpening ? "Opening…" : "Open"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
