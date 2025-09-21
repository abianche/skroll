import { StorySchema } from "@skroll/ipc-contracts";
import type { EngineState, EngineView, Story } from "@skroll/ipc-contracts";
import type { $ZodIssue } from "zod/v4/core";

export type StoryValidationResult =
  | { ok: true; story: Story }
  | { ok: false; errors: string[] };

function formatIssues(issues: $ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length ? issue.path.map(String).join(".") : "story";
    return path === "story" ? issue.message : `${path}: ${issue.message}`;
  });
}

export function validate(story: Story): StoryValidationResult {
  const parsed = StorySchema.safeParse(story);
  if (!parsed.success) {
    return { ok: false, errors: formatIssues(parsed.error.issues) };
  }
  return { ok: true, story: parsed.data };
}

function getView(story: Story, nodeId: string): EngineView {
  const node = story.nodes[nodeId];
  if (!node) {
    throw new Error(`Node "${nodeId}" does not exist.`);
  }

  return {
    text: node.text,
    choices: node.choices.map((choice) => ({ id: choice.id, text: choice.text })),
  };
}

export function start(story: Story): { state: EngineState; view: EngineView; story: Story } {
  const validation = validate(story);
  if (!validation.ok) {
    throw new Error(`Story validation failed: ${validation.errors.join("; ")}`);
  }

  const validatedStory = validation.story;
  const startNodeId = validatedStory.start;
  const state: EngineState = {
    at: startNodeId,
    history: [startNodeId],
  };

  return { state, view: getView(validatedStory, startNodeId), story: validatedStory };
}

export function choose(
  story: Story,
  state: EngineState,
  choiceId: string,
): { state: EngineState; view: EngineView } {
  const currentNode = story.nodes[state.at];
  if (!currentNode) {
    throw new Error(`Current node "${state.at}" does not exist.`);
  }

  const choice = currentNode.choices.find((item) => item.id === choiceId);
  if (!choice) {
    throw new Error(`Choice "${choiceId}" does not exist on node "${state.at}".`);
  }

  if (!story.nodes[choice.goto]) {
    throw new Error(`Choice "${choiceId}" targets unknown node "${choice.goto}".`);
  }

  const nextState: EngineState = {
    at: choice.goto,
    history: [...state.history, choice.goto],
  };

  return { state: nextState, view: getView(story, choice.goto) };
}
