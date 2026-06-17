export type SwipeDir = "left" | "right" | "up" | "down";

export type ShootDir = "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center";

export type GamePhase =
  | "menu"
  | "runner"
  | "breakawayTransitionIn"
  | "breakawayBeat"
  | "breakawayShoot"
  | "breakawayResult"
  | "breakawayTransitionOut"
  | "gameOver";

export type ShotOutcome = "goal" | "greatGoal" | "topCornerGoal" | "saved" | "miss";

export type ObstacleKind =
  | "defender"
  | "slidingTackle"
  | "referee"
  | "cone"
  | "cart"
  | "varCamera"
  | "barrier";

export type PowerUpKind =
  | "rocketBoots"
  | "goldenMagnet"
  | "varShield"
  | "momentumMode"
  | "hatTrick";

export type CollectibleKind = "capital" | "alpha" | "jersey" | "trophy" | "ball";

export interface Lane {
  index: 0 | 1 | 2;
}

export interface RunnerEntity {
  id: number;
  lane: 0 | 1 | 2;
  z: number; // distance ahead of player, shrinks toward 0
  kind: ObstacleKind | PowerUpKind | CollectibleKind;
  type: "obstacle" | "powerup" | "collectible";
  hit?: boolean;
  bobPhase: number;
}

export interface ActivePowerUp {
  kind: PowerUpKind;
  timeLeft: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  check: (s: ProgressionStats) => boolean;
}

export interface ProgressionStats {
  totalCapital: number;
  totalAlpha: number;
  totalGoals: number;
  totalTopCorners: number;
  totalTrophies: number;
  bestDistance: number;
  bestScore: number;
  bestMultiplier: number;
  matchesWon: number;
  correctionsTaken: number;
  runsWithoutCorrection: number;
  stageReached: number;
}

export interface PersistedState {
  stageIndex: number;
  bestDistance: number;
  bestScore: number;
  bestMultiplier: number;
  totalCapital: number;
  totalAlpha: number;
  totalGoals: number;
  totalTopCorners: number;
  totalTrophies: number;
  matchesWon: number;
  correctionsTaken: number;
  runsWithoutCorrection: number;
  unlockedAchievements: string[];
}
