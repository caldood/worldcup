import type { HudData } from "../game/GameEngine";
import { POWERUP_ICON } from "../game/render/icons";

interface Props {
  hud: HudData;
}

export function HUD({ hud }: Props) {
  const progressPct = Math.min(100, (hud.distance / hud.stageTarget) * 100);

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-stat">
          <span className="hud-label">Score</span>
          <span className="hud-value">{hud.score.toLocaleString()}</span>
        </div>
        <div className="hud-stat hud-stat-center">
          <span className="hud-label">{hud.stageName}</span>
          <div className="hud-progress">
            <div className="hud-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="hud-sub">{hud.distance}m / {hud.stageTarget}m</span>
        </div>
        <div className="hud-stat hud-stat-right">
          <span className="hud-label">Capital</span>
          <span className="hud-value">🪙{hud.capital.toLocaleString()}</span>
        </div>
      </div>

      <div className="hud-mid-right">
        <div className="hud-lives">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < hud.lives ? "life on" : "life off"}>
              ❤️
            </span>
          ))}
        </div>
        <div className="hud-multiplier">
          <span>Bull Market</span>
          <strong>x{hud.multiplier.toFixed(1)}</strong>
        </div>
        <div className="hud-momentum">
          <div className="hud-momentum-fill" style={{ width: `${hud.momentumPct * 100}%` }} />
        </div>
      </div>

      {hud.activePowerUps.length > 0 && (
        <div className="hud-powerups">
          {hud.activePowerUps.map((p) => (
            <div key={p.kind} className="hud-powerup-badge">
              <span>{POWERUP_ICON[p.kind]}</span>
              <div className="hud-powerup-ring">
                <div className="hud-powerup-fill" style={{ height: `${p.pct * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {hud.matchWonToast && <div className="hud-match-toast">{hud.matchWonToast}</div>}
    </div>
  );
}
