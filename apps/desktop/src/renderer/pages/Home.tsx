import { useCallback, useEffect, useState } from "react";
import { Button, Group, List, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router";

import { createNewStory, useStoryStore } from "../store";

export function HomePage() {
  const navigate = useNavigate();
  const loadStory = useStoryStore((state) => state.loadStory);
  const resetEngine = useStoryStore((state) => state.resetEngine);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

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

  const handleOpen = useCallback(
    async (path?: string) => {
      const targetPath = path ?? window.prompt("Enter the path to a story file");
      if (!targetPath) {
        return;
      }

      try {
        const response = await window.skroll.story.open(targetPath);
        loadStory(response.story, targetPath);
        resetEngine();
        navigate("/editor");
        void fetchRecentFiles();
      } catch (error) {
        console.error("Failed to open story", error);
      }
    },
    [fetchRecentFiles, loadStory, navigate, resetEngine]
  );

  const handleNew = useCallback(() => {
    loadStory(createNewStory());
    resetEngine();
    navigate("/editor");
  }, [loadStory, navigate, resetEngine]);

  return (
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
  );
}
