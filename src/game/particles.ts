export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  kind: "confetti" | "spark" | "ring";
  rot: number;
  vrot: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

const CONFETTI_COLORS = ["#FFD700", "#FF4040", "#34D399", "#60A5FA", "#FFFFFF", "#FBBF24"];

export class ParticleSystem {
  particles: Particle[] = [];
  texts: FloatingText[] = [];

  burstConfetti(x: number, y: number, count = 60) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 260;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 180,
        life: 1.4 + Math.random() * 0.8,
        maxLife: 1.4 + Math.random() * 0.8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 5,
        kind: "confetti",
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 12,
      });
    }
  }

  burstSparks(x: number, y: number, color: string, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.4 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3,
        kind: "spark",
        rot: 0,
        vrot: 0,
      });
    }
  }

  ring(x: number, y: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.5,
      maxLife: 0.5,
      color,
      size: 4,
      kind: "ring",
      rot: 0,
      vrot: 0,
    });
  }

  addText(x: number, y: number, text: string, color = "#fff", size = 22) {
    this.texts.push({ x, y, vy: -40, text, color, life: 1.1, maxLife: 1.1, size });
  }

  update(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      p.rot += p.vrot * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const t of this.texts) {
      t.y += t.vy * dt;
      t.vy *= 0.96;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === "confetti") {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.kind === "spark") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "ring") {
        const t = 1 - p.life / p.maxLife;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 10 + t * 50, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const t of this.texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px 'Arial Black', sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
    this.texts = [];
  }
}
