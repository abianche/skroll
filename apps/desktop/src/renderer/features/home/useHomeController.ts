import { useCallback, useEffect, useState } from "react";

import { createNewStory, useStoryStore } from "../../store";

export type UseHomeControllerResult = {
  recentFiles: string[];
  isOpenModalVisible: boolean;
  manualPath: string;
  openError: string | null;
  isOpening: boolean;
  updateManualPath: (value: string) => void;
  showOpenModal: () => void;
  hideOpenModal: () => void;
  refreshRecentFiles: () => Promise<void>;
  openExistingStory: (path: string) => Promise<boolean>;
  startNewStory: () => void;
  submitManualPath: () => Promise<boolean>;
};

export function useHomeController(): UseHomeControllerResult {
  const loadStory = useStoryStore((state) => state.loadStory);
  const resetEngine = useStoryStore((state) => state.resetEngine);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [isOpenModalVisible, setOpenModalVisible] = useState(false);
  const [manualPath, setManualPathState] = useState("");
  const [openError, setOpenError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const refreshRecentFiles = useCallback(async () => {
    try {
      const result = await window.skroll.app.recentFiles();
      setRecentFiles(result.files);
    } catch (error) {
      console.error("Failed to load recent files", error);
    }
  }, []);

  useEffect(() => {
    void refreshRecentFiles();
  }, [refreshRecentFiles]);

  const openExistingStory = useCallback(
    async (targetPath: string) => {
      setIsOpening(true);
      try {
        console.warn("Opening legacy JSON stories is no longer supported", targetPath);
        setOpenError("Opening legacy JSON stories is no longer supported.");
        return false;
      } finally {
        setIsOpening(false);
      }
    },
    []
  );

  const submitManualPath = useCallback(async () => {
    const trimmedPath = manualPath.trim();
    if (!trimmedPath) {
      setOpenError("File path is required.");
      return false;
    }
    const success = await openExistingStory(trimmedPath);
    if (success) {
      setManualPathState(trimmedPath);
    }
    return success;
  }, [manualPath, openExistingStory]);

  const showOpenModal = useCallback(() => {
    setManualPathState("");
    setOpenError(null);
    setOpenModalVisible(true);
  }, []);

  const hideOpenModal = useCallback(() => {
    setOpenModalVisible(false);
    setOpenError(null);
  }, []);

  const startNewStory = useCallback(() => {
    loadStory(createNewStory());
    resetEngine();
  }, [loadStory, resetEngine]);

  return {
    recentFiles,
    isOpenModalVisible,
    manualPath,
    openError,
    isOpening,
    updateManualPath: setManualPathState,
    showOpenModal,
    hideOpenModal,
    refreshRecentFiles,
    openExistingStory,
    startNewStory,
    submitManualPath,
  };
}
