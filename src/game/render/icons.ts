import type { CollectibleKind, ObstacleKind, PowerUpKind } from "../types";

export const OBSTACLE_ICON: Record<ObstacleKind, string> = {
  defender: "🛡️",
  slidingTackle: "🦵",
  referee: "🟨",
  cone: "🚧",
  cart: "🛒",
  varCamera: "📷",
  barrier: "⛔",
};

export const OBSTACLE_LABEL: Record<ObstacleKind, string> = {
  defender: "Defender",
  slidingTackle: "Sliding Tackle",
  referee: "Referee",
  cone: "Cone",
  cart: "Equipment Cart",
  varCamera: "VAR Camera",
  barrier: "Security Barrier",
};

export const POWERUP_ICON: Record<PowerUpKind, string> = {
  rocketBoots: "🚀",
  goldenMagnet: "🧲",
  varShield: "🛡️✨",
  momentumMode: "🔥",
  hatTrick: "🎩",
};

export const POWERUP_LABEL: Record<PowerUpKind, string> = {
  rocketBoots: "Rocket Boots",
  goldenMagnet: "Golden Ball Magnet",
  varShield: "VAR Shield",
  momentumMode: "Momentum Mode",
  hatTrick: "Hat Trick Multiplier",
};

export const COLLECTIBLE_ICON: Record<CollectibleKind, string> = {
  capital: "🪙",
  alpha: "💎",
};

// Low obstacles can be cleared by jumping; everything else must be dodged by changing lanes.
export const LOW_OBSTACLES: ObstacleKind[] = ["slidingTackle", "cone"];
// Overhead obstacles can be cleared by sliding under them.
export const OVERHEAD_OBSTACLES: ObstacleKind[] = ["varCamera"];
