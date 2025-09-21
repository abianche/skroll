import { useCallback } from "react";

import type { EngineView } from "@skroll/ipc-contracts";

import { useStoryStore } from "../../store";

export type UsePlayerControllerResult = {
  engineView?: EngineView;
  canRestart: boolean;
  choose: (choiceId: string) => Promise<void>;
  restart: () => Promise<void>;
};

export function usePlayerController(): UsePlayerControllerResult {
  const story = useStoryStore((state) => state.story);
  const engineView = useStoryStore((state) => state.engineView);
  const setEngine = useStoryStore((state) => state.setEngine);

  const choose = useCallback(
    async (choiceId: string) => {
      try {
        const result = await window.skroll.engine.choose(choiceId);
        setEngine(result);
      } catch (error) {
        console.error("Failed to apply choice", error);
      }
    },
    [setEngine]
  );

  const restart = useCallback(async () => {
    try {
      const result = await window.skroll.engine.start(story);
      setEngine(result);
    } catch (error) {
      console.error("Failed to restart story", error);
    }
  }, [setEngine, story]);

  return {
    engineView,
    canRestart: Boolean(engineView),
    choose,
    restart,
  };
}
