import type { Choice, Node, Script } from "@skroll/parser-skroll";

export type SessionChoice = {
  /** Identifier that must be passed to {@link Session.choose}. */
  id: string;
  /** Player-facing label for the choice. */
  label: string;
};

export type Session = {
  /** Returns the current beat body as a trimmed string. */
  getText(): string;
  /**
   * Lists the available choices for the current beat.
   *
   * If the beat has ended (either by reaching an `end` statement or exhausting
   * the available branches), this returns an empty array.
   */
  getChoices(): SessionChoice[];
  /**
   * Progresses the session by selecting a choice identifier returned from
   * {@link getChoices}. An error is thrown when attempting to select an
   * unknown choice or when the session has already ended.
   */
  choose(choiceId: string): void;
  /** Indicates whether the session has reached a terminal beat. */
  isEnded(): boolean;
};

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
function extractStartingScene(story: StoryNode): string | undefined {
  for (const child of story.children) {
    if (child.kind !== "config") {
      continue;
    }
    for (const line of child.body.split(/\r?\n/)) {
      const trimmed = line.trim();
      // Only consider lines that opt into a `starting_scene` declaration.
      if (!trimmed.startsWith("starting_scene")) {
        continue;
      }
      // NOTE: This expression may be flaggd for potential ReDoS, but the preceding
      // `startsWith` guard and linear quantifiers keep it safe and fast.
      const match = trimmed.match(/starting_scene\s*=\s*(.+)$/);
      if (!match) {
        continue;
      }
      const raw = match[1]?.trim();
      // Support both quoted and bare identifiers to mirror parser flexibility.
      if (!raw) {
        continue;
      }
      const quoted = raw.match(/^"(.+)"$/) ?? raw.match(/^'(.+)'$/);
      const value = quoted ? quoted[1] : raw;
      const identifier = sanitizeIdentifier(value);
      if (identifier) {
        return identifier;
      }
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
function hasEndStatement(body: string): boolean {
  return /(^|\s)end\b/.test(body);
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
  beat.choices.forEach((choice, index) => {
    const id = createChoiceId(beat.id, choice, index);
    map.set(id, choice);
  });
  return map;
}

// Preserve author formatting while guarding against stray whitespace.
function formatBodyText(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > 0 ? trimmed : "";
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
  let ended = hasEndStatement(currentBeat.body);

  return {
    getText(): string {
      return formatBodyText(currentBeat.body);
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
        throw new Error(
          `Choice "${choice.label}" from beat "${currentBeat.id}" does not specify a target beat.`
        );
      }

      const nextBeat = beats.get(targetId);
      if (!nextBeat) {
        throw new Error(
          `Choice "${choice.label}" from beat "${currentBeat.id}" targets unknown beat "${targetId}".`
        );
      }

      currentBeat = nextBeat;
      ended = hasEndStatement(currentBeat.body) || currentBeat.choices.length === 0;
    },
    isEnded(): boolean {
      return ended;
    },
  };
}

export type { Script };
