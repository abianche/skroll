import { Button } from "../../components/ui/button";
import { OpenStoryDialog } from "./components/OpenStoryDialog";
import { RecentFilesList } from "./components/RecentFilesList";

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
}: Readonly<HomeViewProps>) {
  return (
    <>
      <OpenStoryDialog
        open={isOpenModalVisible}
        manualPath={manualPath}
        error={openError}
        isOpening={isOpening}
        onChangePath={onManualPathChange}
        onClose={onHideOpenModal}
        onSubmit={onSubmitOpen}
      />

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
          <RecentFilesList files={recentFiles} onOpen={onOpenRecent} />
        </div>
      </div>
    </>
  );
}
