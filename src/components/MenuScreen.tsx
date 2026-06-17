import { useState } from "react";
import { FLAGS } from "../game/constants";
import type { PersistedState } from "../game/types";
import { getStage } from "../game/tournament";
import { ACHIEVEMENTS } from "../game/achievements";

interface Props {
  persisted: PersistedState;
  onStart: () => void;
}

export function MenuScreen({ persisted, onStart }: Props) {
  const [showHelp, setShowHelp] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const stage = getStage(persisted.stageIndex);

  return (
    <div className="screen menu-screen">
      <div className="flags-row">{FLAGS.slice(0, 7).join(" ")}</div>
      <h1 className="title">
        BULL RUN <span className="title-accent">CUP</span>
      </h1>
      <p className="subtitle">Dribble. Build Momentum. Score the Breakaway.</p>

      <div className="stage-card">
        <div className="stage-card-label">Current Stage</div>
        <div className="stage-card-name">{stage.name}</div>
      </div>

      <div className="stats-grid">
        <Stat label="Best Score" value={persisted.bestScore.toLocaleString()} />
        <Stat label="Best Distance" value={`${persisted.bestDistance}m`} />
        <Stat label="Total Capital" value={`🪙${persisted.totalCapital.toLocaleString()}`} />
        <Stat label="Top Corners" value={`${persisted.totalTopCorners}`} />
      </div>

      <button className="btn btn-primary" onClick={onStart}>
        ▶ Start Match
      </button>
      <div className="menu-row">
        <button className="btn btn-secondary" onClick={() => setShowHelp((v) => !v)}>
          How To Play
        </button>
        <button className="btn btn-secondary" onClick={() => setShowAchievements((v) => !v)}>
          Achievements ({persisted.unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </button>
      </div>

      {showHelp && (
        <div className="panel">
          <h3>Controls</h3>
          <ul className="help-list">
            <li>👈👉 Swipe left / right — change lanes</li>
            <li>👆 Swipe up — jump over low obstacles</li>
            <li>👇 Swipe down — slide under overhead obstacles</li>
            <li>⚔️ Breakaway: swipe left/right to beat the defender on time</li>
            <li>🥅 Shoot: swipe left/right to aim that side, tap to shoot center — the keeper dives on their own guess</li>
          </ul>
        </div>
      )}

      {showAchievements && (
        <div className="panel">
          <h3>Achievements</h3>
          <ul className="achievement-list">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = persisted.unlockedAchievements.includes(a.id);
              return (
                <li key={a.id} className={unlocked ? "unlocked" : "locked"}>
                  <span className="ach-icon">{unlocked ? "🏆" : "🔒"}</span>
                  <span>
                    <strong>{a.name}</strong>
                    <div className="ach-desc">{a.description}</div>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-box">
      <div className="stat-box-value">{value}</div>
      <div className="stat-box-label">{label}</div>
    </div>
  );
}
