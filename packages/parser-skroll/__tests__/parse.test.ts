import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse } from "../src";

describe("parse", () => {
  it("parses the sample script without diagnostics", async () => {
    const source = readFileSync(
      resolve(__dirname, "../../tree-sitter-skroll/sample.skr"),
      "utf8",
    );

    const { runtime, diagnostics } = await parse(source);

    expect(diagnostics).toEqual([]);
    expect(runtime.metadata).toEqual({
      id: "market-day",
      locale: "en-US",
      version: "1",
    });

    const [story] = runtime.nodes;
    expect(story).toBeDefined();
    expect(story?.id).toBe("market_day");
    expect(story?.kind).toBe("story");
    expect(story?.children).toHaveLength(1);

    const [marketplace] = story?.children ?? [];
    expect(marketplace).toBeDefined();
    expect(marketplace?.id).toBe("marketplace");
    expect(marketplace?.kind).toBe("scene");
    expect(marketplace?.children.map((node) => node.id)).toEqual([
      "arrival",
      "browse",
      "meet_friend",
      "celebration",
    ]);

    const [arrival, browse] = marketplace?.children ?? [];
    expect(arrival?.body).toContain("You arrive at the bustling market");
    expect(arrival?.choices).toHaveLength(2);
    expect(arrival?.choices[0]).toMatchObject({
      label: "Browse the stalls",
      target: "browse",
      when: undefined,
    });
    expect(arrival?.choices[1]).toMatchObject({
      label: "Meet a friend",
      target: "meet_friend",
      when: "hasInvitation",
    });

    expect(browse?.body).toContain("emit analytics_event");
  });

  it("reports SKR103 diagnostics when transitions target unknown nodes", async () => {
    const source = `story example:
  scene intro:
    beat start:
      say narrator "Hello!"
      goto missing
`;

    const { diagnostics } = await parse(source);

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SKR103",
          message: 'Target "missing" does not match any declared node.',
        }),
      ]),
    );
  });
});
