import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Group, List, Modal, Stack, Text, TextInput, Title } from "@mantine/core";
import { useNavigate } from "react-router";

import { createNewStory, useStoryStore } from "../store";

export function HomePage() {
  const navigate = useNavigate();
  const loadStory = useStoryStore((state) => state.loadStory);
  const resetEngine = useStoryStore((state) => state.resetEngine);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [isOpenModalVisible, setOpenModalVisible] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [openError, setOpenError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const fetchRecentFiles = useCallback(async () => {
    try {
      const result = await window.skroll.app.recentFiles();
      setRecentFiles(result.files);
    } catch (error) {
      console.error("Failed to load recent files", error);
    }
  }, []);

  useEffect(() => {
    void fetchRecentFiles();
  }, [fetchRecentFiles]);

  const openStory = useCallback(
    async (targetPath: string) => {
      setIsOpening(true);
      try {
        const response = await window.skroll.story.open(targetPath);
        loadStory(response.story, targetPath);
        resetEngine();
        navigate("/editor");
        void fetchRecentFiles();
        setOpenModalVisible(false);
        setOpenError(null);
        return true;
      } catch (error) {
        console.error("Failed to open story", error);
        setOpenError("Failed to open story. Please check the path and try again.");
        return false;
      } finally {
        setIsOpening(false);
      }
    },
    [fetchRecentFiles, loadStory, navigate, resetEngine, setIsOpening, setOpenError, setOpenModalVisible]
  );

  const handleOpen = useCallback(
    (path?: string) => {
      if (path) {
        void openStory(path);
        return;
      }
      setManualPath("");
      setOpenError(null);
      setOpenModalVisible(true);
    },
    [openStory, setManualPath, setOpenError, setOpenModalVisible]
  );

  const handleOpenSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedPath = manualPath.trim();
      if (!trimmedPath) {
        setOpenError("File path is required.");
        return;
      }
      const success = await openStory(trimmedPath);
      if (success) {
        setManualPath(trimmedPath);
      }
    },
    [manualPath, openStory, setManualPath, setOpenError]
  );

  const handleNew = useCallback(() => {
    loadStory(createNewStory());
    resetEngine();
    navigate("/editor");
  }, [loadStory, navigate, resetEngine]);

  return (
    <>
      <Modal
        opened={isOpenModalVisible}
        onClose={() => {
          setOpenModalVisible(false);
          setOpenError(null);
        }}
        title="Open Story"
        centered
      >
        <form onSubmit={handleOpenSubmit}>
          <Stack gap="sm">
            <TextInput
              label="File Path"
              placeholder="path/to/story.skroll.json"
              value={manualPath}
              onChange={(event) => setManualPath(event.currentTarget.value)}
              autoFocus
            />
            {openError ? (
              <Text c="red" size="sm">
                {openError}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button
                variant="default"
                type="button"
                onClick={() => {
                  setOpenModalVisible(false);
                  setOpenError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isOpening}>
                Open
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Stack gap="lg">
        <Title order={2}>Welcome to Skroll</Title>
        <Text c="dimmed">
          Start a new branching story or open an existing project to continue editing and playing.
        </Text>
        <Group>
          <Button onClick={handleNew}>New Story</Button>
          <Button variant="default" onClick={() => handleOpen()}>
            Open Story…
          </Button>
        </Group>
        <Stack gap="sm">
          <Title order={3}>Recent Files</Title>
          {recentFiles.length === 0 ? (
            <Text c="dimmed">No recent files yet. Create or open a story to see it here.</Text>
          ) : (
            <List spacing="sm">
              {recentFiles.map((file) => (
                <List.Item key={file}>
                  <Button variant="subtle" onClick={() => handleOpen(file)}>
                    {file}
                  </Button>
                </List.Item>
              ))}
            </List>
          )}
        </Stack>
      </Stack>
    </>
  );
}
