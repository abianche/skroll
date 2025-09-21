import { choose, start } from "../src";
import type { Story } from "@skroll/ipc-contracts";

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
});
