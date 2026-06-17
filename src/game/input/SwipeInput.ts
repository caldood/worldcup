import { SWIPE_MAX_TIME, SWIPE_MIN_DISTANCE } from "../constants";
import type { ShootDir, SwipeDir } from "../types";

export type SwipeMode = "fourWay" | "fiveWay";

interface PointerState {
  x: number;
  y: number;
  t: number;
}

export class SwipeInput {
  private el: HTMLElement;
  private start: PointerState | null = null;
  private mode: SwipeMode = "fourWay";
  onSwipe4: ((dir: SwipeDir) => void) | null = null;
  onSwipe5: ((dir: ShootDir, dx: number, dy: number) => void) | null = null;
  onTap: (() => void) | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.el.addEventListener("touchstart", this.handleStart, { passive: true });
    this.el.addEventListener("touchend", this.handleEnd, { passive: true });
    this.el.addEventListener("touchcancel", this.handleCancel, { passive: true });
    // Mouse fallback for desktop testing
    this.el.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
  }

  setMode(mode: SwipeMode) {
    this.mode = mode;
  }

  destroy() {
    this.el.removeEventListener("touchstart", this.handleStart);
    this.el.removeEventListener("touchend", this.handleEnd);
    this.el.removeEventListener("touchcancel", this.handleCancel);
    this.el.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
  }

  private handleStart = (e: TouchEvent) => {
    const t = e.touches[0];
    this.start = { x: t.clientX, y: t.clientY, t: performance.now() };
  };

  private handleEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    this.resolve(t.clientX, t.clientY);
  };

  private handleCancel = () => {
    this.start = null;
  };

  private mouseStart: PointerState | null = null;
  private handleMouseDown = (e: MouseEvent) => {
    this.mouseStart = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  private handleMouseUp = (e: MouseEvent) => {
    if (!this.mouseStart) return;
    this.start = this.mouseStart;
    this.mouseStart = null;
    this.resolve(e.clientX, e.clientY);
  };

  private resolve(endX: number, endY: number) {
    if (!this.start) return;
    const dx = endX - this.start.x;
    const dy = endY - this.start.y;
    const dt = performance.now() - this.start.t;
    const dist = Math.hypot(dx, dy);
    this.start = null;

    if (dt > SWIPE_MAX_TIME * 3) return;

    if (dist < SWIPE_MIN_DISTANCE) {
      this.onTap?.();
      return;
    }

    if (this.mode === "fourWay") {
      this.onSwipe4?.(this.classify4(dx, dy));
    } else {
      this.onSwipe5?.(this.classify5(dx, dy), dx, dy);
    }
  }

  private classify4(dx: number, dy: number): SwipeDir {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    }
    return dy > 0 ? "down" : "up";
  }

  private classify5(dx: number, dy: number): ShootDir {
    const dist = Math.hypot(dx, dy);
    if (dist < SWIPE_MIN_DISTANCE * 1.4) return "center";
    if (dy < 0) {
      return dx >= 0 ? "topRight" : "topLeft";
    }
    return dx >= 0 ? "bottomRight" : "bottomLeft";
  }
}
