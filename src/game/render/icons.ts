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

// Distinct, highly-saturated hue per obstacle, chosen to pop against the green pitch.
export const OBSTACLE_COLOR: Record<ObstacleKind, string> = {
  defender: "#ff3b3b",
  slidingTackle: "#ff8c1a",
  referee: "#ffe000",
  cone: "#ff5e1a",
  cart: "#2f8dff",
  varCamera: "#a855f7",
  barrier: "#ff2d8a",
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
  jersey: "👕",
  trophy: "🏆",
};

// Low obstacles can be cleared by jumping; everything else must be dodged by changing lanes.
export const LOW_OBSTACLES: ObstacleKind[] = ["slidingTackle", "cone"];
// Overhead obstacles can be cleared by sliding under them.
export const OVERHEAD_OBSTACLES: ObstacleKind[] = ["varCamera"];

export type ObstacleAction = "jump" | "slide" | "dodge";

export const OBSTACLE_ACTION: Record<ObstacleKind, ObstacleAction> = {
  defender: "dodge",
  slidingTackle: "jump",
  referee: "dodge",
  cone: "jump",
  cart: "dodge",
  varCamera: "slide",
  barrier: "dodge",
};
