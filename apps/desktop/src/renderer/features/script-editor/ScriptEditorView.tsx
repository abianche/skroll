import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";

import type { Diagnostic } from "@skroll/ipc-contracts";
import type { SessionChoice } from "@skroll/engine-skroll";

export type PreviewState = {
  text: string;
  choices: SessionChoice[];
  ended: boolean;
};

export type ScriptEditorViewProps = {
  filePath?: string;
  text: string;
  isDirty: boolean;
  isCompiling: boolean;
  diagnostics: Diagnostic[];
  parseError?: string;
  preview?: PreviewState;
  previewError?: string;
  isSaveModalOpen: boolean;
  pendingSavePath: string;
  saveError: string | null;
  isSaving: boolean;
  onChangeText: (value: string) => void;
  onRequestSave: () => void;
  onRequestSaveAs: () => void;
  onCloseSaveModal: () => void;
  onUpdatePendingSavePath: (value: string) => void;
  onSubmitSave: () => void | Promise<void>;
  onChoose: (choiceId: string) => void;
  onResetPreview: () => void;
};

function formatLocation(diagnostic: Diagnostic): string {
  const { start } = diagnostic.range;
  return `Line ${start.line}, Col ${start.column}`;
}

function severityColor(severity: Diagnostic["severity"]): string {
  switch (severity) {
    case "error":
      return "red";
    case "warning":
      return "yellow";
    case "info":
    default:
      return "blue";
  }
}

export function ScriptEditorView({
  filePath,
  text,
  isDirty,
  isCompiling,
  diagnostics,
  parseError,
  preview,
  previewError,
  isSaveModalOpen,
  pendingSavePath,
  saveError,
  isSaving,
  onChangeText,
  onRequestSave,
  onRequestSaveAs,
  onCloseSaveModal,
  onUpdatePendingSavePath,
  onSubmitSave,
  onChoose,
  onResetPreview,
}: ScriptEditorViewProps) {
  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");

  return (
    <>
      <Modal opened={isSaveModalOpen} onClose={onCloseSaveModal} title="Save Script" centered>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmitSave();
          }}
        >
          <Stack gap="sm">
            <Textarea
              label="File Path"
              description="Enter the destination for this .skr file."
              minRows={2}
              value={pendingSavePath}
              onChange={(event) => onUpdatePendingSavePath(event.currentTarget.value)}
              autosize
            />
            {saveError ? (
              <Alert color="red" variant="light">
                {saveError}
              </Alert>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={onCloseSaveModal}>
                Cancel
              </Button>
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>Script Editor</Title>
            <Group gap="xs" align="center">
              <Text c="dimmed" size="sm">
                {filePath ?? "Unsaved script"}
              </Text>
              {isDirty ? <Badge color="yellow">Unsaved changes</Badge> : null}
            </Group>
          </Stack>
          <Group gap="sm">
            <Button variant="default" onClick={onRequestSave}>
              Save
            </Button>
            <Button variant="light" onClick={onRequestSaveAs}>
              Save As…
            </Button>
          </Group>
        </Group>

        {parseError ? (
          <Alert color="red" title="Failed to compile" variant="light">
            {parseError}
          </Alert>
        ) : null}

        <Textarea
          label="Script"
          autosize
          minRows={20}
          value={text}
          spellCheck={false}
          onChange={(event) => onChangeText(event.currentTarget.value)}
        />

        {isCompiling ? (
          <Text c="dimmed" size="sm">
            Compiling…
          </Text>
        ) : null}

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={3}>Diagnostics</Title>
            {hasErrors ? (
              <Badge color="red">Fix errors to enable preview</Badge>
            ) : (
              <Badge color="green">No blocking errors</Badge>
            )}
          </Group>
          {diagnostics.length === 0 ? (
            <Text c="dimmed">No diagnostics reported.</Text>
          ) : (
            <Stack gap="xs">
              {diagnostics.map((diagnostic) => (
                <Paper key={`${diagnostic.code}-${diagnostic.range.start.offset}`} withBorder p="sm">
                  <Group justify="space-between" align="flex-start">
                    <Badge color={severityColor(diagnostic.severity)}>{diagnostic.severity}</Badge>
                    <Text size="sm" c="dimmed">
                      {formatLocation(diagnostic)}
                    </Text>
                  </Group>
                  <Text fw={500}>{diagnostic.code}</Text>
                  <Text size="sm">{diagnostic.message}</Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={3}>Live Preview</Title>
            <Button variant="subtle" onClick={onResetPreview} disabled={!preview && !previewError}>
              Restart preview
            </Button>
          </Group>
          {previewError ? (
            <Alert color="red" variant="light">
              {previewError}
            </Alert>
          ) : null}
          {preview ? (
            <Paper withBorder p="md">
              <Stack gap="md">
                <ScrollArea h={160} type="auto">
                  <Text>{preview.text || "(This beat has no dialogue yet.)"}</Text>
                </ScrollArea>
                <Stack gap="xs">
                  {preview.ended ? (
                    <Text c="dimmed">The story has ended.</Text>
                  ) : preview.choices.length === 0 ? (
                    <Text c="dimmed">No choices available.</Text>
                  ) : (
                    preview.choices.map((choice) => (
                      <Button key={choice.id} variant="light" onClick={() => onChoose(choice.id)}>
                        {choice.label}
                      </Button>
                    ))
                  )}
                </Stack>
              </Stack>
            </Paper>
          ) : !previewError ? (
            <Text c="dimmed">Preview will appear once the script compiles without errors.</Text>
          ) : null}
        </Stack>
      </Stack>
    </>
  );
}
