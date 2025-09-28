import { Button, Group, Stack, Text, Title } from "@mantine/core";

import type { EngineView } from "../../store";

export type PlayerViewProps = {
  engineView?: EngineView;
  canRestart: boolean;
  onChoose: (choiceId: string) => void | Promise<void>;
  onRestart: () => void | Promise<void>;
  onBackToEditor: () => void;
};

export function PlayerView({ engineView, canRestart, onChoose, onRestart, onBackToEditor }: PlayerViewProps) {
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
                <Button
                  key={choice.id}
                  onClick={() => {
                    void onChoose(choice.id);
                  }}
                >
                  {choice.text}
                </Button>
              ))
            )}
          </Stack>
        </Stack>
      ) : (
        <Text c="dimmed">The legacy story player is no longer available.</Text>
      )}
      <Group>
        <Button variant="default" onClick={onBackToEditor}>
          Back to Editor
        </Button>
        <Button
          onClick={() => {
            void onRestart();
          }}
          disabled={!canRestart}
        >
          Restart
        </Button>
      </Group>
    </Stack>
  );
}
