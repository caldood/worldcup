// Canvas logical resolution (portrait, mobile-first). Scaled to device via CSS + DPR.
export const CANVAS_W = 420;
export const CANVAS_H = 760;

export const LANE_COUNT = 3;
export const LANE_X = [CANVAS_W * 0.22, CANVAS_W * 0.5, CANVAS_W * 0.78];

export const GROUND_Y = CANVAS_H * 0.78;

export const BASE_RUN_SPEED = 230; // px/sec world scroll speed at stage 0
export const MAX_RUN_SPEED = 560;
export const SPEED_PER_STAGE = 28;
export const SPEED_RAMP_PER_METER = 0.045; // gradual ramp within a run

export const JUMP_DURATION = 0.62; // seconds
export const SLIDE_DURATION = 0.5;
export const LANE_CHANGE_DURATION = 0.16;

export const SPAWN_Z = 1000; // entities spawn this far ahead (world units)
export const DESPAWN_Z = -60;

export const BREAKAWAY_MIN_DISTANCE = 500;
export const BREAKAWAY_MAX_DISTANCE = 1000;

export const SWIPE_MIN_DISTANCE = 28; // px
export const SWIPE_MAX_TIME = 600; // ms

export const STORAGE_KEY = "bullRunCup.save.v1";

export const TOURNAMENT_STAGES = [
  { id: "group", name: "Group Stage", speedMul: 1.0, obstacleDensity: 1.0, defenderIq: 1.0, keeperSkill: 0.55 },
  { id: "r32", name: "Round of 32", speedMul: 1.08, obstacleDensity: 1.12, defenderIq: 1.1, keeperSkill: 0.6 },
  { id: "r16", name: "Round of 16", speedMul: 1.16, obstacleDensity: 1.24, defenderIq: 1.2, keeperSkill: 0.65 },
  { id: "qf", name: "Quarterfinals", speedMul: 1.26, obstacleDensity: 1.38, defenderIq: 1.32, keeperSkill: 0.72 },
  { id: "sf", name: "Semifinals", speedMul: 1.38, obstacleDensity: 1.52, defenderIq: 1.46, keeperSkill: 0.8 },
  { id: "final", name: "The Final", speedMul: 1.5, obstacleDensity: 1.7, defenderIq: 1.6, keeperSkill: 0.9 },
] as const;

export const FLAGS = ["🇧🇷", "🇫🇷", "🇦🇷", "🇩🇪", "🇪🇸", "🇮🇹", "🇵🇹", "🇳🇱", "🇺🇸", "🇯🇵", "🏴", "🇲🇽"];

export const POWER_UP_DURATIONS: Record<string, number> = {
  rocketBoots: 4.5,
  goldenMagnet: 6,
  varShield: 7,
  momentumMode: 5,
  hatTrick: 8,
};
