import type { AchievementDef } from "../game/types";

interface Props {
  achievement: AchievementDef | null;
}

export function AchievementToast({ achievement }: Props) {
  if (!achievement) return null;
  return (
    <div className="achievement-toast">
      <span className="ach-icon">🏆</span>
      <div>
        <div className="ach-toast-title">Achievement Unlocked</div>
        <div className="ach-toast-name">{achievement.name}</div>
      </div>
    </div>
  );
}
