import type { AchievementDef, ProgressionStats } from "./types";

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "buyTheDip",
    name: "Buy The Dip",
    description: "Recover from a Market Correction and keep running.",
    check: (s) => s.correctionsTaken >= 1,
  },
  {
    id: "alphaGenerator",
    name: "Alpha Generator",
    description: "Collect 25 Alpha (rare collectibles).",
    check: (s) => s.totalAlpha >= 25,
  },
  {
    id: "momentumTrader",
    name: "Momentum Trader",
    description: "Reach a 5x Bull Market multiplier.",
    check: (s) => s.bestMultiplier >= 5,
  },
  {
    id: "billionDollarStriker",
    name: "Billion Dollar Striker",
    description: "Accumulate 1,000,000 total Capital.",
    check: (s) => s.totalCapital >= 1_000_000,
  },
  {
    id: "quantFinisher",
    name: "Quant Finisher",
    description: "Score 10 Top Corner Goals.",
    check: (s) => s.totalTopCorners >= 10,
  },
  {
    id: "riskManager",
    name: "Risk Manager",
    description: "Run 2000m in a single match without a Market Correction.",
    check: (s) => s.runsWithoutCorrection >= 2000,
  },
  {
    id: "trophyCabinet",
    name: "Trophy Cabinet",
    description: "Collect 15 Trophies.",
    check: (s) => s.totalTrophies >= 15,
  },
];

export function checkNewAchievements(stats: ProgressionStats, unlocked: string[]): AchievementDef[] {
  const fresh: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.includes(a.id) && a.check(stats)) fresh.push(a);
  }
  return fresh;
}
