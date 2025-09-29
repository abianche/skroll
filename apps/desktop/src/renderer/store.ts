import { create } from "zustand";

export type StoryChoice = {
  id: string;
  text: string;
  goto: string;
};

export type StoryNode = {
  id: string;
  text: string;
  choices: StoryChoice[];
};

export type Story = {
  id: string;
  title: string;
  start: string;
  nodes: Record<string, StoryNode>;
};

export type EngineState = {
  at: string;
  history: string[];
};

export type EngineView = {
  text: string;
  choices: { id: string; text: string }[];
};

const templateStory: Story = {
  id: "new",
  title: "Untitled",
  start: "start",
  nodes: {
    start: {
      id: "start",
      text: "Hello Skroll!",
      choices: [
        { id: "next", text: "Continue", goto: "end" },
      ],
    },
    end: {
      id: "end",
      text: "The End.",
      choices: [],
    },
  },
};

export const createNewStory = (): Story =>
  JSON.parse(JSON.stringify(templateStory)) as Story;

type StoryStore = {
  story: Story;
  filePath?: string;
  engineState?: EngineState;
  engineView?: EngineView;
  loadStory: (story: Story, filePath?: string) => void;
  updateStory: (updater: (story: Story) => Story) => void;
  setFilePath: (filePath?: string) => void;
  setEngine: (payload?: { state: EngineState; view: EngineView }) => void;
  resetEngine: () => void;
};

export const useStoryStore = create<StoryStore>((set) => ({
  story: createNewStory(),
  loadStory: (story, filePath) =>
    set({
      story,
      filePath,
      engineState: undefined,
      engineView: undefined,
    }),
  updateStory: (updater) =>
    set((state) => {
      const next = updater(state.story);
      return {
        story: next,
        engineState: undefined,
        engineView: undefined,
      };
    }),
  setFilePath: (filePath) => set({ filePath }),
  setEngine: (payload) =>
    set({
      engineState: payload?.state,
      engineView: payload?.view,
    }),
  resetEngine: () => set({ engineState: undefined, engineView: undefined }),
}));
