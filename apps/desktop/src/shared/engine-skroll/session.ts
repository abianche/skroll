import type { Action, Choice, Node, Script } from "@skroll/parser-skroll";
import type { Session, SessionChoice } from "./types";

type BeatNode = Node & { kind: "beat" };
type SceneNode = Node & { kind: "scene" };
type StoryNode = Node & { kind: "story" };

// Guard that a script exposes a top-level `story` declaration we can traverse.
function assertStoryNode(node: Node | undefined): asserts node is StoryNode {
  if (!node || node.kind !== "story") {
    throw new Error("Runtime does not contain a story declaration.");
  }
}

function isSceneNode(node: Node): node is SceneNode {
  return node.kind === "scene";
}

function isBeatNode(node: Node): node is BeatNode {
  return node.kind === "beat";
}

// Collapse blank or whitespace-only identifiers so downstream logic can rely on them.
function sanitizeIdentifier(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// Read the manifest-level config to determine which scene the story should open on.
function parseStartingSceneLine(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith("starting_scene")) return undefined;
  const match = new RegExp(/starting_scene\s*=\s*(.+)$/).exec(trimmed);
  if (!match) return undefined;
  const raw = match[1]?.trim();
  if (!raw) return undefined;
  const quoted = new RegExp(/^"(.+)"$/).exec(raw) ?? new RegExp(/^'(.+)'$/).exec(raw);
  const value = quoted ? quoted[1] : raw;
  return sanitizeIdentifier(value);
}

function extractStartingScene(story: StoryNode): string | undefined {
  for (const child of story.children) {
    if (child.kind !== "config") continue;
    for (const line of child.body.split(/\r?\n/)) {
      const id = parseStartingSceneLine(line);
      if (id) return id;
    }
  }
  return undefined;
}

// Scenes can define many nodes; grab the first beat to begin narration.
function findFirstBeat(scene: SceneNode): BeatNode | undefined {
  for (const child of scene.children) {
    if (isBeatNode(child)) {
      return child;
    }
  }
  return undefined;
}

// Index every beat in the script so choices can resolve targets in O(1).
function collectBeats(nodes: Node[], beats: Map<string, BeatNode>): void {
  for (const node of nodes) {
    if (isBeatNode(node)) {
      beats.set(node.id, node);
    }
    if (node.children.length > 0) {
      collectBeats(node.children, beats);
    }
  }
}

// Detect if a beat body issues an `end` directive, signalling a terminal state.
function hasEndAction(actions: Action[]): boolean {
  return actions.some((action) => action.type === "end");
}

function renderActionText(action: Action): string {
  switch (action.type) {
    case "say":
      return action.text;
    case "stage":
      return action.text;
    case "set":
      return `set ${action.state} = ${action.value}`;
    case "emit":
      return action.payload
        ? `emit ${action.event} with ${action.payload}`
        : `emit ${action.event}`;
    case "goto":
      return `goto ${action.target}`;
    case "end":
      return "end";
    case "return":
      return "return";
    case "assignment":
      return `${action.name} = ${action.value}`;
    default:
      return "";
  }
}

function formatActionText(actions: Action[]): string {
  return actions
    .map(renderActionText)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

// Use explicit targets when provided, otherwise fall back to deterministic names.
function createChoiceId(beatId: string, choice: Choice, index: number): string {
  const targetId = sanitizeIdentifier(choice.target);
  if (targetId) {
    return targetId;
  }
  return `${beatId}::choice-${index}`;
}

// Precompute identifiers to choices for quick lookup during interaction.
function buildChoiceMap(beat: BeatNode): Map<string, Choice> {
  const map = new Map<string, Choice>();
  // use for..of
  for (const [index, choice] of beat.choices.entries()) {
    const id = createChoiceId(beat.id, choice, index);
    map.set(id, choice);
  }
  return map;
}

// Build an interactive session that can advance through beats using player choices.
export function createSession(runtime: Script): Session {
  if (runtime.type !== "Script") {
    throw new Error("Invalid runtime: expected Script manifest.");
  }

  const storyNode = runtime.nodes.find((node) => node.kind === "story");
  assertStoryNode(storyNode);

  const scenes = storyNode.children.filter(isSceneNode);
  if (scenes.length === 0) {
    throw new Error("Story does not declare any scenes.");
  }

  const beats = new Map<string, BeatNode>();
  // Collect beats from every scene so cross-scene choices can resolve freely.
  collectBeats(runtime.nodes, beats);

  const startingSceneId = extractStartingScene(storyNode);
  const startingScene = startingSceneId
    ? scenes.find((scene) => scene.id === startingSceneId)
    : scenes[0];

  if (!startingScene) {
    if (startingSceneId) {
      throw new Error(`Starting scene "${startingSceneId}" does not exist.`);
    }
    throw new Error("Story does not contain a valid starting scene.");
  }

  const initialBeat = findFirstBeat(startingScene);
  if (!initialBeat) {
    throw new Error(`Scene "${startingScene.id}" does not contain any beats.`);
  }

  let currentBeat: BeatNode = initialBeat;
  // Mark the initial state as ended when the beat signals so or lacks choices.
  let ended = hasEndAction(currentBeat.actions) || currentBeat.choices.length === 0;

  return {
    getText(): string {
      return formatActionText(currentBeat.actions);
    },
    getChoices(): SessionChoice[] {
      if (ended) {
        return [];
      }
      return currentBeat.choices.map((choice, index) => ({
        id: createChoiceId(currentBeat.id, choice, index),
        label: choice.label,
      }));
    },
    choose(choiceId: string): void {
      if (ended) {
        throw new Error("Cannot choose after the story has ended.");
      }

      const choiceMap = buildChoiceMap(currentBeat);
      const choice = choiceMap.get(choiceId);
      if (!choice) {
        const available = Array.from(choiceMap.keys());
        if (available.length === 0) {
          throw new Error(`Beat "${currentBeat.id}" does not have any choices.`);
        }
        throw new Error(
          `Choice "${choiceId}" is not available. Expected one of: ${available.join(", ")}.`
        );
      }

      const targetId = sanitizeIdentifier(choice.target);
      if (!targetId) {
        if (choice.actions.length === 0 && choice.choices.length === 0) {
          throw new Error(
            `Choice "${choice.label}" from beat "${currentBeat.id}" does not specify a target beat.`
          );
        }

        const inlineBeat: BeatNode = {
          id: `${currentBeat.id}::inline-${choiceId}`,
          kind: "beat",
          body: "",
          when: choice.when,
          actions: choice.actions,
          choices: choice.choices,
          children: [],
          range: choice.range,
        } as BeatNode;

        currentBeat = inlineBeat;
        ended = hasEndAction(currentBeat.actions) || currentBeat.choices.length === 0;
        return;
      }

      const nextBeat = beats.get(targetId);
      if (!nextBeat) {
        throw new Error(
          `Choice "${choice.label}" from beat "${currentBeat.id}" targets unknown beat "${targetId}".`
        );
      }

      currentBeat = nextBeat;
      ended = hasEndAction(currentBeat.actions) || currentBeat.choices.length === 0;
    },
    isEnded(): boolean {
      return ended;
    },
  };
}

export type { Script } from "@skroll/parser-skroll";
