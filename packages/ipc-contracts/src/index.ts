import { z } from "zod";

export const StoryChoiceSchema = z.object({
  id: z.string().min(1, { error: "Choice id cannot be empty" }).trim(),
  text: z.string().min(1, { error: "Choice text cannot be empty" }).trim(),
  goto: z.string().min(1, { error: "Choice destination must be a node id" }).trim(),
});

export const StoryNodeSchema = z.object({
  id: z.string().min(1, { error: "Node id cannot be empty" }).trim(),
  text: z.string().min(1, { error: "Node text cannot be empty" }).trim(),
  choices: z.array(StoryChoiceSchema),
});

export const StorySchema = z
  .object({
    id: z.string().min(1, { error: "Story id cannot be empty" }).trim(),
    title: z.string().min(1, { error: "Story title cannot be empty" }).trim(),
    start: z.string().min(1, { error: "Story start node id cannot be empty" }).trim(),
    nodes: z.record(z.string(), StoryNodeSchema),
  })
  .superRefine((story, ctx) => {
    if (!Object.prototype.hasOwnProperty.call(story.nodes, story.start)) {
      ctx.addIssue({
        code: "custom",
        path: ["start"],
        message: `Start node "${story.start}" does not exist.`,
      });
    }

    for (const [nodeId, node] of Object.entries(story.nodes)) {
      if (node.id !== nodeId) {
        ctx.addIssue({
          code: "custom",
          path: ["nodes", nodeId, "id"],
          message: `Node id "${node.id}" must match its key "${nodeId}".`,
        });
      }

      node.choices.forEach((choice, index) => {
        if (!Object.prototype.hasOwnProperty.call(story.nodes, choice.goto)) {
          ctx.addIssue({
            code: "custom",
            path: ["nodes", nodeId, "choices", index, "goto"],
            message: `Choice "${choice.id}" in node "${nodeId}" targets unknown node "${choice.goto}".`,
          });
        }
      });
    }
  });

export type StoryChoice = z.infer<typeof StoryChoiceSchema>;
export type StoryNode = z.infer<typeof StoryNodeSchema>;
export type Story = z.infer<typeof StorySchema>;

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
