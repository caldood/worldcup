import { CANVAS_H, CANVAS_W } from "../constants";
import type { BreakawayState } from "../breakawayState";
import type { ShootDir, SwipeDir } from "../types";
import { HORIZON_Y } from "./perspective";

const ZONE_POS: Record<ShootDir, { x: number; y: number }> = {
  left: { x: CANVAS_W * 0.22, y: HORIZON_Y + 60 },
  center: { x: CANVAS_W * 0.5, y: HORIZON_Y + 60 },
  right: { x: CANVAS_W * 0.78, y: HORIZON_Y + 60 },
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
  ctx.rotate(divDir ? diveT * (divDir === "left" ? -1 : divDir === "right" ? 1 : 0) * 0.9 : 0);
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

// Glyph for the swipe gesture that aims at each zone — matches SwipeInput's
// classify3() exactly (swipe left -> left, swipe right -> right, tap -> center)
// so the on-screen hint is literally the gesture the player needs to make.
const ZONE_GLYPH: Record<ShootDir, string> = {
  left: "⬅",
  center: "●",
  right: "➡",
};

export function drawTargetZones(
  ctx: CanvasRenderingContext2D,
  highlight: ShootDir | null,
  pulseT: number,
) {
  for (const key of Object.keys(ZONE_POS) as ShootDir[]) {
    const p = ZONE_POS[key];
    const isHi = highlight === key;
    const r = isHi ? 24 : 18;
    ctx.save();
    ctx.globalAlpha = isHi ? 0.6 + Math.sin(pulseT * 10) * 0.25 : 0.4;
    ctx.fillStyle = isHi ? "#facc15" : "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isHi ? "#facc15" : "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // gesture glyph so the zone itself teaches the swipe needed to hit it
    ctx.save();
    ctx.globalAlpha = isHi ? 1 : 0.9;
    ctx.fillStyle = isHi ? "#111827" : "#ffffff";
    ctx.font = `bold ${isHi ? 22 : 16}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ZONE_GLYPH[key], p.x, p.y);
    ctx.restore();
  }
}

// Persistent top banner explaining the current prompt — unlike floating
// particle text this doesn't drift or fade, so it stays legible the whole
// time a phase is waiting on input.
export function drawInstructionBanner(ctx: CanvasRenderingContext2D, title: string, sub: string) {
  const w = CANVAS_W * 0.88;
  const cx = CANVAS_W / 2;
  const y = 96;
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - 24, w, 48, 14);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 19px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, cx, y - 5);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "13px sans-serif";
  ctx.fillText(sub, cx, y + 15);
  ctx.restore();
}

// Shrinking bar showing how much time is left to react — so the countdown
// is legible without staring at a single small ring.
export function drawCountdownBar(ctx: CanvasRenderingContext2D, progress: number) {
  const w = CANVAS_W * 0.6;
  const x = CANVAS_W / 2 - w / 2;
  const y = 132;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, 7, 4);
  ctx.fill();
  ctx.fillStyle = progress < 0.3 ? "#ef4444" : "#facc15";
  ctx.beginPath();
  ctx.roundRect(x, y, w * Math.max(0, progress), 7, 4);
  ctx.fill();
  ctx.restore();
}

export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const r = 9;

  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 1;
  ctx.stroke();

  // classic pentagon-and-seams pattern so it reads as an actual soccer ball
  // rather than a plain dot
  const pentagon = (cx: number, cy: number, pr: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      const px = cx + Math.cos(angle) * pr;
      const py = cy + Math.sin(angle) * pr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  ctx.fillStyle = "#1f2937";
  const pr = r * 0.4;
  pentagon(0, 0, pr);
  ctx.fill();

  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * pr, Math.sin(angle) * pr);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.stroke();
  }
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

  // dodge-lane indicators: same "lit zone = swipe here" language as the
  // shoot-phase target zones, so both halves of the minigame teach the same
  // mechanic — the side that matches the prompt glows, the other stays dim.
  if (promptDir && !resolved) {
    for (const side of ["left", "right"] as const) {
      const isHi = side === promptDir;
      const sx = side === "left" ? cx - 110 : cx + 110;
      ctx.save();
      ctx.globalAlpha = isHi ? 0.55 + Math.sin(windowT * 20) * 0.25 : 0.15;
      ctx.fillStyle = isHi ? "#facc15" : "#ffffff";
      ctx.beginPath();
      ctx.roundRect(sx - 26, cy - 70, 52, 110, 16);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = isHi ? 1 : 0.35;
      ctx.font = "30px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(side === "left" ? "⬅️" : "➡️", sx, cy - 15);
      ctx.restore();
    }
  }

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
