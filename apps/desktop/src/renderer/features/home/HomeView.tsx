import { Button, Group, List, Modal, Stack, Text, TextInput, Title } from "@mantine/core";

export type HomeViewProps = {
  recentFiles: string[];
  isOpenModalVisible: boolean;
  manualPath: string;
  openError: string | null;
  isOpening: boolean;
  onManualPathChange: (value: string) => void;
  onShowOpenModal: () => void;
  onHideOpenModal: () => void;
  onSubmitOpen: () => void | Promise<void>;
  onOpenRecent: (path: string) => void | Promise<void>;
  onNewStory: () => void;
};

export function HomeView({
  recentFiles,
  isOpenModalVisible,
  manualPath,
  openError,
  isOpening,
  onManualPathChange,
  onShowOpenModal,
  onHideOpenModal,
  onSubmitOpen,
  onOpenRecent,
  onNewStory,
}: HomeViewProps) {
  return (
    <>
      <Modal opened={isOpenModalVisible} onClose={onHideOpenModal} title="Open Story" centered>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmitOpen();
          }}
        >
          <Stack gap="sm">
            <TextInput
              label="File Path"
              placeholder="path/to/story.skroll.json"
              value={manualPath}
              onChange={(event) => onManualPathChange(event.currentTarget.value)}
              autoFocus
            />
            {openError ? (
              <Text c="red" size="sm">
                {openError}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={onHideOpenModal}>
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
          <Button onClick={onNewStory}>New Story</Button>
          <Button variant="default" onClick={onShowOpenModal}>
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
                  <Button
                    variant="subtle"
                    onClick={() => {
                      void onOpenRecent(file);
                    }}
                  >
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
