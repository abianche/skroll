import { useNavigate } from "react-router";

import { HomeView } from "../features/home/HomeView";
import { useHomeController } from "../features/home/useHomeController";

export function HomePage() {
  const navigate = useNavigate();
  const {
    recentFiles,
    isOpenModalVisible,
    manualPath,
    openError,
    isOpening,
    updateManualPath,
    showOpenModal,
    hideOpenModal,
    openExistingStory,
    startNewStory,
    submitManualPath,
  } = useHomeController();

  return (
    <HomeView
      recentFiles={recentFiles}
      isOpenModalVisible={isOpenModalVisible}
      manualPath={manualPath}
      openError={openError}
      isOpening={isOpening}
      onManualPathChange={updateManualPath}
      onShowOpenModal={showOpenModal}
      onHideOpenModal={hideOpenModal}
      onSubmitOpen={async () => {
        const success = await submitManualPath();
        if (success) {
          navigate("/editor");
        }
      }}
      onOpenRecent={async (path) => {
        const success = await openExistingStory(path);
        if (success) {
          navigate("/editor");
        }
      }}
      onNewStory={() => {
        startNewStory();
        navigate("/editor");
      }}
    />
  );
}
