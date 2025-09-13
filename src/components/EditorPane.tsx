import { ChangeEvent } from 'react';
import { Alert, Button, Group, Stack, Text, Textarea, Title } from '@mantine/core';
import type { Diagnostic } from '../types';

type Props = {
  editor: string;
  onChange: (value: string) => void;
  onLoadClick: () => Promise<void> | void;
  onValidateClick: () => Promise<void> | void;
  onSave: () => Promise<void> | void;
  onSaveAs: () => Promise<void> | void;
  diagnostics: Diagnostic[];
};

export function EditorPane({ editor, onChange, onLoadClick, onValidateClick, onSave, onSaveAs, diagnostics }: Props) {
  return (
    <Stack flex={1} gap="sm">
      <Title order={2}>Editor</Title>
      <Textarea
        value={editor}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.currentTarget.value)}
        minRows={10}
        autosize
        styles={{ input: { fontFamily: 'monospace' } }}
      />
      <Group gap="sm">
        <Button onClick={onLoadClick}>Load Story</Button>
        <Button variant="light" onClick={onValidateClick}>
          Validate
        </Button>
        <Button variant="light" onClick={onSave}>
          Save
        </Button>
        <Button variant="light" onClick={onSaveAs}>
          Save As…
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
  );
}

