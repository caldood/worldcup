import { useCallback, useRef, useState } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { HUD } from "./components/HUD";
import { MenuScreen } from "./components/MenuScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { AchievementToast } from "./components/AchievementToast";
import type { GameEngine, HudData, MatchResult } from "./game/GameEngine";
import type { AchievementDef, GamePhase } from "./game/types";
import { loadState } from "./game/storage";
import "./App.css";

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [hud, setHud] = useState<HudData | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [toast, setToast] = useState<AchievementDef | null>(null);
  const [persisted, setPersisted] = useState(loadState());

  const handleEngineReady = useCallback((engine: GameEngine) => {
    engineRef.current = engine;
    engine.setListeners({
      onHud: (d) => setHud(d),
      onPhase: (p) => setPhase(p),
      onMatchResult: (r) => {
        setMatchResult(r);
        setPersisted(loadState());
      },
      onAchievement: (a) => {
        setToast(a);
        setTimeout(() => setToast(null), 3200);
      },
    });
  }, []);

  const startGame = () => {
    setMatchResult(null);
    engineRef.current?.startRun();
  };

  const showMenu = () => {
    setPersisted(loadState());
    setPhase("menu");
  };

  return (
    <div className="app-root">
      <div className="game-frame">
        <GameCanvas onEngineReady={handleEngineReady} />

        {phase !== "menu" && phase !== "gameOver" && hud && <HUD hud={hud} />}

        {phase === "menu" && <MenuScreen persisted={persisted} onStart={startGame} />}

        {phase === "gameOver" && matchResult && (
          <GameOverScreen result={matchResult} onRetry={startGame} onMenu={showMenu} />
        )}

        <AchievementToast achievement={toast} />
        <div data-testid="phase" style={{ display: "none" }}>
          {phase}
        </div>
      </div>
    </div>
  );
}
