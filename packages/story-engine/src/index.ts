import type { EngineState, EngineView, Story } from "@skroll/ipc-contracts";

export function validate(story: Story): { ok: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!story.start) {
    errors.push("Story is missing a start node identifier.");
  }

  if (!story.nodes[story.start]) {
    errors.push(`Start node "${story.start}" does not exist.`);
  }

  for (const [nodeId, node] of Object.entries(story.nodes)) {
    if (!node.text) {
      errors.push(`Node "${nodeId}" is missing display text.`);
    }

    for (const choice of node.choices) {
      if (!story.nodes[choice.goto]) {
        errors.push(`Choice "${choice.id}" in node "${nodeId}" targets unknown node "${choice.goto}".`);
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
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

export function start(story: Story): { state: EngineState; view: EngineView } {
  const validation = validate(story);
  if (!validation.ok) {
    throw new Error(`Story validation failed: ${validation.errors?.join("; ")}`);
  }

  const startNodeId = story.start;
  const state: EngineState = {
    at: startNodeId,
    history: [startNodeId],
  };

  return { state, view: getView(story, startNodeId) };
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
