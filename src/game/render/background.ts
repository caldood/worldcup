import { CANVAS_H, CANVAS_W, FLAGS, GROUND_Y, LANE_X } from "../constants";
import { HORIZON_Y } from "./perspective";

interface CrowdDot {
  x: number;
  y: number;
  color: string;
  flagChance: number;
}

const CROWD_COLORS = ["#1e3a8a", "#7f1d1d", "#065f46", "#fef3c7", "#fbbf24", "#f8fafc", "#1f2937"];

let crowdDots: CrowdDot[] | null = null;
function getCrowdDots(): CrowdDot[] {
  if (crowdDots) return crowdDots;
  crowdDots = [];
  const rows = 9;
  for (let r = 0; r < rows; r++) {
    const y = r * 7 + 4;
    const cols = 60;
    for (let c = 0; c < cols; c++) {
      crowdDots.push({
        x: (c / cols) * CANVAS_W + (r % 2 === 0 ? 3 : 0),
        y,
        color: CROWD_COLORS[Math.floor(Math.random() * CROWD_COLORS.length)],
        flagChance: Math.random(),
      });
    }
  }
  return crowdDots;
}

export function drawStadiumBackground(ctx: CanvasRenderingContext2D, t: number, flash: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
  sky.addColorStop(0, "#3fa9f5");
  sky.addColorStop(1, "#bfe3ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y + 40);

  // floodlight glow flicker
  ctx.save();
  ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.05;
  const glow = ctx.createRadialGradient(CANVAS_W * 0.15, 10, 5, CANVAS_W * 0.15, 10, 90);
  glow.addColorStop(0, "rgba(255,255,230,0.9)");
  glow.addColorStop(1, "rgba(255,255,230,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y);
  const glow2 = ctx.createRadialGradient(CANVAS_W * 0.85, 10, 5, CANVAS_W * 0.85, 10, 90);
  glow2.addColorStop(0, "rgba(255,255,230,0.9)");
  glow2.addColorStop(1, "rgba(255,255,230,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y);
  ctx.restore();

  // crowd stand
  const standH = 78;
  ctx.save();
  ctx.translate(0, HORIZON_Y - standH + 14);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, CANVAS_W, standH);
  const dots = getCrowdDots();
  for (const d of dots) {
    ctx.fillStyle = d.color;
    ctx.fillRect(d.x, d.y, 4, 4);
  }
  // flags dotted among crowd
  for (let i = 0; i < 6; i++) {
    const fx = (i / 6) * CANVAS_W + 10 + Math.sin(t * 1.3 + i) * 4;
    const fy = 8 + (i % 3) * 12;
    ctx.font = "10px sans-serif";
    ctx.fillText(FLAGS[(i * 3) % FLAGS.length], fx, fy + 8);
  }
  ctx.restore();

  // pitch
  const pitch = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
  pitch.addColorStop(0, "#1f8a3c");
  pitch.addColorStop(1, "#0e6b2a");
  ctx.fillStyle = pitch;
  ctx.fillRect(0, HORIZON_Y, CANVAS_W, CANVAS_H - HORIZON_Y);

  // mowed stripes (converging toward vanishing point)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, HORIZON_Y, CANVAS_W, CANVAS_H - HORIZON_Y);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  const stripeCount = 7;
  for (let i = 0; i < stripeCount; i++) {
    if (i % 2 === 0) continue;
    const farL = (i / stripeCount) * CANVAS_W;
    const farR = ((i + 1) / stripeCount) * CANVAS_W;
    const vx = CANVAS_W / 2;
    ctx.beginPath();
    ctx.moveTo(vx + (farL - vx) * 0.05, HORIZON_Y);
    ctx.lineTo(vx + (farR - vx) * 0.05, HORIZON_Y);
    ctx.lineTo(farR, CANVAS_H);
    ctx.lineTo(farL, CANVAS_H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // lane guide lines (subtle white)
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  const vx = CANVAS_W / 2;
  for (const lx of LANE_X) {
    ctx.beginPath();
    ctx.moveTo(vx + (lx - vx) * 0.04, HORIZON_Y);
    ctx.lineTo(lx, GROUND_Y + 40);
    ctx.stroke();
  }
  ctx.restore();

  if (flash > 0) {
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}
