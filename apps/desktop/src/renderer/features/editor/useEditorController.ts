import { useCallback, useEffect, useMemo, useState } from "react";

import type { Story } from "../../store";
import { useStoryStore } from "../../store";

type StoryNode = Story["nodes"][string];

export type UseEditorControllerResult = {
  story: Story;
  filePath?: string;
  nodes: StoryNode[];
  selectedNodeId: string;
  selectedNode?: StoryNode;
  isAddNodeModalOpen: boolean;
  newNodeId: string;
  addNodeError: string | null;
  isSaveModalOpen: boolean;
  pendingSavePath: string;
  saveModalError: string | null;
  isSaving: boolean;
  selectNode: (nodeId: string) => void;
  handleTitleChange: (value: string) => void;
  handleStartChange: (value: string | null) => void;
  handleNodeTextChange: (value: string) => void;
  updateNewNodeId: (value: string) => void;
  openAddNodeModal: () => void;
  closeAddNodeModal: () => void;
  submitAddNode: () => void;
  handleChoiceTextChange: (choiceId: string, value: string) => void;
  handleChoiceGotoChange: (choiceId: string, goto: string | null) => void;
  addChoice: () => void;
  removeChoice: (choiceId: string) => void;
  requestSave: () => void;
  closeSaveModal: () => void;
  updatePendingSavePath: (value: string) => void;
  submitSave: () => Promise<boolean>;
  startEngine: () => Promise<boolean>;
};

export function useEditorController(): UseEditorControllerResult {
  const story = useStoryStore((state) => state.story);
  const filePath = useStoryStore((state) => state.filePath);
  const updateStory = useStoryStore((state) => state.updateStory);
  const setFilePath = useStoryStore((state) => state.setFilePath);
  const setEngine = useStoryStore((state) => state.setEngine);

  const [selectedNodeId, setSelectedNodeId] = useState<string>(story.start);
  const [isAddNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [newNodeId, setNewNodeId] = useState("");
  const [addNodeError, setAddNodeError] = useState<string | null>(null);
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingSavePath, setPendingSavePath] = useState("story.skroll.json");
  const [saveModalError, setSaveModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!story.nodes[selectedNodeId]) {
      setSelectedNodeId(story.start);
    }
  }, [selectedNodeId, story.nodes, story.start]);

  const nodes = useMemo<StoryNode[]>(() => Object.values(story.nodes), [story.nodes]);
  const selectedNode = story.nodes[selectedNodeId];

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleTitleChange = useCallback(
    (value: string) => {
      updateStory((current) => ({
        ...current,
        title: value,
      }));
    },
    [updateStory]
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
    [updateStory]
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
    [selectedNode, updateStory]
  );

  const updateNewNodeId = useCallback((value: string) => {
    setNewNodeId(value);
  }, []);

  const openAddNodeModal = useCallback(() => {
    setNewNodeId("");
    setAddNodeError(null);
    setAddNodeModalOpen(true);
  }, []);

  const closeAddNodeModal = useCallback(() => {
    setAddNodeModalOpen(false);
    setAddNodeError(null);
  }, []);

  const submitAddNode = useCallback(() => {
    const trimmedId = newNodeId.trim();
    if (!trimmedId) {
      setAddNodeError("Node identifier is required.");
      return;
    }
    if (story.nodes[trimmedId]) {
      setAddNodeError("A node with that identifier already exists.");
      return;
    }

    updateStory((current) => ({
      ...current,
      nodes: {
        ...current.nodes,
        [trimmedId]: {
          id: trimmedId,
          text: "New node",
          choices: [],
        },
      },
    }));
    setSelectedNodeId(trimmedId);
    setAddNodeModalOpen(false);
    setNewNodeId("");
    setAddNodeError(null);
  }, [newNodeId, story.nodes, updateStory]);

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
              choice.id === choiceId ? { ...choice, text: value } : choice
            ),
          },
        },
      }));
    },
    [selectedNode, updateStory]
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
              choice.id === choiceId ? { ...choice, goto } : choice
            ),
          },
        },
      }));
    },
    [selectedNode, updateStory]
  );

  const addChoice = useCallback(() => {
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

  const removeChoice = useCallback(
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
              (choice) => choice.id !== choiceId
            ),
          },
        },
      }));
    },
    [selectedNode, updateStory]
  );

  const saveStoryToPath = useCallback(
    async (targetPath: string) => {
      setIsSaving(true);
      try {
        console.warn("Saving legacy JSON stories is no longer supported", targetPath);
        setSaveModalError("Saving legacy JSON stories is no longer supported.");
        setFilePath(undefined);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [setFilePath]
  );

  const requestSave = useCallback(() => {
    if (filePath) {
      void saveStoryToPath(filePath);
      return;
    }
    setPendingSavePath("story.skroll.json");
    setSaveModalError(null);
    setSaveModalOpen(true);
  }, [filePath, saveStoryToPath]);

  const closeSaveModal = useCallback(() => {
    setSaveModalOpen(false);
    setSaveModalError(null);
  }, []);

  const updatePendingSavePath = useCallback((value: string) => {
    setPendingSavePath(value);
  }, []);

  const submitSave = useCallback(async () => {
    const trimmedPath = pendingSavePath.trim();
    if (!trimmedPath) {
      setSaveModalError("File path is required.");
      return false;
    }
    return saveStoryToPath(trimmedPath);
  }, [pendingSavePath, saveStoryToPath]);

  const startEngine = useCallback(async () => {
    console.warn("The legacy story engine is no longer available.");
    setEngine();
    return false;
  }, [setEngine]);

  return {
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
    startEngine,
  };
}
