import type { GameState, Input, Tile } from "./types";
import { buildLevel, GROUND_Y, TILE } from "./level";

export const VIEW_W = 450;
export const VIEW_H = 800;

const GRAVITY = 1400;
const MAX_FALL = 700;
const MOVE_ACCEL = 1200;
const MOVE_MAX = 220;
const FRICTION = 1000;
const JUMP_VELOCITY = -520;
const JUMP_HOLD_BOOST = -700;
const JUMP_HOLD_TIME = 0.18;
const COFFEE_DURATION = 8;
const HEADPHONES_DURATION = 6;
const WFH_DURATION = 7;
const COFFEE_SPEED_MUL = 1.45;
const COFFEE_JUMP_MUL = 1.12;
const WFH_GRAVITY_MUL = 0.45;
const WFH_JUMP_MUL = 1.18;

export function createGameState(): GameState {
  const level = buildLevel();
  return {
    player: {
      x: 2 * TILE,
      y: GROUND_Y - 2 * TILE,
      w: TILE - 4,
      h: 2 * TILE - 2,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      alive: true,
      walkAnim: 0,
      jumpHeld: false,
      invuln: 0,
      speedBoost: 0,
      invincible: 0,
      floaty: 0,
    },
    level,
    cameraX: 0,
    score: 0,
    coinsCollected: 0,
    time: 300,
    status: "playing",
    deathTimer: 0,
    winTimer: 0,
  };
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function tilesNear(tiles: Tile[], x: number, y: number, w: number, h: number): Tile[] {
  const margin = TILE * 2;
  return tiles.filter(
    (t) =>
      t.x + t.w > x - margin &&
      t.x < x + w + margin &&
      t.y + t.h > y - margin &&
      t.y < y + h + margin,
  );
}

let jumpHoldTimer = 0;

export function update(state: GameState, input: Input, dt: number): void {
  if (state.status === "dead") {
    state.deathTimer += dt;
    state.player.vy += GRAVITY * dt;
    if (state.player.vy > MAX_FALL) state.player.vy = MAX_FALL;
    state.player.y += state.player.vy * dt;
    return;
  }

  if (state.status === "won") {
    state.winTimer += dt;
    state.player.vy += GRAVITY * dt;
    if (state.player.vy > 200) state.player.vy = 200;
    state.player.y += state.player.vy * dt;
    if (state.player.y > GROUND_Y - state.player.h) {
      state.player.y = GROUND_Y - state.player.h;
      state.player.vy = 0;
      state.player.x += 60 * dt;
    }
    return;
  }

  state.time -= dt;
  if (state.time <= 0) {
    state.time = 0;
    killPlayer(state);
    return;
  }

  const p = state.player;

  const speedMul = p.speedBoost > 0 ? COFFEE_SPEED_MUL : 1;
  const moveMax = MOVE_MAX * speedMul;
  let jumpMul = 1;
  if (p.speedBoost > 0) jumpMul *= COFFEE_JUMP_MUL;
  if (p.floaty > 0) jumpMul *= WFH_JUMP_MUL;
  const jumpVel = JUMP_VELOCITY * jumpMul;
  const gravityMul = p.floaty > 0 ? WFH_GRAVITY_MUL : 1;

  if (input.left && !input.right) {
    p.vx -= MOVE_ACCEL * speedMul * dt;
    if (p.vx < -moveMax) p.vx = -moveMax;
    p.facing = -1;
  } else if (input.right && !input.left) {
    p.vx += MOVE_ACCEL * speedMul * dt;
    if (p.vx > moveMax) p.vx = moveMax;
    p.facing = 1;
  } else {
    if (p.vx > 0) {
      p.vx -= FRICTION * dt;
      if (p.vx < 0) p.vx = 0;
    } else if (p.vx < 0) {
      p.vx += FRICTION * dt;
      if (p.vx > 0) p.vx = 0;
    }
  }

  if (input.jump) {
    if (p.onGround && !p.jumpHeld) {
      p.vy = jumpVel;
      p.onGround = false;
      jumpHoldTimer = 0;
    } else if (!p.onGround && jumpHoldTimer < JUMP_HOLD_TIME) {
      p.vy += JUMP_HOLD_BOOST * dt;
      jumpHoldTimer += dt;
    }
    p.jumpHeld = true;
  } else {
    p.jumpHeld = false;
    jumpHoldTimer = JUMP_HOLD_TIME;
  }

  p.vy += GRAVITY * gravityMul * dt;
  const maxFall = MAX_FALL * (p.floaty > 0 ? 0.5 : 1);
  if (p.vy > maxFall) p.vy = maxFall;

  const nearby = tilesNear(state.level.tiles, p.x, p.y, p.w, p.h);

  p.x += p.vx * dt;
  if (p.x < 0) {
    p.x = 0;
    p.vx = 0;
  }
  if (p.x + p.w > state.level.width) {
    p.x = state.level.width - p.w;
    p.vx = 0;
  }
  for (const t of nearby) {
    if (rectsOverlap(p.x, p.y, p.w, p.h, t.x, t.y, t.w, t.h)) {
      if (p.vx > 0) {
        p.x = t.x - p.w;
      } else if (p.vx < 0) {
        p.x = t.x + t.w;
      }
      p.vx = 0;
    }
  }

  p.y += p.vy * dt;
  p.onGround = false;
  for (const t of nearby) {
    if (rectsOverlap(p.x, p.y, p.w, p.h, t.x, t.y, t.w, t.h)) {
      if (p.vy > 0) {
        p.y = t.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else if (p.vy < 0) {
        p.y = t.y + t.h;
        p.vy = 60;
      }
    }
  }

  if (p.y > VIEW_H + 200) {
    killPlayer(state);
    return;
  }

  if (Math.abs(p.vx) > 10 && p.onGround) {
    p.walkAnim += Math.abs(p.vx) * dt * 0.05;
  }

  if (p.invuln > 0) p.invuln -= dt;
  if (p.speedBoost > 0) p.speedBoost -= dt;
  if (p.invincible > 0) p.invincible -= dt;
  if (p.floaty > 0) p.floaty -= dt;

  for (const pu of state.level.powerUps) {
    if (pu.collected) continue;
    if (rectsOverlap(p.x, p.y, p.w, p.h, pu.x, pu.y, pu.w, pu.h)) {
      pu.collected = true;
      if (pu.kind === "coffee") {
        p.speedBoost = COFFEE_DURATION;
      } else if (pu.kind === "headphones") {
        p.invincible = HEADPHONES_DURATION;
      } else if (pu.kind === "wfh") {
        p.floaty = WFH_DURATION;
      }
      state.score += 1000;
    }
  }

  for (const c of state.level.coins) {
    if (c.collected) continue;
    if (
      Math.abs(c.x - (p.x + p.w / 2)) < TILE / 2 + 4 &&
      Math.abs(c.y - (p.y + p.h / 2)) < TILE / 2 + 4
    ) {
      c.collected = true;
      state.coinsCollected++;
      state.score += 200;
    }
  }

  for (const e of state.level.enemies) {
    if (!e.alive) {
      if (e.squashedAt !== null) {
        e.squashedAt += dt;
      }
      continue;
    }

    const eNearby = tilesNear(state.level.tiles, e.x, e.y, e.w, e.h);

    e.vy += GRAVITY * dt;
    if (e.vy > MAX_FALL) e.vy = MAX_FALL;

    e.x += e.vx * dt;
    for (const t of eNearby) {
      if (rectsOverlap(e.x, e.y, e.w, e.h, t.x, t.y, t.w, t.h)) {
        if (e.vx > 0) e.x = t.x - e.w;
        else if (e.vx < 0) e.x = t.x + t.w;
        e.vx = -e.vx;
      }
    }

    if (e.x < 0 || e.x + e.w > state.level.width) {
      e.vx = -e.vx;
    }

    e.y += e.vy * dt;
    let onGround = false;
    for (const t of eNearby) {
      if (rectsOverlap(e.x, e.y, e.w, e.h, t.x, t.y, t.w, t.h)) {
        if (e.vy > 0) {
          e.y = t.y - e.h;
          e.vy = 0;
          onGround = true;
        } else if (e.vy < 0) {
          e.y = t.y + t.h;
          e.vy = 0;
        }
      }
    }

    if (onGround) {
      const aheadX = e.vx > 0 ? e.x + e.w + 2 : e.x - 2;
      const footY = e.y + e.h + 2;
      let hasGround = false;
      for (const t of eNearby) {
        if (
          aheadX >= t.x &&
          aheadX <= t.x + t.w &&
          footY >= t.y &&
          footY <= t.y + t.h
        ) {
          hasGround = true;
          break;
        }
      }
      if (!hasGround) {
        e.vx = -e.vx;
      }
    }

    if (e.y > VIEW_H + 200) {
      e.alive = false;
      continue;
    }

    if (
      rectsOverlap(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h) &&
      p.invuln <= 0
    ) {
      if (p.invincible > 0) {
        e.alive = false;
        e.squashedAt = 0;
        state.score += 200;
        continue;
      }
      const playerBottom = p.y + p.h;
      const enemyTop = e.y;
      if (p.vy > 0 && playerBottom - enemyTop < 18) {
        e.alive = false;
        e.squashedAt = 0;
        p.vy = JUMP_VELOCITY * 0.7;
        state.score += 100;
      } else {
        killPlayer(state);
        return;
      }
    }
  }

  if (
    p.x + p.w >= state.level.flagX &&
    p.x <= state.level.flagX + 8
  ) {
    state.status = "won";
    state.winTimer = 0;
    state.score += Math.floor(state.time) * 10;
  }

  const targetCam = p.x - VIEW_W / 3;
  state.cameraX = Math.max(0, Math.min(state.level.width - VIEW_W, targetCam));
}

function killPlayer(state: GameState): void {
  if (!state.player.alive) return;
  state.player.alive = false;
  state.player.vy = -400;
  state.player.vx = 0;
  state.status = "dead";
  state.deathTimer = 0;
}

export function resetGame(state: GameState): void {
  const fresh = createGameState();
  Object.assign(state, fresh);
}
