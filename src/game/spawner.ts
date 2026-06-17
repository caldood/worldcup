import { SPAWN_Z } from "./constants";
import type { ObstacleKind, PowerUpKind, RunnerEntity } from "./types";

const OBSTACLE_KINDS: ObstacleKind[] = [
  "defender",
  "slidingTackle",
  "referee",
  "cone",
  "cart",
  "varCamera",
  "barrier",
];

const POWER_UP_KINDS: PowerUpKind[] = [
  "rocketBoots",
  "goldenMagnet",
  "varShield",
  "momentumMode",
  "hatTrick",
];

let idCounter = 0;

export class Spawner {
  private distanceSinceLastSpawn = 0;
  private nextGap = 90;

  reset() {
    this.distanceSinceLastSpawn = 0;
    this.nextGap = 90;
  }

  maybeSpawn(distanceDelta: number, density: number): RunnerEntity[] {
    this.distanceSinceLastSpawn += distanceDelta;
    const spawned: RunnerEntity[] = [];
    if (this.distanceSinceLastSpawn >= this.nextGap) {
      this.distanceSinceLastSpawn = 0;
      this.nextGap = Math.max(55, 150 / density - Math.random() * 25);
      spawned.push(...this.spawnGroup(density));
    }
    return spawned;
  }

  private spawnGroup(density: number): RunnerEntity[] {
    const roll = Math.random();
    const entities: RunnerEntity[] = [];

    if (roll < 0.08) {
      // collectible row: coins across multiple lanes
      const lanes = Math.random() < 0.5 ? [0, 1, 2] : [1];
      for (const lane of lanes) {
        entities.push(this.makeEntity(lane as 0 | 1 | 2, "collectible", "capital"));
      }
    } else if (roll < 0.1) {
      entities.push(this.makeEntity(this.randomLane(), "collectible", "alpha"));
    } else if (roll < 0.1 + 0.06 * density) {
      entities.push(this.makeEntity(this.randomLane(), "powerup", POWER_UP_KINDS[Math.floor(Math.random() * POWER_UP_KINDS.length)]));
    } else {
      const blockedLanes = new Set<number>();
      const obstacleCount = Math.random() < Math.min(0.55, 0.25 * density) ? 2 : 1;
      for (let i = 0; i < obstacleCount; i++) {
        let lane = this.randomLane();
        let attempts = 0;
        while (blockedLanes.has(lane) && attempts < 5) {
          lane = this.randomLane();
          attempts++;
        }
        if (blockedLanes.size >= 2) break; // always leave one lane open
        blockedLanes.add(lane);
        const kind = OBSTACLE_KINDS[Math.floor(Math.random() * OBSTACLE_KINDS.length)];
        entities.push(this.makeEntity(lane as 0 | 1 | 2, "obstacle", kind));
      }
      // occasional bonus coin alongside obstacles
      if (Math.random() < 0.4) {
        const open = [0, 1, 2].find((l) => !blockedLanes.has(l));
        if (open !== undefined) entities.push(this.makeEntity(open as 0 | 1 | 2, "collectible", "capital"));
      }
    }
    return entities;
  }

  private randomLane(): 0 | 1 | 2 {
    return Math.floor(Math.random() * 3) as 0 | 1 | 2;
  }

  private makeEntity(lane: 0 | 1 | 2, type: RunnerEntity["type"], kind: RunnerEntity["kind"]): RunnerEntity {
    return {
      id: idCounter++,
      lane,
      z: SPAWN_Z,
      kind,
      type,
      bobPhase: Math.random() * Math.PI * 2,
    };
  }
}
