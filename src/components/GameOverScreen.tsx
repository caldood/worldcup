import type { MatchResult } from "../game/GameEngine";

interface Props {
  result: MatchResult;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ result, onRetry, onMenu }: Props) {
  return (
    <div className="screen gameover-screen">
      {result.wonMatch && <div className="match-won-banner">🏆 MATCH WON — {result.stageName}</div>}
      {result.isNewBest && <div className="new-best-banner">✨ NEW BEST SCORE ✨</div>}
      <h2 className="gameover-title">Full Time</h2>
      <div className="result-grid">
        <Result label="Score" value={result.score.toLocaleString()} />
        <Result label="Distance" value={`${result.distance}m`} />
        <Result label="Capital" value={`🪙${result.capital.toLocaleString()}`} />
        <Result label="Alpha" value={`💎${result.alpha}`} />
        <Result label="Goals" value={`⚽${result.goals}`} />
        <Result label="Top Corners" value={`🎯${result.topCorners}`} />
      </div>
      <button className="btn btn-primary" onClick={onRetry}>
        ▶ Play Again
      </button>
      <button className="btn btn-secondary" onClick={onMenu}>
        Main Menu
      </button>
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-box">
      <div className="stat-box-value">{value}</div>
      <div className="stat-box-label">{label}</div>
    </div>
  );
}
