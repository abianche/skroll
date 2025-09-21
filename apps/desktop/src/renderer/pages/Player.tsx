import { useNavigate } from "react-router";

import { PlayerView } from "../features/player/PlayerView";
import { usePlayerController } from "../features/player/usePlayerController";

export function PlayerPage() {
  const navigate = useNavigate();
  const { engineView, canRestart, choose, restart } = usePlayerController();

  return (
    <PlayerView
      engineView={engineView}
      canRestart={canRestart}
      onChoose={choose}
      onRestart={restart}
      onBackToEditor={() => navigate("/editor")}
    />
  );
}
