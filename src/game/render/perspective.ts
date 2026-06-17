import { CANVAS_H, CANVAS_W, GROUND_Y, LANE_X, SPAWN_Z } from "../constants";

export const HORIZON_Y = CANVAS_H * 0.22;
export const VANISH_X = CANVAS_W / 2;

// depthT: 0 = far away (at horizon), 1 = at player's ground line
export function depthT(z: number): number {
  const t = 1 - z / SPAWN_Z;
  return Math.min(1, Math.max(0, t));
}

export function projectX(laneX: number, t: number): number {
  return VANISH_X + (laneX - VANISH_X) * t;
}

export function projectY(t: number): number {
  return HORIZON_Y + (GROUND_Y - HORIZON_Y) * t;
}

export function projectScale(t: number): number {
  return 0.15 + 0.85 * t;
}

export function laneScreenX(lane: 0 | 1 | 2, z: number): { x: number; y: number; scale: number } {
  const t = depthT(z);
  return { x: projectX(LANE_X[lane], t), y: projectY(t), scale: projectScale(t) };
}
