import { TOURNAMENT_STAGES } from "./constants";

export const STAGE_TARGET_DISTANCE = [800, 1200, 1700, 2300, 3000, 4000];

export function getStage(index: number) {
  const i = Math.min(index, TOURNAMENT_STAGES.length - 1);
  return TOURNAMENT_STAGES[i];
}

export function getStageTarget(index: number) {
  const i = Math.min(index, STAGE_TARGET_DISTANCE.length - 1);
  return STAGE_TARGET_DISTANCE[i];
}

export function isFinalStage(index: number) {
  return index >= TOURNAMENT_STAGES.length - 1;
}
