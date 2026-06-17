import { CANVAS_H, CANVAS_W } from "../constants";
import type { BreakawayState } from "../breakawayState";
import type { ShootDir, SwipeDir } from "../types";
import { HORIZON_Y } from "./perspective";

const ZONE_POS: Record<ShootDir, { x: number; y: number }> = {
  topLeft: { x: CANVAS_W * 0.28, y: HORIZON_Y + 30 },
  topRight: { x: CANVAS_W * 0.72, y: HORIZON_Y + 30 },
  bottomLeft: { x: CANVAS_W * 0.28, y: HORIZON_Y + 92 },
  bottomRight: { x: CANVAS_W * 0.72, y: HORIZON_Y + 92 },
  center: { x: CANVAS_W * 0.5, y: HORIZON_Y + 62 },
};

export function drawGoalFrame(ctx: CanvasRenderingContext2D) {
  const left = CANVAS_W * 0.14;
  const right = CANVAS_W * 0.86;
  const top = HORIZON_Y - 30;
  const bottom = HORIZON_Y + 120;

  ctx.save();
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  // net
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  for (let x = left; x <= right; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  for (let y = top; y <= bottom; y += 10) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawKeeper(ctx: CanvasRenderingContext2D, divDir: ShootDir | null, diveT: number) {
  const base = ZONE_POS.center;
  let offX = 0;
  let offY = 0;
  if (divDir) {
    const target = ZONE_POS[divDir];
    offX = (target.x - base.x) * diveT;
    offY = (target.y - base.y) * diveT * 0.6;
  }
  ctx.save();
  ctx.translate(base.x + offX, base.y - 30 + offY);
  ctx.rotate(divDir ? diveT * (divDir.includes("Left") ? -1 : divDir.includes("Right") ? 1 : 0) * 0.9 : 0);
  ctx.fillStyle = "#16a34a";
  ctx.beginPath();
  ctx.roundRect(-10, -16, 20, 26, 6);
  ctx.fill();
  ctx.fillStyle = "#fcd9b8";
  ctx.beginPath();
  ctx.arc(0, -22, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTargetZones(
  ctx: CanvasRenderingContext2D,
  highlight: ShootDir | null,
  pulseT: number,
) {
  for (const key of Object.keys(ZONE_POS) as ShootDir[]) {
    const p = ZONE_POS[key];
    const isHi = highlight === key;
    ctx.save();
    ctx.globalAlpha = isHi ? 0.55 + Math.sin(pulseT * 10) * 0.25 : 0.18;
    ctx.fillStyle = isHi ? "#facc15" : "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, isHi ? 22 : 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(9, 0);
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 9);
  ctx.stroke();
  ctx.restore();
}

export function zonePosition(dir: ShootDir) {
  return ZONE_POS[dir];
}

export function drawDefenderDuel(
  ctx: CanvasRenderingContext2D,
  promptDir: SwipeDir | null,
  windowT: number,
  resolved: "success" | "fail" | null,
) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H * 0.56;

  // defender
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#1e3a8a";
  ctx.beginPath();
  ctx.roundRect(-16, -40, 32, 40, 8);
  ctx.fill();
  ctx.fillStyle = "#fcd9b8";
  ctx.beginPath();
  ctx.arc(0, -50, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (promptDir && !resolved) {
    const arrow = promptDir === "left" ? "⬅️" : "➡️";
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(windowT * 20) * 0.3;
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(arrow, cx, cy - 90);
    ctx.restore();

    // countdown ring
    ctx.save();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy - 90, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * windowT);
    ctx.stroke();
    ctx.restore();
  }

  if (resolved === "success") {
    ctx.save();
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("💨", cx, cy - 90);
    ctx.restore();
  } else if (resolved === "fail") {
    ctx.save();
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("😵", cx, cy - 90);
    ctx.restore();
  }
}

export function outcomeLabel(state: BreakawayState["shoot"]["outcome"]): string {
  switch (state) {
    case "goal":
      return "GOAL!";
    case "greatGoal":
      return "GREAT GOAL!";
    case "topCornerGoal":
      return "TOP CORNER!!";
    case "saved":
      return "SAVED";
    case "miss":
      return "MISS";
    default:
      return "";
  }
}
