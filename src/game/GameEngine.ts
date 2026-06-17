import { audio } from "./audio";
import { freshBreakawayState, type BreakawayState } from "./breakawayState";
import {
  BREAKAWAY_MAX_DISTANCE,
  BREAKAWAY_MIN_DISTANCE,
  CANVAS_H,
  CANVAS_W,
  DESPAWN_Z,
  MAX_RUN_SPEED,
  POWER_UP_DURATIONS,
  SPEED_PER_STAGE,
  SPEED_RAMP_PER_METER,
} from "./constants";
import { SwipeInput } from "./input/SwipeInput";
import { ParticleSystem } from "./particles";
import { Player } from "./player";
import { drawStadiumBackground, drawVignette } from "./render/background";
import {
  drawBall,
  drawCountdownBar,
  drawDefenderDuel,
  drawGoalFrame,
  drawInstructionBanner,
  drawKeeper,
  drawTargetZones,
  outcomeLabel,
  zonePosition,
} from "./render/breakaway";
import { LOW_OBSTACLES, OVERHEAD_OBSTACLES } from "./render/icons";
import { HORIZON_Y, laneScreenX } from "./render/perspective";
import { drawEntities, drawPlayer } from "./render/runner";
import { Spawner } from "./spawner";
import { loadState, saveState } from "./storage";
import { getStage, getStageTarget, isFinalStage } from "./tournament";
import { checkNewAchievements } from "./achievements";
import type {
  AchievementDef,
  GamePhase,
  ObstacleKind,
  PersistedState,
  PowerUpKind,
  RunnerEntity,
  ShootDir,
  ShotOutcome,
} from "./types";

const METERS_PER_PX = 0.12;

export interface HudData {
  phase: GamePhase;
  score: number;
  capital: number;
  multiplier: number;
  momentumPct: number;
  distance: number;
  stageName: string;
  stageTarget: number;
  lives: number;
  activePowerUps: { kind: PowerUpKind; pct: number }[];
  matchWonToast: string | null;
}

export interface MatchResult {
  score: number;
  capital: number;
  alpha: number;
  distance: number;
  goals: number;
  topCorners: number;
  trophies: number;
  isNewBest: boolean;
  wonMatch: boolean;
  stageName: string;
}

export interface EngineListeners {
  onHud?: (d: HudData) => void;
  onPhase?: (p: GamePhase) => void;
  onAchievement?: (a: AchievementDef) => void;
  onShotResult?: (o: ShotOutcome) => void;
  onMatchResult?: (r: MatchResult) => void;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private swipe: SwipeInput;
  private rafId = 0;
  private lastT = 0;
  private listeners: EngineListeners = {};
  private hudTimer = 0;

  phase: GamePhase = "menu";
  persisted: PersistedState = loadState();

  player = new Player();
  spawner = new Spawner();
  particles = new ParticleSystem();
  entities: RunnerEntity[] = [];

  distance = 0;
  runSpeed = 230;
  stageIndexAtStart = 0;
  cyclesCompleted = 0;

  score = 0;
  capital = 0;
  alpha = 0;
  goalsThisRun = 0;
  topCornersThisRun = 0;
  trophiesThisRun = 0;
  multiplier = 1;
  momentumStreak = 0;
  lives = 3;
  distanceSinceCorrection = 0;
  hadCorrectionThisRun = false;

  activePowerUps: Partial<Record<PowerUpKind, number>> = {};
  shieldCharge = false;

  screenFlash = 0;
  cameraZoom = 1;
  nextBreakawayAt = 600;
  breakaway: BreakawayState = freshBreakawayState();
  defenderPenalty = 0;
  matchWonToast: string | null = null;
  paused = false;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.swipe = new SwipeInput(canvas);
    this.swipe.onSwipe4 = (dir) => this.handleSwipe4(dir);
    this.swipe.onSwipe3 = (dir) => this.handleSwipe3(dir);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  setListeners(l: EngineListeners) {
    this.listeners = l;
  }

  private handleVisibility = () => {
    this.paused = document.hidden;
    if (!document.hidden) this.lastT = performance.now();
  };

