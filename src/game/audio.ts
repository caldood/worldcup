// Lightweight synthesized SFX so the game has audio feedback without shipping audio assets.
class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
  }

  private tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15, delay = 0) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    const t0 = ctx.currentTime + delay;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  coin() {
    this.tone(1100, 0.08, "sine", 0.12);
    this.tone(1500, 0.08, "sine", 0.08, 0.05);
  }

  alpha() {
    this.tone(900, 0.1, "triangle", 0.14);
    this.tone(1300, 0.12, "triangle", 0.12, 0.06);
    this.tone(1800, 0.14, "triangle", 0.1, 0.12);
  }

  hit() {
    this.tone(120, 0.25, "sawtooth", 0.2);
  }

  jump() {
    this.tone(440, 0.12, "square", 0.08);
  }

  whistle() {
    this.tone(2200, 0.18, "square", 0.1);
    this.tone(2200, 0.18, "square", 0.1, 0.22);
  }

  powerup() {
    this.tone(600, 0.1, "sine", 0.12);
    this.tone(900, 0.1, "sine", 0.12, 0.08);
    this.tone(1200, 0.14, "sine", 0.12, 0.16);
  }

  goal(big: boolean) {
    const notes = big ? [660, 880, 1100, 1320, 1760] : [523, 659, 784];
    notes.forEach((f, i) => this.tone(f, 0.22, "triangle", 0.16, i * 0.09));
  }

  miss() {
    this.tone(300, 0.3, "sawtooth", 0.15);
    this.tone(180, 0.4, "sawtooth", 0.12, 0.1);
  }

  crowdRoar() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 1.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    noise.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    noise.start();
  }
}

export const audio = new AudioManager();
