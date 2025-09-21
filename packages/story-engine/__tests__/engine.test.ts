import { choose, start, validate } from "../src";
import type { Story, StoryNode } from "@skroll/ipc-contracts";

describe("story engine", () => {
  const story: Story = {
    id: "demo",
    title: "Demo",
    start: "intro",
    nodes: {
      intro: {
        id: "intro",
        text: "Hello Skroll!",
        choices: [{ id: "next", text: "Next", goto: "ending" }],
      },
      ending: {
        id: "ending",
        text: "The end.",
        choices: [],
      },
    },
  };

  it("starts at the configured start node", () => {
    const result = start(story);
    expect(result.state.at).toBe("intro");
    expect(result.view.text).toBe("Hello Skroll!");
    expect(result.state.history).toEqual(["intro"]);
  });

  it("follows choices and updates the view", () => {
    const started = start(story);
    const progressed = choose(story, started.state, "next");
    expect(progressed.state.at).toBe("ending");
    expect(progressed.view.text).toBe("The end.");
    expect(progressed.state.history).toEqual(["intro", "ending"]);
  });

  it("throws when selecting an invalid choice", () => {
    const started = start(story);
    expect(() => choose(story, started.state, "missing")).toThrow(
      /Choice "missing" does not exist/,
    );
  });

  it("reports validation errors when a choice points to a missing node", () => {
    const introSource = story.nodes.intro as StoryNode;
    const invalidStory: Story = {
      id: story.id,
      title: story.title,
      start: story.start,
      nodes: {
        intro: {
          id: "intro",
          text: introSource.text,
          choices: [{ id: "next", text: "Next", goto: "nonexistent" }],
        },
        ending: story.nodes.ending,
      },
    };

    const validation = validate(invalidStory);
    expect(validation.ok).toBe(false);
    if (validation.ok) {
      throw new Error("Expected validation to fail for invalid story");
    }
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Choice "next" in node "intro" targets unknown node "nonexistent"',
        ),
      ]),
    );
  });

  it("returns a sanitized story when starting the engine", () => {
    const messyStory: Story = {
      id: " demo ",
      title: " Demo Story ",
      start: " intro ",
      nodes: {
        intro: {
          id: " intro ",
          text: " Welcome ",
          choices: [{ id: " next ", text: " Next ", goto: "ending" }],
        },
        ending: {
          id: "ending",
          text: " The end. ",
          choices: [],
        },
      },
    };

    const result = start(messyStory);
    const introNode = result.story.nodes.intro as StoryNode;
    expect(result.story.id).toBe("demo");
    expect(result.story.start).toBe("intro");
    expect(introNode.id).toBe("intro");
    expect(introNode.choices[0]?.id).toBe("next");
    expect(result.view.text).toBe("Welcome");
  });
});