  startRun() {
    this.player.reset();
    this.spawner.reset();
    this.entities = [];
    this.particles.clear();
    this.distance = 0;
    this.stageIndexAtStart = this.persisted.stageIndex;
    const stage = getStage(this.stageIndexAtStart);
    this.runSpeed = 230 * stage.speedMul;
    this.cyclesCompleted = 0;
    this.score = 0;
    this.capital = 0;
    this.alpha = 0;
    this.goalsThisRun = 0;
    this.topCornersThisRun = 0;
    this.trophiesThisRun = 0;
    this.multiplier = 1;
    this.momentumStreak = 0;
    this.lives = 3;
    this.distanceSinceCorrection = 0;
    this.hadCorrectionThisRun = false;
    this.activePowerUps = {};
    this.shieldCharge = false;
    this.screenFlash = 0;
    this.cameraZoom = 1;
    this.nextBreakawayAt = BREAKAWAY_MIN_DISTANCE + Math.random() * (BREAKAWAY_MAX_DISTANCE - BREAKAWAY_MIN_DISTANCE);
    this.matchWonToast = null;
    audio.startMusic();
    audio.startCrowdAmbience();
    this.setPhase("runner");
    this.swipe.setMode("fourWay");
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.swipe.destroy();
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  run() {
    this.lastT = performance.now();
    const loop = (t: number) => {
      this.rafId = requestAnimationFrame(loop);
      const rawDt = (t - this.lastT) / 1000;
      this.lastT = t;
      if (this.paused) return;
      const dt = Math.min(rawDt, 1 / 20);
      this.update(dt);
      this.render(t / 1000);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private setPhase(p: GamePhase) {
    this.phase = p;
    this.listeners.onPhase?.(p);
  }

  // ---------------- INPUT ----------------

  private handleSwipe4(dir: "left" | "right" | "up" | "down") {
    if (this.phase === "runner") {
      if (dir === "left" || dir === "right") this.player.changeLane(dir);
      else if (dir === "up") {
        this.player.jump();
        audio.jump();
      } else if (dir === "down") {
        this.player.slide();
      }
    } else if (this.phase === "breakawayBeat") {
      this.resolveBeatAttempt(dir === "left" ? "left" : dir === "right" ? "right" : null);
    }
  }

  private handleSwipe3(dir: ShootDir) {
    if (this.phase === "breakawayShoot" && !this.breakaway.shoot.chosenDir) {
      this.resolveShot(dir);
    }
  }

  // ---------------- UPDATE ----------------

  private update(dt: number) {
    this.particles.update(dt);
    if (this.screenFlash > 0) this.screenFlash = Math.max(0, this.screenFlash - dt * 2.2);

    if (this.phase === "runner") this.updateRunner(dt);
    else if (this.phase.startsWith("breakaway")) this.updateBreakaway(dt);

    this.emitHud(dt);
  }

  private updateRunner(dt: number) {
    const stage = getStage(this.stageIndexAtStart);
    const rampSpeed = Math.min(
      MAX_RUN_SPEED,
      230 * stage.speedMul + this.distance * SPEED_RAMP_PER_METER + this.cyclesCompleted * SPEED_PER_STAGE,
    );
    this.runSpeed = rampSpeed;

    this.player.update(dt, this.runSpeed / 230);

    for (const kind of Object.keys(this.activePowerUps) as PowerUpKind[]) {
      const left = (this.activePowerUps[kind] ?? 0) - dt;
      if (left <= 0) delete this.activePowerUps[kind];
      else this.activePowerUps[kind] = left;
    }

    const moveSpeed = this.activePowerUps.rocketBoots ? this.runSpeed * 1.5 : this.runSpeed;
    const distDeltaPx = moveSpeed * dt;
    this.distance += distDeltaPx * METERS_PER_PX;
    this.distanceSinceCorrection += distDeltaPx * METERS_PER_PX;

    const spawned = this.spawner.maybeSpawn(distDeltaPx * METERS_PER_PX, stage.obstacleDensity);
    if (spawned.length) this.entities.push(...spawned);

    const magnetActive = !!this.activePowerUps.goldenMagnet;
    const dashing = !!this.activePowerUps.rocketBoots;

    for (const e of this.entities) {
      e.z -= distDeltaPx;
      if (e.hit) continue;

      const closeEnough = e.z < 46 && e.z > -20;
      const sameLane = e.lane === this.player.lane;
      const collectAnyLane = e.type === "collectible" && magnetActive && e.z < 80 && e.z > -20;

      if (!closeEnough && !collectAnyLane) continue;
      if (!sameLane && !collectAnyLane) continue;

      if (e.type === "collectible") {
        e.hit = true;
        if (e.kind === "capital") this.collectCapital();
        else if (e.kind === "alpha") this.collectAlpha();
        else if (e.kind === "jersey") this.collectJersey();
        else if (e.kind === "ball") this.collectBall();
        else this.collectTrophy();
      } else if (e.type === "powerup") {
        e.hit = true;
        this.activatePowerUp(e.kind as PowerUpKind);
      } else if (e.type === "obstacle") {
        if (dashing) {
          e.hit = true;
          continue;
        }
        const avoided =
          (this.player.isJumping && LOW_OBSTACLES.includes(e.kind as ObstacleKind)) ||
          (this.player.isSliding && OVERHEAD_OBSTACLES.includes(e.kind as ObstacleKind));
        if (avoided) {
          e.hit = true;
          this.score += 5;
        } else if (this.player.invulnT <= 0) {
          e.hit = true;
          this.handleObstacleHit();
        }
      }
    }
    this.entities = this.entities.filter((e) => e.z > DESPAWN_Z);

    if (this.distance >= this.nextBreakawayAt) {
      this.enterBreakaway();
    }

    const target = getStageTarget(this.stageIndexAtStart);
    if (!this.matchWonToast && this.distance >= target) {
      this.handleMatchTargetReached();
    }
  }

  private handleObstacleHit() {
    if (this.shieldCharge) {
      this.shieldCharge = false;
      delete this.activePowerUps.varShield;
      this.particles.burstSparks(this.player.x, this.player.y - 30, "#60a5fa", 18);
      this.particles.addText(this.player.x, this.player.y - 70, "SHIELD BLOCKED!", "#60a5fa", 18);
      return;
    }
    audio.hit();
    this.player.stumble();
    this.lives -= 1;
    this.multiplier = 1;
    this.momentumStreak = 0;
    this.screenFlash = 1;
    this.persisted.correctionsTaken += 1;
    this.hadCorrectionThisRun = true;
    this.persisted.runsWithoutCorrection = Math.max(this.persisted.runsWithoutCorrection, this.distanceSinceCorrection);
    this.distanceSinceCorrection = 0;
    this.particles.addText(this.player.x, this.player.y - 70, "MARKET CORRECTION", "#ef4444", 16);
    saveState(this.persisted);
    if (this.lives <= 0) this.gameOver();
  }

  private collectCapital() {
    audio.coin();
    const base = 10;
    const mult = this.activePowerUps.hatTrick ? 3 : 1;
    this.capital += base;
    this.score += base * this.multiplier * mult;
    this.persisted.totalCapital += base;
    this.momentumStreak += 1;
    if (this.momentumStreak % 8 === 0) {
      this.multiplier = Math.min(10, this.multiplier + 0.5);
      this.particles.addText(this.player.x, this.player.y - 80, `BULL MARKET x${this.multiplier.toFixed(1)}`, "#facc15", 16);
    }
  }

  private collectAlpha() {
    audio.alpha();
    this.alpha += 1;
    this.persisted.totalAlpha += 1;
    const mult = this.activePowerUps.hatTrick ? 3 : 1;
    this.score += 100 * this.multiplier * mult;
    this.capital += 25;
    this.particles.burstSparks(this.player.x, this.player.y - 40, "#a78bfa", 16);
    this.particles.addText(this.player.x, this.player.y - 80, "+ALPHA", "#a78bfa", 16);
  }

  private collectJersey() {
    audio.coin();
    const base = 30;
    const mult = this.activePowerUps.hatTrick ? 3 : 1;
    this.capital += base;
    this.score += base * this.multiplier * mult;
    this.persisted.totalCapital += base;
    this.particles.burstSparks(this.player.x, this.player.y - 40, "#fbbf24", 14);
    this.particles.addText(this.player.x, this.player.y - 80, "+JERSEY", "#fbbf24", 16);
  }

  private collectBall() {
    audio.coin();
    const base = 15;
    const mult = this.activePowerUps.hatTrick ? 3 : 1;
    this.capital += base;
    this.score += base * this.multiplier * mult;
    this.persisted.totalCapital += base;
    this.particles.burstSparks(this.player.x, this.player.y - 40, "#4ade80", 12);
    this.particles.addText(this.player.x, this.player.y - 80, "+BALL", "#4ade80", 14);
  }

  private collectTrophy() {
    audio.trophy();
    this.trophiesThisRun += 1;
    this.persisted.totalTrophies += 1;
    const mult = this.activePowerUps.hatTrick ? 3 : 1;
    this.score += 250 * this.multiplier * mult;
    this.capital += 50;
    this.particles.burstConfetti(this.player.x, this.player.y - 40, 24);
    this.particles.addText(this.player.x, this.player.y - 80, "+TROPHY", "#facc15", 18);
  }

  private activatePowerUp(kind: PowerUpKind) {
    audio.powerup();
    this.activePowerUps[kind] = POWER_UP_DURATIONS[kind];
    if (kind === "varShield") this.shieldCharge = true;
    this.particles.addText(this.player.x, this.player.y - 80, POWERUP_TOAST[kind], "#34d399", 15);
  }

  private handleMatchTargetReached() {
    const stage = getStage(this.stageIndexAtStart);
    this.persisted.matchesWon += 1;
    if (!isFinalStage(this.stageIndexAtStart)) {
      this.persisted.stageIndex = Math.max(this.persisted.stageIndex, this.stageIndexAtStart + 1);
      const next = getStage(this.stageIndexAtStart + 1);
      this.matchWonToast = `MATCH WON! Advancing to ${next.name}`;
    } else {
      this.matchWonToast = "WORLD CHAMPION FORM! Keep going for glory.";
    }
    audio.crowdRoar(1);
    saveState(this.persisted);
    this.particles.addText(CANVAS_W / 2, CANVAS_H * 0.3, "MATCH WON!", "#facc15", 26);
    void stage;
  }

  // ---------------- BREAKAWAY ----------------

  private enterBreakaway() {
    audio.whistle();
    this.nextBreakawayAt = this.distance + BREAKAWAY_MIN_DISTANCE + Math.random() * (BREAKAWAY_MAX_DISTANCE - BREAKAWAY_MIN_DISTANCE);
    this.breakaway = freshBreakawayState();
    this.defenderPenalty = 0;
    this.setPhase("breakawayTransitionIn");
    this.swipe.setMode("fourWay");
  }

  private updateBreakaway(dt: number) {
    const b = this.breakaway;
    if (this.phase === "breakawayTransitionIn") {
      b.transitionT += dt / 0.9;
      this.cameraZoom = 1 + Math.min(1, b.transitionT) * 0.5;
      if (b.transitionT >= 1) {
        this.setPhase("breakawayBeat");
        this.startBeatPrompt();
      }
      return;
    }

    if (this.phase === "breakawayBeat") {
      if (!b.beat.resolved) {
        b.beat.windowT -= dt;
        if (b.beat.windowT <= 0) this.resolveBeatAttempt(null);
      } else {
        b.beat.resolvedT += dt;
        if (b.beat.resolvedT > 0.55) {
          b.beat.index += 1;
          if (b.beat.index >= b.beat.total) {
            this.setPhase("breakawayShoot");
            this.swipe.setMode("threeWay");
            this.startShootPrompt();
          } else {
            this.startBeatPrompt();
          }
        }
      }
      return;
    }

    if (this.phase === "breakawayShoot") {
      if (!b.shoot.chosenDir) {
        b.shoot.windowT -= dt;
        if (b.shoot.windowT <= 0) this.resolveShot(null);
      } else {
        b.shoot.diveT = Math.min(1, b.shoot.diveT + dt / 0.45);
        const target = zonePosition(b.shoot.chosenDir);
        b.shoot.ballX += (target.x - b.shoot.ballX) * Math.min(1, dt * 6);
        b.shoot.ballY += (target.y - b.shoot.ballY) * Math.min(1, dt * 6);
        b.shoot.resolvedT += dt;
        if (b.shoot.resolvedT > 0.7) {
          this.setPhase("breakawayResult");
          b.resultT = 0;
        }
      }
      return;
    }

    if (this.phase === "breakawayResult") {
      b.resultT += dt;
      const holdTime = b.shoot.outcome === "topCornerGoal" ? 2.4 : b.shoot.outcome && b.shoot.outcome !== "miss" && b.shoot.outcome !== "saved" ? 1.8 : 1.3;
      if (b.resultT > holdTime) {
        this.setPhase("breakawayTransitionOut");
        b.transitionT = 0;
      }
      return;
    }

    if (this.phase === "breakawayTransitionOut") {
      b.transitionT += dt / 0.7;
      this.cameraZoom = 1 + (1 - Math.min(1, b.transitionT)) * 0.5;
      if (b.transitionT >= 1) {
        this.cameraZoom = 1;
        this.cyclesCompleted += 1;
        this.entities = [];
        this.spawner.reset();
        this.player.reset();
        this.setPhase("runner");
        this.swipe.setMode("fourWay");
      }
    }
  }

  private startBeatPrompt() {
    this.breakaway.beat.promptDir = Math.random() < 0.5 ? "left" : "right";
    this.breakaway.beat.windowT = this.breakaway.beat.windowMax;
    this.breakaway.beat.resolved = null;
    this.breakaway.beat.resolvedT = 0;
  }

  private resolveBeatAttempt(dir: "left" | "right" | null) {
    const b = this.breakaway.beat;
    if (b.resolved) return;
    const success = dir !== null && dir === b.promptDir;
    b.resolved = success ? "success" : "fail";
    b.resolvedT = 0;
    if (success) {
      this.score += 150;
      this.particles.burstSparks(CANVAS_W / 2, CANVAS_H * 0.5, "#34d399", 12);
    } else {
      this.defenderPenalty += 0.12;
      audio.hit();
    }
  }

  private startShootPrompt() {
    const b = this.breakaway.shoot;
    b.windowT = b.windowMax;
    b.chosenDir = null;
    b.keeperDir = null;
    b.diveT = 0;
    b.outcome = null;
    const center = zonePosition("center");
    b.ballX = center.x;
    b.ballY = center.y + 90;
    b.resolvedT = 0;
  }

  private resolveShot(dir: ShootDir | null) {
    const b = this.breakaway.shoot;
    if (b.chosenDir) return;
    const stage = getStage(this.stageIndexAtStart);

    if (!dir) {
      b.chosenDir = "center";
      b.outcome = "miss";
      b.keeperDir = this.rollKeeperDir("center", stage.keeperSkill);
      this.applyShotOutcome("miss");
      return;
    }

    b.chosenDir = dir;
    const isCorner = dir === "left" || dir === "right";

    // The keeper dives on their own, independent of the player: they make a
    // genuine random guess, just more likely to read the shot correctly the
    // better/sharper the keeper (stage skill, lowered by a beaten defender,
    // raised when the shooter has momentum working against the keeper).
    b.keeperDir = this.rollKeeperDir(dir, stage.keeperSkill);
    const saved = b.keeperDir === dir;

    let outcome: ShotOutcome;
    if (saved) {
      outcome = Math.random() < 0.25 ? "miss" : "saved";
    } else if (isCorner) {
      outcome = "topCornerGoal";
    } else if (Math.random() < 0.3) {
      outcome = "greatGoal";
    } else {
      outcome = "goal";
    }
    b.outcome = outcome;
    this.applyShotOutcome(outcome);
  }

  // Independent random pick for the keeper's dive: a weighted coin flip on
  // whether they guess the actual shot direction, then a uniform pick among
  // the remaining zones otherwise — so the keeper truly chooses on its own,
  // not by reverse-engineering a precomputed hit/miss roll.
  private rollKeeperDir(shotDir: ShootDir, keeperSkill: number): ShootDir {
    const momentumPenalty = this.activePowerUps.momentumMode ? 0.18 : 0;
    const readChance = Math.max(0.12, Math.min(0.78, 0.3 + keeperSkill * 0.4 - this.defenderPenalty - momentumPenalty));
    if (Math.random() < readChance) return shotDir;
    const others = (["left", "center", "right"] as ShootDir[]).filter((z) => z !== shotDir);
    return others[Math.floor(Math.random() * others.length)];
  }

  private applyShotOutcome(outcome: ShotOutcome) {
    const mult = this.activePowerUps.hatTrick ? 3 : 1;
    this.listeners.onShotResult?.(outcome);
    if (outcome === "goal") {
      this.score += 500 * this.multiplier * mult;
      this.capital += 200;
      this.goalsThisRun += 1;
      this.persisted.totalGoals += 1;
      audio.goal(false);
      audio.crowdRoar(0.5);
      this.particles.burstConfetti(CANVAS_W / 2, CANVAS_H * 0.35, 40);
    } else if (outcome === "greatGoal") {
      this.score += 900 * this.multiplier * mult;
      this.capital += 350;
      this.goalsThisRun += 1;
      this.persisted.totalGoals += 1;
      this.multiplier = Math.min(10, this.multiplier + 0.25);
      audio.goal(false);
      audio.crowdRoar(0.7);
      this.particles.burstConfetti(CANVAS_W / 2, CANVAS_H * 0.35, 55);
    } else if (outcome === "topCornerGoal") {
      this.score += 1800 * this.multiplier * mult;
      this.capital += 600;
      this.goalsThisRun += 1;
      this.topCornersThisRun += 1;
      this.persisted.totalGoals += 1;
      this.persisted.totalTopCorners += 1;
      this.multiplier = Math.min(10, this.multiplier + 1);
      audio.goal(true);
      audio.crowdRoar(1);
      this.particles.burstConfetti(CANVAS_W / 2, CANVAS_H * 0.32, 100);
    } else if (outcome === "saved") {
      audio.miss();
    } else {
      this.multiplier = 1;
      audio.miss();
    }
    this.particles.addText(CANVAS_W / 2, CANVAS_H * 0.42, outcomeLabel(outcome), outcomeColor(outcome), 30);
    this.persisted.bestMultiplier = Math.max(this.persisted.bestMultiplier, this.multiplier);
    saveState(this.persisted);
  }

  // ---------------- GAME OVER ----------------

  private gameOver() {
    audio.stopMusic();
    audio.stopCrowdAmbience();
    this.persisted.runsWithoutCorrection = Math.max(this.persisted.runsWithoutCorrection, this.distanceSinceCorrection);
    this.persisted.bestDistance = Math.max(this.persisted.bestDistance, Math.floor(this.distance));
    const isNewBest = this.score > this.persisted.bestScore;
    this.persisted.bestScore = Math.max(this.persisted.bestScore, Math.floor(this.score));
    this.persisted.bestMultiplier = Math.max(this.persisted.bestMultiplier, this.multiplier);
    saveState(this.persisted);

    const newAchievements = checkNewAchievements(
      {
        totalCapital: this.persisted.totalCapital,
        totalAlpha: this.persisted.totalAlpha,
        totalGoals: this.persisted.totalGoals,
        totalTopCorners: this.persisted.totalTopCorners,
        totalTrophies: this.persisted.totalTrophies,
        bestDistance: this.persisted.bestDistance,
        bestScore: this.persisted.bestScore,
        bestMultiplier: this.persisted.bestMultiplier,
        matchesWon: this.persisted.matchesWon,
        correctionsTaken: this.persisted.correctionsTaken,
        runsWithoutCorrection: this.persisted.runsWithoutCorrection,
        stageReached: this.persisted.stageIndex,
      },
      this.persisted.unlockedAchievements,
    );
    if (newAchievements.length) {
      this.persisted.unlockedAchievements.push(...newAchievements.map((a) => a.id));
      saveState(this.persisted);
      audio.crowdRoar(0.4);
      newAchievements.forEach((a) => this.listeners.onAchievement?.(a));
    }

    this.setPhase("gameOver");
    this.listeners.onMatchResult?.({
      score: Math.floor(this.score),
      capital: this.capital,
      alpha: this.alpha,
      distance: Math.floor(this.distance),
      goals: this.goalsThisRun,
      topCorners: this.topCornersThisRun,
      trophies: this.trophiesThisRun,
      isNewBest,
      wonMatch: !!this.matchWonToast,
      stageName: getStage(this.stageIndexAtStart).name,
    });
  }

  // ---------------- HUD ----------------

  private emitHud(dt: number) {
    this.hudTimer += dt;
    if (this.hudTimer < 1 / 20) return;
    this.hudTimer = 0;
    const stage = getStage(this.stageIndexAtStart);
    this.listeners.onHud?.({
      phase: this.phase,
      score: Math.floor(this.score),
      capital: Math.floor(this.capital),
      multiplier: this.multiplier,
      momentumPct: Math.min(1, (this.momentumStreak % 8) / 8),
      distance: Math.floor(this.distance),
      stageName: stage.name,
      stageTarget: getStageTarget(this.stageIndexAtStart),
      lives: this.lives,
      activePowerUps: Object.entries(this.activePowerUps).map(([kind, left]) => ({
        kind: kind as PowerUpKind,
        pct: Math.max(0, Math.min(1, (left ?? 0) / POWER_UP_DURATIONS[kind])),
      })),
      matchWonToast: this.matchWonToast,
    });
  }

  // ---------------- RENDER ----------------

  private render(t: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.save();
    if (this.cameraZoom !== 1) {
      ctx.translate(CANVAS_W / 2, CANVAS_H * 0.42);
      ctx.scale(this.cameraZoom, this.cameraZoom);
      ctx.translate(-CANVAS_W / 2, -CANVAS_H * 0.42);
    }
    drawStadiumBackground(ctx, t, this.screenFlash);

    if (this.phase === "runner") {
      drawEntities(ctx, this.entities, t);
      drawPlayer(ctx, this.player, 0);
    } else if (this.phase.startsWith("breakaway")) {
      this.renderBreakaway(t);
    }
    ctx.restore();

    // Instructional overlay is drawn outside the zoomed camera transform so
    // it stays pinned to the top of the screen instead of being pushed
    // off-frame by the breakaway camera zoom.
    const b = this.breakaway;
    if (this.phase === "breakawayBeat" && b.beat.promptDir && !b.beat.resolved) {
      drawInstructionBanner(ctx, "DEFENDER CLOSING IN!", "Swipe ⬅️ or ➡️ to match the lit side");
      drawCountdownBar(ctx, Math.max(0, b.beat.windowT / b.beat.windowMax));
    } else if (this.phase === "breakawayShoot" && !b.shoot.chosenDir) {
      drawInstructionBanner(ctx, "TAKE THE SHOT!", "Swipe ⬅️/➡️ to pick a side, or tap to shoot center");
      drawCountdownBar(ctx, Math.max(0, b.shoot.windowT / b.shoot.windowMax));
    }

    this.particles.draw(ctx);
    drawVignette(ctx);
    ctx.restore();
  }

  private renderBreakaway(t: number) {
    const ctx = this.ctx;
    const b = this.breakaway;

    if (this.phase === "breakawayTransitionIn" || this.phase === "breakawayTransitionOut") {
      drawPlayer(ctx, this.player, 0);
      return;
    }

    if (this.phase === "breakawayBeat") {
      drawDefenderDuel(ctx, b.beat.promptDir, Math.max(0, b.beat.windowT / b.beat.windowMax), b.beat.resolved);
      const { x, y } = laneScreenX(1, 80);
      drawPlayer(ctx, this.player, 0);
      void x;
      void y;
      return;
    }

    if (this.phase === "breakawayShoot") {
      drawGoalFrame(ctx);
      drawTargetZones(ctx, b.shoot.chosenDir ?? null, t);
      drawKeeper(ctx, b.shoot.keeperDir, b.shoot.diveT);
      drawPlayer(ctx, this.player, 0);
      if (b.shoot.chosenDir) drawBall(ctx, b.shoot.ballX, b.shoot.ballY, 1 - b.shoot.diveT * 0.4);
      else drawBall(ctx, CANVAS_W / 2, HORIZON_Y + 152, 1);
      return;
    }

    if (this.phase === "breakawayResult") {
      drawGoalFrame(ctx);
      drawKeeper(ctx, b.shoot.keeperDir, 1);
      drawPlayer(ctx, this.player, 0);
      if (b.shoot.outcome === "goal" || b.shoot.outcome === "greatGoal" || b.shoot.outcome === "topCornerGoal") {
        const pos = zonePosition(b.shoot.chosenDir ?? "center");
        drawBall(ctx, pos.x, pos.y, 0.7);
      } else {
        drawBall(ctx, b.shoot.ballX, b.shoot.ballY, 0.8);
      }
    }
  }
}

const POWERUP_TOAST: Record<PowerUpKind, string> = {
  rocketBoots: "ROCKET BOOTS!",
  goldenMagnet: "GOLDEN MAGNET!",
  varShield: "VAR SHIELD!",
  momentumMode: "MOMENTUM MODE!",
  hatTrick: "HAT TRICK x3!",
};

function outcomeColor(outcome: ShotOutcome): string {
  switch (outcome) {
    case "topCornerGoal":
      return "#facc15";
    case "greatGoal":
      return "#34d399";
    case "goal":
      return "#4ade80";
    case "saved":
      return "#60a5fa";
    case "miss":
      return "#ef4444";
  }
}
