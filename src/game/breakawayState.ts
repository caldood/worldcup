import type { ShootDir, ShotOutcome, SwipeDir } from "./types";

export interface BreakawayState {
  subPhase: "transitionIn" | "beat" | "shoot" | "result" | "transitionOut";
  transitionT: number;
  beat: {
    index: number;
    total: number;
    promptDir: SwipeDir | null;
    windowT: number;
    windowMax: number;
    resolved: "success" | "fail" | null;
    resolvedT: number;
  };
  shoot: {
    windowT: number;
    windowMax: number;
    chosenDir: ShootDir | null;
    keeperDir: ShootDir | null;
    diveT: number;
    outcome: ShotOutcome | null;
    ballX: number;
    ballY: number;
    ballScale: number;
    resolvedT: number;
  };
  resultT: number;
}

export function freshBreakawayState(): BreakawayState {
  return {
    subPhase: "transitionIn",
    transitionT: 0,
    beat: {
      index: 0,
      total: 2,
      promptDir: null,
      windowT: 0,
      windowMax: 1.1,
      resolved: null,
      resolvedT: 0,
    },
    shoot: {
      windowT: 0,
      windowMax: 2.6,
      chosenDir: null,
      keeperDir: null,
      diveT: 0,
      outcome: null,
      ballX: 0,
      ballY: 0,
      ballScale: 1,
      resolvedT: 0,
    },
    resultT: 0,
  };
}
