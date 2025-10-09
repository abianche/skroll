import { useCallback, useEffect, useState } from "react";

import { recentFiles as fetchRecentFiles, openFile } from "../../lib/ipc";
import { DEFAULT_SCRIPT_SOURCE } from "../../constants/defaultScript";
import { useScriptWorkspaceStore } from "../../store";

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
  const setFile = useScriptWorkspaceStore((state) => state.setFile);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [isOpenModalVisible, setOpenModalVisible] = useState(false);
  const [manualPath, setManualPathState] = useState("");
  const [openError, setOpenError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const refreshRecentFiles = useCallback(async () => {
    try {
      const result = await fetchRecentFiles();
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
      setOpenError(null);
      try {
        const response = await openFile(targetPath);
        setFile({ path: response.path, text: response.text });
        return true;
      } catch (error) {
        console.error("Failed to open script", error);
        const message = error instanceof Error ? error.message : String(error);
        setOpenError(message);
        return false;
      } finally {
        setIsOpening(false);
      }
    },
    [setFile]
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
      setOpenModalVisible(false);
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
    setFile({ path: undefined, text: DEFAULT_SCRIPT_SOURCE });
  }, [setFile]);

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
