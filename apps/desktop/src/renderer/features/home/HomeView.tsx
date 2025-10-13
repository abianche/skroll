import { Button } from "../../components/ui/button";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export type HomeViewProps = {
  recentFiles: string[];
  isOpenModalVisible: boolean;
  manualPath: string;
  openError: string | null;
  isOpening: boolean;
  onManualPathChange: (value: string) => void;
  onShowOpenModal: () => void;
  onHideOpenModal: () => void;
  onSubmitOpen: () => void | Promise<void>;
  onOpenRecent: (path: string) => void | Promise<void>;
  onNewStory: () => void;
};

export function HomeView({
  recentFiles,
  isOpenModalVisible,
  manualPath,
  openError,
  isOpening,
  onManualPathChange,
  onShowOpenModal,
  onHideOpenModal,
  onSubmitOpen,
  onOpenRecent,
  onNewStory,
}: HomeViewProps) {
  return (
    <>
      <Dialog
        open={isOpenModalVisible}
        onOpenChange={(open) => (!open ? onHideOpenModal() : undefined)}
      >
        <DialogContent>
          <h3 className="mb-2 text-lg font-semibold">Open Story</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmitOpen();
            }}
          >
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="open-path">File Path</Label>
                <Input
                  id="open-path"
                  placeholder="path/to/story.skr"
                  value={manualPath}
                  onChange={(event) => onManualPathChange(event.currentTarget.value)}
                  autoFocus
                />
              </div>
              {openError ? <p className="text-sm text-destructive">{openError}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onHideOpenModal}>
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

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Welcome to Skroll</h2>
        <p className="text-muted-foreground">
          Start a new branching story or open an existing project to continue editing and playing.
        </p>
        <div className="flex gap-2">
          <Button onClick={onNewStory}>New Story</Button>
          <Button variant="secondary" onClick={onShowOpenModal}>
            Open Story…
          </Button>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Recent Files</h3>
          {recentFiles.length === 0 ? (
            <p className="text-muted-foreground">
              No recent files yet. Create or open a story to see it here.
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {recentFiles.map((file) => (
                <li key={file}>
                  <Button
                    variant="ghost"
                    className="px-0 text-left hover:underline"
                    onClick={() => void onOpenRecent(file)}
                  >
                    {file}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
