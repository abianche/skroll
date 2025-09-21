export type Story = {
  id: string;
  title: string;
  start: string;
  nodes: Record<
    string,
    {
      id: string;
      text: string;
      choices: { id: string; text: string; goto: string }[];
    }
  >;
};

export type EngineState = {
  at: string;
  history: string[];
};

export type EngineView = {
  text: string;
  choices: { id: string; text: string }[];
};

export const Channels = {
  StoryOpen: "story:open",
  StorySave: "story:save",
  EngineStart: "engine:start",
  EngineChoose: "engine:choose",
  AppRecent: "app:recentFiles",
} as const;

export type StoryOpenReq = { path: string };
export type StoryOpenRes = { story: Story };
export type StorySaveReq = { path: string; story: Story };
export type StorySaveRes = { ok: true };
export type EngineStartReq = { story: Story };
export type EngineStartRes = { state: EngineState; view: EngineView };
export type EngineChooseReq = { choiceId: string };
export type EngineChooseRes = { state: EngineState; view: EngineView };
export type AppRecentRes = { files: string[] };

declare global {
  interface Window {
    skroll: {
      story: {
        open(path: string): Promise<StoryOpenRes>;
        save(path: string, story: Story): Promise<StorySaveRes>;
      };
      engine: {
        start(story: Story): Promise<EngineStartRes>;
        choose(choiceId: string): Promise<EngineChooseRes>;
      };
      app: {
        recentFiles(): Promise<AppRecentRes>;
      };
    };
  }
}

export {};
