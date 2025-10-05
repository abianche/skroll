import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type {
  AppRecentRes,
  DslCompileTextRes,
  DslOpenFileRes,
  DslSaveFileRes,
  SkrollApi,
} from "@skroll/ipc-contracts";

describe("ipc helpers", () => {
  let helpers: typeof import("./ipc");
  let compileTextMock: ReturnType<typeof jest.fn>;
  let openFileMock: ReturnType<typeof jest.fn>;
  let saveFileMock: ReturnType<typeof jest.fn>;
  let recentFilesMock: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    jest.resetModules();

    compileTextMock = jest.fn();
    openFileMock = jest.fn();
    saveFileMock = jest.fn();
    recentFilesMock = jest.fn();

    const skroll: SkrollApi = {
      dsl: {
        compileText: compileTextMock,
        openFile: openFileMock,
        saveFile: saveFileMock,
      },
      app: { recentFiles: recentFilesMock },
    };

    window.skroll = skroll;

    helpers = await import("./ipc");
  });

  afterEach(() => {
    delete window.skroll;
  });

  it("forwards compileText requests", async () => {
    const expected = { result: {} } as unknown as DslCompileTextRes;
    compileTextMock.mockResolvedValue(expected);

    await expect(helpers.compileText("story")).resolves.toBe(expected);
    expect(compileTextMock).toHaveBeenCalledWith("story");
  });

  it("forwards openFile requests", async () => {
    const expected = { path: "file", text: "contents" } as DslOpenFileRes;
    openFileMock.mockResolvedValue(expected);

    await expect(helpers.openFile("file")).resolves.toBe(expected);
    expect(openFileMock).toHaveBeenCalledWith("file");
  });

  it("forwards saveFile requests", async () => {
    const expected = { ok: true } as DslSaveFileRes;
    saveFileMock.mockResolvedValue(expected);

    await expect(helpers.saveFile("file", "text")).resolves.toBe(expected);
    expect(saveFileMock).toHaveBeenCalledWith("file", "text");
  });

  it("forwards recentFiles requests", async () => {
    const expected = { files: ["one", "two"] } as AppRecentRes;
    recentFilesMock.mockResolvedValue(expected);

    await expect(helpers.recentFiles()).resolves.toBe(expected);
    expect(recentFilesMock).toHaveBeenCalledWith();
  });
});
