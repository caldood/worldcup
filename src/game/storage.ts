import { STORAGE_KEY } from "./constants";
import type { PersistedState } from "./types";

const DEFAULT_STATE: PersistedState = {
  stageIndex: 0,
  bestDistance: 0,
  bestScore: 0,
  bestMultiplier: 1,
  totalCapital: 0,
  totalAlpha: 0,
  totalGoals: 0,
  totalTopCorners: 0,
  matchesWon: 0,
  correctionsTaken: 0,
  runsWithoutCorrection: 0,
  unlockedAchievements: [],
};

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode / quota) - fail silently, run continues in-memory
  }
}
