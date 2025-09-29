import { useCallback } from "react";

import type { EngineView } from "../../store";
import { useStoryStore } from "../../store";

export type UsePlayerControllerResult = {
  engineView?: EngineView;
  canRestart: boolean;
  choose: (choiceId: string) => Promise<void>;
  restart: () => Promise<void>;
};

export function usePlayerController(): UsePlayerControllerResult {
  const setEngine = useStoryStore((state) => state.setEngine);
  const engineView = useStoryStore((state) => state.engineView);

  const choose = useCallback(
    async (choiceId: string) => {
      console.warn("The legacy story engine is no longer available.", choiceId);
      setEngine();
    },
    [setEngine]
  );

  const restart = useCallback(async () => {
    console.warn("The legacy story engine is no longer available.");
    setEngine();
  }, [setEngine]);

  return {
    engineView,
    canRestart: false,
    choose,
    restart,
  };
}
