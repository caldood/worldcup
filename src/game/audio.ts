// Lightweight synthesized SFX so the game has audio feedback without shipping audio assets.

// Cheerful four-chord vamp (C - G - Am - F), each entry is [bass note, triad...] in Hz.
const MUSIC_CHORDS: number[][] = [
  [130.81, 130.81, 164.81, 196.0], // C major
  [98.0, 98.0, 123.47, 146.83], // G major
  [110.0, 110.0, 130.81, 164.81], // A minor
  [87.31, 87.31, 110.0, 130.81], // F major
];

class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  private musicPlaying = false;
  private musicChordIndex = 0;
  private musicTimer: number | null = null;

  private crowdNoise: AudioBufferSourceNode | null = null;

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
    if (m) {
      this.stopMusic();
      this.stopCrowdAmbience();
    }
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

  trophy() {
    this.tone(784, 0.12, "triangle", 0.14);
    this.tone(988, 0.12, "triangle", 0.14, 0.08);
    this.tone(1318, 0.2, "triangle", 0.16, 0.16);
  }

  miss() {
    this.tone(300, 0.3, "sawtooth", 0.15);
    this.tone(180, 0.4, "sawtooth", 0.12, 0.1);
  }

  // Crowd cheer swell. intensity scales duration/volume: 0.5 for a routine goal, 1 for a big moment.
  crowdRoar(intensity = 1) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const duration = 0.7 + intensity * 0.8;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const rise = Math.min(1, (i / bufferSize) * 6);
      data[i] = (Math.random() * 2 - 1) * rise * Math.exp(-i / (bufferSize * 0.8));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.15 + 0.2 * intensity;
    noise.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    noise.start();
  }

  // Continuous low stadium murmur — meant to run for the whole match.
  startCrowdAmbience() {
    if (this.crowdNoise) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 650;
    filter.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    noise.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    noise.start();
    this.crowdNoise = noise;
  }

  stopCrowdAmbience() {
    if (!this.crowdNoise) return;
    try {
      this.crowdNoise.stop();
    } catch {
      // already stopped
    }
    this.crowdNoise.disconnect();
    this.crowdNoise = null;
  }

  // Procedurally looped background music — a soft chord vamp under the SFX.
  startMusic() {
    if (this.musicPlaying) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.musicPlaying = true;
    this.musicChordIndex = 0;
    this.playMusicStep();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playMusicStep() {
    if (!this.musicPlaying) return;
    const ctx = this.ensureCtx();
    if (!ctx) {
      this.musicPlaying = false;
      return;
    }
    const [bass, ...triad] = MUSIC_CHORDS[this.musicChordIndex % MUSIC_CHORDS.length];
    const beat = 0.5;
    for (let b = 0; b < 4; b++) {
      this.tone(bass, beat * 0.55, "triangle", 0.05, b * beat);
    }
    for (const f of triad) {
      this.tone(f, beat * 4 * 0.95, "sine", 0.022, 0);
    }
    this.musicChordIndex++;
    this.musicTimer = window.setTimeout(() => this.playMusicStep(), beat * 4 * 1000);
  }
}

export const audio = new AudioManager();
