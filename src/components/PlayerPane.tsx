import { Alert, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ChoiceView, NodeView } from '../types';

type Props = {
  node: NodeView | null;
  choices: ChoiceView[];
  error: string | null;
  onChoose: (index: number) => Promise<void> | void;
  onReset: () => Promise<void> | void;
};

export function PlayerPane({ node, choices, error, onChoose, onReset }: Props) {
  return (
    <Stack flex={1} gap="sm">
      <Title order={2}>Preview Player</Title>
      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}
      <Paper flex={1} withBorder p="md" radius="md">
        {node ? (
          <Stack>
            <Stack gap={0} mb="md">
              <Text size="xs" c="dimmed">
                {node.id}
              </Text>
              <Text size="sm">{node.text}</Text>
            </Stack>
            {node.end ? (
              <Text fw={600}>The End</Text>
            ) : (
              <Stack>
                {choices.map((c, i) => (
                  <Button key={i} onClick={() => onChoose(i)}>
                    {c.text}
                  </Button>
                ))}
              </Stack>
            )}
          </Stack>
        ) : (
          <Text>Load a story to begin.</Text>
        )}
      </Paper>
      <Group>
        <Button onClick={onReset}>Reset</Button>
      </Group>
    </Stack>
  );
}
