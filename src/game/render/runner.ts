import type { Player } from "../player";
import type { CollectibleKind, ObstacleKind, RunnerEntity } from "../types";
import { COLLECTIBLE_COLOR, COLLECTIBLE_ICON, OBSTACLE_ACTION, OBSTACLE_COLOR, OBSTACLE_ICON, POWERUP_ICON } from "./icons";
import { laneScreenX } from "./perspective";

function iconFor(e: RunnerEntity): string {
  if (e.type === "obstacle") return OBSTACLE_ICON[e.kind as keyof typeof OBSTACLE_ICON];
  if (e.type === "powerup") return POWERUP_ICON[e.kind as keyof typeof POWERUP_ICON];
  return COLLECTIBLE_ICON[e.kind as keyof typeof COLLECTIBLE_ICON];
}

// Stop-sign silhouette so danger reads as a shape, not just a color, even for
// players who can't distinguish the hue.
function octagonPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI / 8 + (i / 8) * Math.PI * 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

const ACTION_GLYPH: Record<string, string> = { jump: "▲", slide: "▼", dodge: "↔" };

export function drawEntities(ctx: CanvasRenderingContext2D, entities: RunnerEntity[], t: number) {
  const sorted = [...entities].sort((a, b) => b.z - a.z);
  for (const e of sorted) {
    const { x, y, scale } = laneScreenX(e.lane, e.z);
    const bob = e.type === "collectible" ? Math.sin(t * 6 + e.bobPhase) * 6 * scale : 0;
    const baseSize = e.type === "obstacle" ? 44 : e.type === "powerup" ? 38 : 30;
    const size = baseSize * scale;
    const grabbable = e.type === "collectible" || e.type === "powerup";

    ctx.save();
    // Obstacles get a much higher visibility floor than collectibles so they
    // read clearly from a distance, giving the player real reaction time.
    ctx.globalAlpha = e.type === "obstacle" ? Math.max(0.55, scale) : Math.max(0.15, scale);
    if (e.hit) ctx.globalAlpha *= 0.3;

    if (e.type === "obstacle") {
      const color = OBSTACLE_COLOR[e.kind as ObstacleKind];
      const close = scale > 0.55;

      // hazard-tape ground ring: bright red outer band (universal "stop"
      // signal) with a thin kind-colored inner band for identification
      ctx.save();
      const pulse = close ? 0.65 + Math.sin(t * 14) * 0.35 : 0.5;
      ctx.globalAlpha *= pulse;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = close ? 6 : 4;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, size * 0.48, size * 0.17, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = close ? 3 : 1.8;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, size * 0.48, size * 0.17, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // opaque stop-sign badge behind the icon: solid color octagon framed
      // by a dark ring then a white ring, so the danger shape and color both
      // pop against the green pitch no matter what color the emoji renders in
      ctx.save();
      octagonPath(ctx, x, y - size * 0.32, size * 0.64);
      ctx.fillStyle = "#111827";
      ctx.fill();
      octagonPath(ctx, x, y - size * 0.32, size * 0.55);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      octagonPath(ctx, x, y - size * 0.32, size * 0.47);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      // soft outer glow on top for extra pop without washing out the badge
      ctx.save();
      ctx.globalAlpha *= 0.5;
      const halo = ctx.createRadialGradient(x, y - size * 0.32, size * 0.47, x, y - size * 0.32, size * 0.95);
      halo.addColorStop(0, color + "aa");
      halo.addColorStop(1, color + "00");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.32, size * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // small warning badge in the corner — an unmistakable, color-blind-safe
      // "avoid" cue independent of the kind-specific icon
      if (scale > 0.3) {
        ctx.save();
        ctx.font = `${size * 0.4}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚠️", x + size * 0.42, y - size * 0.78);
        ctx.restore();
      }

      // action-hint glyph telling the player what input clears this obstacle
      const action = OBSTACLE_ACTION[e.kind as ObstacleKind];
      if (close) {
        ctx.save();
        ctx.globalAlpha *= 0.9;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#111827";
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${size * 0.42}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(ACTION_GLYPH[action], x, y - size * 1.05);
        ctx.fillText(ACTION_GLYPH[action], x, y - size * 1.05);
        ctx.restore();
      }
    } else {
      // contact shadow
      ctx.save();
      ctx.globalAlpha *= 0.35;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(x, y + 4, size * 0.32, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (grabbable) {
      // welcoming ground ring: green pulse, the inviting opposite of the
      // obstacles' red hazard tape, so "safe to grab" reads instantly
      ctx.save();
      ctx.globalAlpha *= 0.5 + Math.sin(t * 6 + e.bobPhase) * 0.2;
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, size * 0.4, size * 0.14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // orbiting sparkle glints to make pickups feel valuable and alive
      ctx.save();
      ctx.fillStyle = "#fff7c2";
      for (let i = 0; i < 3; i++) {
        const angle = t * 2.5 + (i / 3) * Math.PI * 2 + e.bobPhase;
        const sx = x + Math.cos(angle) * size * 0.62;
        const sy = y - size * 0.3 + Math.sin(angle) * size * 0.42;
        const twinkle = Math.max(0, Math.sin(t * 5 + i * 2));
        ctx.globalAlpha = twinkle * 0.8;
        ctx.font = `${size * 0.22}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✦", sx, sy);
      }
      ctx.restore();
    }

    if (e.type === "collectible") {
      // gentle tinted glow so pickups feel inviting and stand out from the turf
      ctx.save();
      ctx.globalAlpha *= 0.55 + Math.sin(t * 5 + e.bobPhase) * 0.15;
      const glowColor = COLLECTIBLE_COLOR[e.kind as CollectibleKind];
      const glow = ctx.createRadialGradient(x, y - size * 0.3, 0, x, y - size * 0.3, size * 0.85);
      glow.addColorStop(0, glowColor + "cc");
      glow.addColorStop(1, glowColor + "00");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.3, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (e.type === "powerup") {
      ctx.save();
      ctx.globalAlpha *= 0.5 + Math.sin(t * 8) * 0.2;
      ctx.fillStyle = "#fff7c2";
      ctx.beginPath();
      ctx.arc(x, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(iconFor(e), x, y - size * 0.32 + bob);
    ctx.restore();
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, lanesXBase: number) {
  const x = player.x;
  const y = player.y;
  const scale = player.scaleY;
  const blink = player.invulnT > 0 && Math.floor(player.invulnT * 12) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = blink ? 0.4 : 1;
  ctx.translate(x, y);
  ctx.scale(1, scale);

  // shadow
  ctx.save();
  ctx.globalAlpha *= 0.3;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(0, 18 / scale - 18, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const runBob = player.anim === "run" ? Math.sin(player.bob) * 4 : 0;
  const lean = player.anim === "stumble" ? Math.sin(player.bob * 2) * 0.3 : 0;
  const swing = player.anim === "run" ? Math.sin(player.bob) : 0;
  const stumbling = player.anim === "stumble";

  ctx.save();
  ctx.rotate(lean);
  ctx.translate(0, runBob);

  // arms (drawn behind the jersey so the swing reads as alternating front/back)
  ctx.fillStyle = "#fcd9b8";
  ctx.save();
  ctx.translate(-15, -42);
  ctx.rotate(swing * 0.7);
  ctx.fillRect(-3, 0, 6, 22);
  ctx.restore();
  ctx.save();
  ctx.translate(15, -42);
  ctx.rotate(-swing * 0.7);
  ctx.fillRect(-3, 0, 6, 22);
  ctx.restore();

  // legs (alternating stride)
  ctx.fillStyle = "#fcd9b8";
  ctx.save();
  ctx.translate(-6, -2);
  ctx.rotate(swing * 0.5);
  ctx.fillRect(-4, 0, 8, 16);
  ctx.restore();
  ctx.save();
  ctx.translate(6, -2);
  ctx.rotate(-swing * 0.5);
  ctx.fillRect(-4, 0, 8, 16);
  ctx.restore();

  // body (USA jersey)
  if (stumbling) {
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.roundRect(-15, -48, 30, 38, 8);
    ctx.fill();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-15, -48, 30, 38, 8);
    ctx.clip();
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(-15, -48, 30, 38);
    // navy shoulder/sleeve trim
    ctx.fillStyle = "#0a3161";
    ctx.fillRect(-15, -48, 7, 14);
    ctx.fillRect(8, -48, 7, 14);
    // red chest stripe
    ctx.fillStyle = "#b31942";
    ctx.fillRect(-15, -26, 30, 6);
    ctx.restore();
    // navy star emblem
    ctx.fillStyle = "#0a3161";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", 0, -38);
  }

  // shorts (navy with red side stripe)
  ctx.fillStyle = "#0a3161";
  ctx.fillRect(-14, -14, 28, 14);
  ctx.fillStyle = "#b31942";
  ctx.fillRect(-14, -14, 3, 14);
  ctx.fillRect(11, -14, 3, 14);

  // head
  ctx.fillStyle = "#fcd9b8";
  ctx.beginPath();
  ctx.arc(0, -58, 13, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = "#3b2417";
  ctx.beginPath();
  ctx.arc(0, -63, 12, Math.PI, 0);
  ctx.fill();

  ctx.restore();
  ctx.restore();

  void lanesXBase;
}
