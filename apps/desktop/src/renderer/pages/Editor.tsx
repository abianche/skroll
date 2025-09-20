import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

import { useStoryStore } from "../store";

export function EditorPage() {
  const navigate = useNavigate();
  const story = useStoryStore((state) => state.story);
  const filePath = useStoryStore((state) => state.filePath);
  const updateStory = useStoryStore((state) => state.updateStory);
  const setFilePath = useStoryStore((state) => state.setFilePath);
  const setEngine = useStoryStore((state) => state.setEngine);

  const [selectedNodeId, setSelectedNodeId] = useState<string>(story.start);

  useEffect(() => {
    if (!story.nodes[selectedNodeId]) {
      setSelectedNodeId(story.start);
    }
  }, [selectedNodeId, story.nodes, story.start]);

  const nodes = useMemo(() => Object.values(story.nodes), [story.nodes]);
  const selectedNode = story.nodes[selectedNodeId];

  const handleTitleChange = useCallback(
    (value: string) => {
      updateStory((current) => ({
        ...current,
        title: value,
      }));
    },
    [updateStory],
  );

  const handleStartChange = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }
      updateStory((current) => ({
        ...current,
        start: value,
      }));
      setSelectedNodeId(value);
    },
    [updateStory],
  );

  const handleNodeTextChange = useCallback(
    (value: string) => {
      if (!selectedNode) {
        return;
      }
      updateStory((current) => ({
        ...current,
        nodes: {
          ...current.nodes,
          [selectedNode.id]: {
            ...current.nodes[selectedNode.id],
            text: value,
          },
        },
      }));
    },
    [selectedNode, updateStory],
  );

  const handleAddNode = useCallback(() => {
    const id = window.prompt("Enter an identifier for the new node");
    if (!id) {
      return;
    }
    let created = false;
    updateStory((current) => {
      if (current.nodes[id]) {
        window.alert("A node with that identifier already exists.");
        return current;
      }
      created = true;
      return {
        ...current,
        nodes: {
          ...current.nodes,
          [id]: {
            id,
            text: "New node",
            choices: [],
          },
        },
      };
    });
    if (created) {
      setSelectedNodeId(id);
    }
  }, [setSelectedNodeId, updateStory]);

  const handleChoiceTextChange = useCallback(
    (choiceId: string, value: string) => {
      if (!selectedNode) {
        return;
      }
      updateStory((current) => ({
        ...current,
        nodes: {
          ...current.nodes,
          [selectedNode.id]: {
            ...current.nodes[selectedNode.id],
            choices: current.nodes[selectedNode.id].choices.map((choice) =>
              choice.id === choiceId ? { ...choice, text: value } : choice,
            ),
          },
        },
      }));
    },
    [selectedNode, updateStory],
  );

  const handleChoiceGotoChange = useCallback(
    (choiceId: string, goto: string | null) => {
      if (!selectedNode || !goto) {
        return;
      }
      updateStory((current) => ({
        ...current,
        nodes: {
          ...current.nodes,
          [selectedNode.id]: {
            ...current.nodes[selectedNode.id],
            choices: current.nodes[selectedNode.id].choices.map((choice) =>
              choice.id === choiceId ? { ...choice, goto } : choice,
            ),
          },
        },
      }));
    },
    [selectedNode, updateStory],
  );

  const handleAddChoice = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    const choiceId = `choice-${Date.now()}`;
    updateStory((current) => ({
      ...current,
      nodes: {
        ...current.nodes,
        [selectedNode.id]: {
          ...current.nodes[selectedNode.id],
          choices: [
            ...current.nodes[selectedNode.id].choices,
            { id: choiceId, text: "New choice", goto: selectedNode.id },
          ],
        },
      },
    }));
  }, [selectedNode, updateStory]);

  const handleRemoveChoice = useCallback(
    (choiceId: string) => {
      if (!selectedNode) {
        return;
      }
      updateStory((current) => ({
        ...current,
        nodes: {
          ...current.nodes,
          [selectedNode.id]: {
            ...current.nodes[selectedNode.id],
            choices: current.nodes[selectedNode.id].choices.filter(
              (choice) => choice.id !== choiceId,
            ),
          },
        },
      }));
    },
    [selectedNode, updateStory],
  );

  const handleSave = useCallback(async () => {
    let targetPath = filePath;
    if (!targetPath) {
      targetPath = window.prompt("Enter the path to save the story", "story.skroll.json") ?? undefined;
    }
    if (!targetPath) {
      return;
    }

    try {
      await window.skroll.story.save(targetPath, story);
      setFilePath(targetPath);
      await window.skroll.app.recentFiles();
    } catch (error) {
      console.error("Failed to save story", error);
    }
  }, [filePath, setFilePath, story]);

  const handlePlay = useCallback(async () => {
    try {
      const result = await window.skroll.engine.start(story);
      setEngine(result);
      navigate("/player");
    } catch (error) {
      console.error("Unable to start engine", error);
    }
  }, [navigate, setEngine, story]);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Story Editor</Title>
          <Text c="dimmed" size="sm">
            {filePath ?? "Unsaved story"}
          </Text>
        </div>
        <Group>
          <Button variant="default" onClick={handleSave}>
            Save
          </Button>
          <Button onClick={handlePlay}>Play</Button>
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
          <Button variant="light" onClick={handleAddNode}>
            Add Node
          </Button>
        </Group>
        <Group>
          {nodes.map((node) => (
            <Button
              key={node.id}
              variant={node.id === selectedNodeId ? "filled" : "light"}
              onClick={() => setSelectedNodeId(node.id)}
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
                    onChange={(event) =>
                      handleChoiceTextChange(choice.id, event.currentTarget.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <Select
                    label="Goto"
                    data={nodes.map((node) => ({ value: node.id, label: node.id }))}
                    value={choice.goto}
                    onChange={(value) => handleChoiceGotoChange(choice.id, value)}
                    style={{ width: 200 }}
                  />
                  <Button variant="light" color="red" onClick={() => handleRemoveChoice(choice.id)}>
                    Remove
                  </Button>
                </Group>
              ))
            )}
            <Button variant="light" onClick={handleAddChoice}>
              Add Choice
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Text>Select or create a node to edit its content.</Text>
      )}
    </Stack>
  );
}
