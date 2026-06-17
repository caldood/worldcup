import type { Player } from "../player";
import type { ObstacleKind, RunnerEntity } from "../types";
import { COLLECTIBLE_ICON, OBSTACLE_ACTION, OBSTACLE_COLOR, OBSTACLE_ICON, POWERUP_ICON } from "./icons";
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
    ctx.globalAlpha = Math.max(0.15, scale);
    if (e.hit) ctx.globalAlpha *= 0.3;

    if (e.type === "obstacle") {
      const color = OBSTACLE_COLOR[e.kind as ObstacleKind];
      const close = scale > 0.55;

      // ground marker ring, pulses faster and brighter the closer the obstacle gets
      ctx.save();
      const pulse = close ? 0.55 + Math.sin(t * 14) * 0.35 : 0.4;
      ctx.globalAlpha *= pulse;
      ctx.strokeStyle = color;
      ctx.lineWidth = close ? 3.5 : 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, size * 0.46, size * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // colored danger halo behind the icon for instant kind recognition
      ctx.save();
      ctx.globalAlpha *= 0.45;
      const halo = ctx.createRadialGradient(x, y - size * 0.32, 0, x, y - size * 0.32, size * 0.75);
      halo.addColorStop(0, color + "cc");
      halo.addColorStop(1, color + "00");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.32, size * 0.75, 0, Math.PI * 2);
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

  ctx.save();
  ctx.rotate(lean);
  ctx.translate(0, runBob);

  // body (jersey)
  ctx.fillStyle = player.anim === "stumble" ? "#ef4444" : "#fbbf24";
  ctx.beginPath();
  ctx.roundRect(-15, -48, 30, 38, 8);
  ctx.fill();

  // shorts
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(-14, -14, 28, 14);

  // legs
  ctx.fillStyle = "#fcd9b8";
  ctx.fillRect(-10, 0, 8, 16);
  ctx.fillRect(2, 0, 8, 16);

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
