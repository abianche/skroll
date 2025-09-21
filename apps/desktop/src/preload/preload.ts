import { contextBridge, ipcRenderer } from "electron";

import type {
  AppRecentRes,
  EngineChooseRes,
  EngineStartRes,
  Story,
  StoryOpenRes,
  StorySaveRes,
} from "@skroll/ipc-contracts";
import { Channels } from "@skroll/ipc-contracts";

const api = {
  story: {
    open: (path: string): Promise<StoryOpenRes> =>
      ipcRenderer.invoke(Channels.StoryOpen, { path }),
    save: (path: string, story: Story): Promise<StorySaveRes> =>
      ipcRenderer.invoke(Channels.StorySave, { path, story }),
  },
  engine: {
    start: (story: Story): Promise<EngineStartRes> =>
      ipcRenderer.invoke(Channels.EngineStart, { story }),
    choose: (choiceId: string): Promise<EngineChooseRes> =>
      ipcRenderer.invoke(Channels.EngineChoose, { choiceId }),
  },
  app: {
    recentFiles: (): Promise<AppRecentRes> => ipcRenderer.invoke(Channels.AppRecent),
  },
} as const;

contextBridge.exposeInMainWorld("skroll", api);
