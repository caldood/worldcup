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

function drawClouds(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const clouds = [
    { speed: 4, y: HORIZON_Y * 0.3, scale: 1, offset: 0 },
    { speed: 2.6, y: HORIZON_Y * 0.55, scale: 0.7, offset: 0.4 },
    { speed: 3.4, y: HORIZON_Y * 0.15, scale: 0.85, offset: 0.75 },
  ];
  for (const c of clouds) {
    const span = CANVAS_W + 140;
    const x = (((t * c.speed + c.offset * span) % span) + span) % span - 70;
    ctx.beginPath();
    ctx.ellipse(x, c.y, 26 * c.scale, 12 * c.scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 18 * c.scale, c.y - 5 * c.scale, 18 * c.scale, 10 * c.scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 18 * c.scale, c.y - 3 * c.scale, 16 * c.scale, 9 * c.scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const vignette = ctx.createRadialGradient(
    CANVAS_W / 2,
    CANVAS_H * 0.45,
    CANVAS_H * 0.35,
    CANVAS_W / 2,
    CANVAS_H * 0.45,
    CANVAS_H * 0.75,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

// Horizontal yard-line bands sweeping toward the camera to sell a sense of forward speed.
function drawSpeedLines(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, HORIZON_Y, CANVAS_W, CANVAS_H - HORIZON_Y);
  ctx.clip();
  const vx = CANVAS_W / 2;
  const lineCount = 6;
  const speed = 0.5;
  for (let i = 0; i < lineCount; i++) {
    const p = ((i / lineCount + t * speed) % 1 + 1) % 1;
    const depth = p * p;
    const y = HORIZON_Y + (CANVAS_H - HORIZON_Y) * depth;
    const halfWidth = (CANVAS_W * 0.55) * depth;
    ctx.globalAlpha = 0.18 * depth;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1 + depth * 2;
    ctx.beginPath();
    ctx.moveTo(vx - halfWidth, y);
    ctx.lineTo(vx + halfWidth, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStadiumBackground(ctx: CanvasRenderingContext2D, t: number, flash: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
  sky.addColorStop(0, "#3fa9f5");
  sky.addColorStop(1, "#bfe3ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y + 40);

  drawClouds(ctx, t);

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

  drawSpeedLines(ctx, t);

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
