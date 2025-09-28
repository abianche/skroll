import { createSession } from "../src";
import type { Choice, Node, Script } from "@skroll/parser-skroll";

type MutableNode = Node & { choices: Choice[]; children: Node[] };

const range = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

function createBeat(id: string, body: string, choices: Choice[] = []): MutableNode {
  return {
    id,
    kind: "beat",
    body,
    choices,
    children: [],
    range,
  } as MutableNode;
}

function createScene(id: string, beats: MutableNode[]): MutableNode {
  return {
    id,
    kind: "scene",
    body: "",
    choices: [],
    children: beats,
    range,
  } as MutableNode;
}

function createConfig(body: string): MutableNode {
  return {
    id: "",
    kind: "config",
    body,
    choices: [],
    children: [],
    range,
  } as MutableNode;
}

function createRuntime(startingScene: string): Script {
  const finale = createBeat("finale", "The story ends.\nend");
  const welcome = createBeat("welcome", "Welcome to Skroll.", [
    { label: "Continue", target: "finale", when: undefined, body: undefined, range },
  ]);
  const introScene = createScene("intro", [welcome, finale]);

  const story: MutableNode = {
    id: "demo",
    kind: "story",
    body: "",
    choices: [],
    children: [createConfig(`starting_scene = ${startingScene}`), introScene],
    range,
  } as MutableNode;

  return {
    type: "Script",
    metadata: {},
    nodes: [story],
    range,
  };
}

describe("createSession", () => {
  it("starts the session at the configured scene and exposes choices", () => {
    const session = createSession(createRuntime("intro"));

    expect(session.getText()).toBe("Welcome to Skroll.");
    expect(session.getChoices()).toEqual([{ id: "finale", label: "Continue" }]);
  });

  it("follows choices and marks the story as ended once a terminal beat is reached", () => {
    const session = createSession(createRuntime("intro"));
    session.choose("finale");

    expect(session.getText()).toBe("The story ends.\nend");
    expect(session.isEnded()).toBe(true);
    expect(session.getChoices()).toEqual([]);
  });

  it("rejects selecting choices that are not present on the current beat", () => {
    const session = createSession(createRuntime("intro"));

    expect(() => session.choose("unknown-choice")).toThrow(
      /Choice "unknown-choice" is not available/,
    );
  });

  it("throws when the configured starting scene cannot be found", () => {
    expect(() => createSession(createRuntime("missing"))).toThrow(
      /Starting scene "missing" does not exist/,
    );
  });
});
