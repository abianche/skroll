import { useCallback } from "react";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router";

import { useStoryStore } from "../store";

export function PlayerPage() {
  const navigate = useNavigate();
  const story = useStoryStore((state) => state.story);
  const engineView = useStoryStore((state) => state.engineView);
  const setEngine = useStoryStore((state) => state.setEngine);

  const handleChoose = useCallback(
    async (choiceId: string) => {
      try {
        const result = await window.skroll.engine.choose(choiceId);
        setEngine(result);
      } catch (error) {
        console.error("Failed to apply choice", error);
      }
    },
    [setEngine]
  );

  const handleRestart = useCallback(async () => {
    try {
      const result = await window.skroll.engine.start(story);
      setEngine(result);
    } catch (error) {
      console.error("Failed to restart story", error);
    }
  }, [setEngine, story]);

  return (
    <Stack gap="lg">
      <Title order={2}>Story Player</Title>
      {engineView ? (
        <Stack gap="md">
          <Text>{engineView.text}</Text>
          <Stack gap="sm">
            {engineView.choices.length === 0 ? (
              <Text c="dimmed">No choices available. The story has ended.</Text>
            ) : (
              engineView.choices.map((choice) => (
                <Button key={choice.id} onClick={() => handleChoose(choice.id)}>
                  {choice.text}
                </Button>
              ))
            )}
          </Stack>
        </Stack>
      ) : (
        <Text c="dimmed">Start the story from the editor to begin playing.</Text>
      )}
      <Group>
        <Button variant="default" onClick={() => navigate("/editor")}>
          Back to Editor
        </Button>
        <Button onClick={handleRestart} disabled={!engineView}>
          Restart
        </Button>
      </Group>
    </Stack>
  );
}
