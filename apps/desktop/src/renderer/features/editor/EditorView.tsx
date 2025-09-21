import { Button, Group, Modal, Select, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";

import type { UseEditorControllerResult } from "./useEditorController";

export type EditorViewProps = {
  controller: UseEditorControllerResult;
  onPlay: () => void | Promise<void>;
};

export function EditorView({ controller, onPlay }: EditorViewProps) {
  const {
    story,
    filePath,
    nodes,
    selectedNodeId,
    selectedNode,
    isAddNodeModalOpen,
    newNodeId,
    addNodeError,
    isSaveModalOpen,
    pendingSavePath,
    saveModalError,
    isSaving,
    selectNode,
    handleTitleChange,
    handleStartChange,
    handleNodeTextChange,
    updateNewNodeId,
    openAddNodeModal,
    closeAddNodeModal,
    submitAddNode,
    handleChoiceTextChange,
    handleChoiceGotoChange,
    addChoice,
    removeChoice,
    requestSave,
    closeSaveModal,
    updatePendingSavePath,
    submitSave,
  } = controller;

  return (
    <>
      <Modal opened={isAddNodeModalOpen} onClose={closeAddNodeModal} title="Add Node" centered>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitAddNode();
          }}
        >
          <Stack gap="sm">
            <TextInput
              label="Node Identifier"
              placeholder="unique-node-id"
              value={newNodeId}
              onChange={(event) => updateNewNodeId(event.currentTarget.value)}
              autoFocus
            />
            {addNodeError ? (
              <Text c="red" size="sm">
                {addNodeError}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={closeAddNodeModal}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={isSaveModalOpen} onClose={closeSaveModal} title="Save Story" centered>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitSave();
          }}
        >
          <Stack gap="sm">
            <TextInput
              label="File Path"
              placeholder="story.skroll.json"
              value={pendingSavePath}
              onChange={(event) => updatePendingSavePath(event.currentTarget.value)}
              autoFocus
            />
            {saveModalError ? (
              <Text c="red" size="sm">
                {saveModalError}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={closeSaveModal}>
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
        <Group justify="space-between">
          <div>
            <Title order={2}>Story Editor</Title>
            <Text c="dimmed" size="sm">
              {filePath ?? "Unsaved story"}
            </Text>
          </div>
          <Group>
            <Button variant="default" onClick={requestSave}>
              Save
            </Button>
            <Button
              onClick={() => {
                void onPlay();
              }}
            >
              Play
            </Button>
          </Group>
        </Group>

        <Stack gap="md">
          <TextInput
            label="Title"
            value={story.title}
            onChange={(event) => handleTitleChange(event.currentTarget.value)}
          />
          <Select
            label="Start Node"
            value={story.start}
            data={nodes.map((node) => ({ value: node.id, label: node.id }))}
            onChange={handleStartChange}
          />
        </Stack>

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={3}>Nodes</Title>
            <Button variant="light" onClick={openAddNodeModal}>
              Add Node
            </Button>
          </Group>
          <Group>
            {nodes.map((node) => (
              <Button
                key={node.id}
                variant={node.id === selectedNodeId ? "filled" : "light"}
                onClick={() => selectNode(node.id)}
              >
                {node.id}
              </Button>
            ))}
          </Group>
        </Stack>

        {selectedNode ? (
          <Stack gap="md">
            <Textarea
              label={`Node: ${selectedNode.id}`}
              minRows={4}
              value={selectedNode.text}
              onChange={(event) => handleNodeTextChange(event.currentTarget.value)}
            />
            <Stack gap="sm">
              <Title order={4}>Choices</Title>
              {selectedNode.choices.length === 0 ? (
                <Text c="dimmed">This node has no choices.</Text>
              ) : (
                selectedNode.choices.map((choice) => (
                  <Group key={choice.id} align="flex-end">
                    <TextInput
                      label="Choice Text"
                      value={choice.text}
                      onChange={(event) => handleChoiceTextChange(choice.id, event.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      label="Goto"
                      data={nodes.map((node) => ({ value: node.id, label: node.id }))}
                      value={choice.goto}
                      onChange={(value) => handleChoiceGotoChange(choice.id, value)}
                      style={{ width: 200 }}
                    />
                    <Button variant="light" color="red" onClick={() => removeChoice(choice.id)}>
                      Remove
                    </Button>
                  </Group>
                ))
              )}
              <Button variant="light" onClick={addChoice}>
                Add Choice
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Text>Select or create a node to edit its content.</Text>
        )}
      </Stack>
    </>
  );
}
