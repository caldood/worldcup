import { useEffect, useRef } from "react";
import { CANVAS_H, CANVAS_W } from "../game/constants";
import { GameEngine } from "../game/GameEngine";

interface Props {
  onEngineReady: (engine: GameEngine) => void;
}

export function GameCanvas({ onEngineReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    ctx?.scale(dpr, dpr);

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    engine.run();
    onEngineReady(engine);

    return () => {
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas ref={canvasRef} className="game-canvas" style={{ touchAction: "none" }} />
  );
}
