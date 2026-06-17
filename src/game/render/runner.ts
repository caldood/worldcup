import type { Player } from "../player";
import type { CollectibleKind, ObstacleKind, RunnerEntity } from "../types";
import { COLLECTIBLE_COLOR, COLLECTIBLE_ICON, OBSTACLE_ACTION, OBSTACLE_COLOR, OBSTACLE_ICON, POWERUP_ICON } from "./icons";
import { laneScreenX } from "./perspective";

function iconFor(e: RunnerEntity): string {
  if (e.type === "obstacle") return OBSTACLE_ICON[e.kind as keyof typeof OBSTACLE_ICON];
  if (e.type === "powerup") return POWERUP_ICON[e.kind as keyof typeof POWERUP_ICON];
  return COLLECTIBLE_ICON[e.kind as keyof typeof COLLECTIBLE_ICON];
}

export function drawEntities(ctx: CanvasRenderingContext2D, entities: RunnerEntity[], t: number) {
  const sorted = [...entities].sort((a, b) => b.z - a.z);
  for (const e of sorted) {
    const { x, y, scale } = laneScreenX(e.lane, e.z);
    const bob = e.type === "collectible" ? Math.sin(t * 6 + e.bobPhase) * 6 * scale : 0;
    const baseSize = e.type === "obstacle" ? 44 : e.type === "powerup" ? 38 : 30;
    const size = baseSize * scale;

    ctx.save();
    // Obstacles get a much higher visibility floor than collectibles so they
    // read clearly from a distance, giving the player real reaction time.
    ctx.globalAlpha = e.type === "obstacle" ? Math.max(0.55, scale) : Math.max(0.15, scale);
    if (e.hit) ctx.globalAlpha *= 0.3;

    if (e.type === "obstacle") {
      const color = OBSTACLE_COLOR[e.kind as ObstacleKind];
      const close = scale > 0.55;

      // ground marker ring, pulses faster and brighter the closer the obstacle gets
      ctx.save();
      const pulse = close ? 0.65 + Math.sin(t * 14) * 0.35 : 0.5;
      ctx.globalAlpha *= pulse;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = close ? 5.5 : 3.5;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, size * 0.46, size * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = close ? 3.5 : 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, size * 0.46, size * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // opaque road-sign badge behind the icon: solid color disc framed by a
      // dark ring then a white ring, so it pops against the green pitch no
      // matter what color the emoji itself happens to render in.
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y - size * 0.32, size * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = "#111827";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - size * 0.32, size * 0.54, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - size * 0.32, size * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      // soft outer glow on top for extra pop without washing out the badge
      ctx.save();
      ctx.globalAlpha *= 0.5;
      const halo = ctx.createRadialGradient(x, y - size * 0.32, size * 0.46, x, y - size * 0.32, size * 0.95);
      halo.addColorStop(0, color + "aa");
      halo.addColorStop(1, color + "00");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.32, size * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // action-hint arrow telling the player what input clears this obstacle
      const action = OBSTACLE_ACTION[e.kind as ObstacleKind];
      if (close && action !== "dodge") {
        ctx.save();
        ctx.globalAlpha *= 0.85;
        ctx.fillStyle = color;
        ctx.font = `${size * 0.4}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(action === "jump" ? "▲" : "▼", x, y - size * 1.05);
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
