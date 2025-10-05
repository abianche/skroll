import { createSession } from "../src";
import type { Action, Choice, Node, Script } from "@skroll/parser-skroll";

type MutableNode = Node & { choices: Choice[]; children: Node[] };

const range = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

function say(speaker: string, text: string): Action {
  return { type: "say", speaker, text, range };
}

// function stage(text: string): Action {
//   return { type: "stage", text, range };
// }

function end(): Action {
  return { type: "end", range };
}

function createBeat(id: string, actions: Action[], choices: Choice[] = []): MutableNode {
  return {
    id,
    kind: "beat",
    body: "",
    actions,
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
    actions: [],
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
    actions: [],
    choices: [],
    children: [],
    range,
  } as MutableNode;
}

function createRuntime(startingScene: string): Script {
  const finale = createBeat("finale", [say("narrator", "The story ends."), end()]);
  const welcome = createBeat(
    "welcome",
    [say("narrator", "Welcome to Skroll.")],
    [{ label: "Continue", target: "finale", when: undefined, actions: [], choices: [], range }]
  );
  const introScene = createScene("intro", [welcome, finale]);

  const story: MutableNode = {
    id: "demo",
    kind: "story",
    body: "",
    actions: [],
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
      /Choice "unknown-choice" is not available/
    );
  });

  it("throws when the configured starting scene cannot be found", () => {
    expect(() => createSession(createRuntime("missing"))).toThrow(
      /Starting scene "missing" does not exist/
    );
  });

  it("executes inline choice bodies as ephemeral beats", () => {
    const inlineChoice: Choice = {
      label: "Explore",
      target: undefined,
      when: undefined,
      actions: [say("narrator", "A hidden passage opens.")],
      choices: [
        { label: "Proceed", target: "finale", when: undefined, actions: [], choices: [], range },
      ],
      range,
    };

    const startBeat = createBeat("start", [say("guide", "Choose your path.")], [inlineChoice]);
    const finaleBeat = createBeat("finale", [say("narrator", "All done."), end()]);
    const scene = createScene("intro", [startBeat, finaleBeat]);

    const story: MutableNode = {
      id: "inline-demo",
      kind: "story",
      body: "",
      actions: [],
      choices: [],
      children: [createConfig("starting_scene = intro"), scene],
      range,
    } as MutableNode;

    const runtime: Script = {
      type: "Script",
      metadata: {},
      nodes: [story],
      range,
    };

    const session = createSession(runtime);

    expect(session.getText()).toBe("Choose your path.");
    expect(session.getChoices()).toEqual([{ id: "start::choice-0", label: "Explore" }]);

    session.choose("start::choice-0");

    expect(session.getText()).toBe("A hidden passage opens.");
    expect(session.isEnded()).toBe(false);
    expect(session.getChoices()).toEqual([{ id: "finale", label: "Proceed" }]);

    session.choose("finale");

    expect(session.getText()).toBe("All done.\nend");
    expect(session.isEnded()).toBe(true);
  });
});
