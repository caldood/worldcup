import { GROUND_Y, JUMP_DURATION, LANE_CHANGE_DURATION, LANE_X, SLIDE_DURATION } from "./constants";

export type PlayerAnim = "run" | "jump" | "slide" | "stumble" | "idle" | "celebrate";

export class Player {
  lane: 0 | 1 | 2 = 1;
  laneFrom: 0 | 1 | 2 = 1;
  laneChangeT = 1; // 1 = settled
  jumpT = 0; // 0..1 progress, 0 = grounded
  isJumping = false;
  slideT = 0;
  isSliding = false;
  stumbleT = 0;
  invulnT = 0;
  bob = 0;
  anim: PlayerAnim = "run";

  get x(): number {
    if (this.laneChangeT >= 1) return LANE_X[this.lane];
    const from = LANE_X[this.laneFrom];
    const to = LANE_X[this.lane];
    const t = this.easeOutCubic(this.laneChangeT);
    return from + (to - from) * t;
  }

  get y(): number {
    let y = GROUND_Y;
    if (this.isJumping) {
      const t = this.jumpT;
      const arc = Math.sin(Math.PI * Math.min(t, 1));
      y -= arc * 130;
    }
    return y;
  }

  get scaleY(): number {
    if (this.isSliding) return 0.55;
    return 1;
  }

  private easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  changeLane(dir: "left" | "right") {
    const next = dir === "left" ? this.lane - 1 : this.lane + 1;
    if (next < 0 || next > 2) return;
    this.laneFrom = this.lane;
    this.lane = next as 0 | 1 | 2;
    this.laneChangeT = 0;
  }

  jump() {
    if (this.isJumping || this.isSliding) return;
    this.isJumping = true;
    this.jumpT = 0;
  }

  slide() {
    if (this.isSliding || this.isJumping) return;
    this.isSliding = true;
    this.slideT = 0;
  }

  stumble() {
    this.stumbleT = 0.5;
    this.invulnT = 1.0;
  }

  update(dt: number, speedMul: number) {
    if (this.laneChangeT < 1) {
      this.laneChangeT = Math.min(1, this.laneChangeT + dt / LANE_CHANGE_DURATION);
    }
    if (this.isJumping) {
      this.jumpT += dt / JUMP_DURATION;
      if (this.jumpT >= 1) {
        this.isJumping = false;
        this.jumpT = 0;
      }
    }
    if (this.isSliding) {
      this.slideT += dt / SLIDE_DURATION;
      if (this.slideT >= 1) {
        this.isSliding = false;
        this.slideT = 0;
      }
    }
    if (this.stumbleT > 0) this.stumbleT = Math.max(0, this.stumbleT - dt);
    if (this.invulnT > 0) this.invulnT = Math.max(0, this.invulnT - dt);

    this.bob += dt * 10 * speedMul;

    if (this.stumbleT > 0) this.anim = "stumble";
    else if (this.isJumping) this.anim = "jump";
    else if (this.isSliding) this.anim = "slide";
    else this.anim = "run";
  }

  reset() {
    this.lane = 1;
    this.laneFrom = 1;
    this.laneChangeT = 1;
    this.jumpT = 0;
    this.isJumping = false;
    this.slideT = 0;
    this.isSliding = false;
    this.stumbleT = 0;
    this.invulnT = 0;
    this.bob = 0;
    this.anim = "run";
  }
}
