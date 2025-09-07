import { ChangeEvent, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Alert, Button, Flex, Group, Paper, Stack, Text, Textarea, Title } from '@mantine/core';

type ChoiceView = { text: string; next: string };
type NodeView = { id: string; text: string; end: boolean };
type Diagnostic = Record<string, unknown>;

const SAMPLE = `{
  "variables": { "hasKey": false, "courage": 0 },
  "start": "intro",
  "nodes": [
    { "id":"intro","text":"You wake up.","choices":[
      {"text":"Search","next":"search"},
      {"text":"Knock","next":"knock"}
    ]},
    { "id":"search","text":"You find a key.","set":{"hasKey":true},"choices":[
      {"text":"Back","next":"door"}
    ]},
    { "id":"knock","text":"Silence. Courage +1.","inc":{"courage":1},"choices":[
      {"text":"Back","next":"door"}
    ]},
    { "id":"door","text":"A locked door.","choices":[
      {"text":"Use key","if":"hasKey == true","next":"open"},
      {"text":"Force it","if":"courage >= 2","next":"force"},
      {"text":"Keep knocking","next":"knock"}
    ]},
    { "id":"open","text":"Freedom.","end":true },
    { "id":"force","text":"Broken latch. Freedom.","end":true }
  ]
}`;

function App() {
  const [editor, setEditor] = useState<string>(SAMPLE);
  const [node, setNode] = useState<NodeView | null>(null);
  const [choices, setChoices] = useState<ChoiceView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  async function refresh() {
    try {
      const n = await invoke<NodeView>('get_current_node');
      const ch = await invoke<ChoiceView[]>('get_choices');
      setNode(n);
      setChoices(ch);
      setError(null);
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  async function load() {
    try {
      // Run validation first to provide detailed diagnostics (non-blocking)
      try {
        const diags = await invoke<Diagnostic[]>('validate_story', { storyJson: editor });
        setDiagnostics(diags);
      } catch (ve) {
        // Surface validation call failures in the generic error area
        setDiagnostics([]);
        setError(ve?.toString?.() ?? String(ve));
        return;
      }

      await invoke('load_story', { content: editor });
      await refresh();
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  async function validateOnly() {
    setError(null);
    try {
      const diags = await invoke<Diagnostic[]>('validate_story', { storyJson: editor });
      setDiagnostics(diags);
    } catch (e) {
      setDiagnostics([]);
      setError(e?.toString?.() ?? String(e));
    }
  }

  async function choose(i: number) {
    try {
      await invoke('choose', { index: i });
      await refresh();
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  async function reset() {
    try {
      await invoke('reset');
      await refresh();
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  // Auto-load sample on first run for convenience
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex gap="md" align="stretch" justify="flex-start" p="10vh">
      <Stack flex={1} gap="sm">
        <Title order={2}>Editor</Title>
        <Textarea
          value={editor}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditor(e.currentTarget.value)}
          minRows={10}
          autosize
          styles={{ input: { fontFamily: 'monospace' } }}
        />
        <Group gap="sm">
          <Button onClick={load}>Load Story</Button>
          <Button variant="light" onClick={validateOnly}>
            Validate
          </Button>
        </Group>
        {diagnostics.length > 0 && (
          <Alert color="yellow" title={`Diagnostics (${diagnostics.length})`}>
            <Stack gap={4}>
              {diagnostics.map((d, i) => (
                <Text key={i} size="sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {(() => {
                    try {
                      return JSON.stringify(d, null, 2);
                    } catch {
                      return String(d);
                    }
                  })()}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}
      </Stack>

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
                    <Button key={i} onClick={() => choose(i)}>
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
          <Button onClick={reset}>Reset</Button>
        </Group>
      </Stack>
    </Flex>
  );
}

export default App;
