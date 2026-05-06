import type { GameState, Tile, Coin, Enemy, Player, PowerUp } from "./types";
import { TILE } from "./level";
import { VIEW_W, VIEW_H } from "./engine";

export const BRAND_PINK = "#E31992";
export const BRAND_ORANGE = "#FC4C00";
const HUD_TOP_OFFSET = 0;
const HUD_HEIGHT = 40;
const LOGO_BOTTOM_RESERVE = 36;

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const cam = Math.floor(state.cameraX);

  drawWall(ctx);
  drawCeilingLights(ctx, state, cam);
  drawWallDecor(ctx, state, cam);
  drawCubicles(ctx, state, cam);

  ctx.save();
  ctx.translate(-cam, 0);

  drawDoor(ctx, state);

  for (const t of state.level.tiles) {
    if (t.x + t.w < cam || t.x > cam + VIEW_W) continue;
    drawTile(ctx, t);
  }

  for (const c of state.level.coins) {
    if (c.collected) continue;
    if (c.x + TILE < cam || c.x > cam + VIEW_W) continue;
    drawClock(ctx, c, performance.now() / 1000);
  }

  for (const pu of state.level.powerUps ?? []) {
    if (pu.collected) continue;
    if (pu.x + pu.w < cam || pu.x > cam + VIEW_W) continue;
    drawPowerUp(ctx, pu, performance.now() / 1000);
  }

  for (const e of state.level.enemies) {
    if (e.x + e.w < cam || e.x > cam + VIEW_W) continue;
    drawEnemy(ctx, e);
  }

  drawPlayer(ctx, state.player, state.status);

  ctx.restore();

  drawHud(ctx, state);

  if (state.status === "dead" && state.deathTimer > 1.5) {
    drawCenterText(ctx, "BURNED OUT", "TAP TO TRY AGAIN", state);
  } else if (state.status === "won" && state.winTimer > 1.5) {
    drawCenterText(ctx, "PTO APPROVED!", "TAP TO PLAY AGAIN", state);
  }
}

function drawWall(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, "#e8d8b8");
  g.addColorStop(0.5, "#dcc7a0");
  g.addColorStop(1, "#c9b088");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = "rgba(120, 90, 50, 0.18)";
  ctx.fillRect(0, 110, VIEW_W, 2);
  ctx.fillRect(0, 114, VIEW_W, 1);
}

function drawCeilingLights(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: number,
): void {
  ctx.fillStyle = "#3d3525";
  ctx.fillRect(0, 0, VIEW_W, 70);
  ctx.fillStyle = "#5a4a30";
  ctx.fillRect(0, 70, VIEW_W, 6);

  for (const c of state.level.clouds) {
    const sx = c.x - cam * 0.3;
    if (sx < -120 || sx > VIEW_W + 120) continue;
    drawLightFixture(ctx, sx, c.y, c.scale);
  }
}

function drawLightFixture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
): void {
  const w = 70 * s;
  const h = 26 * s;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6);
  ctx.fillStyle = "#fff8d6";
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - w / 2 + 4, y - h / 2 + 3, w - 8, h - 6);
  const grad = ctx.createRadialGradient(x, y, 4, x, y, w * 0.9);
  grad.addColorStop(0, "rgba(255, 248, 200, 0.45)");
  grad.addColorStop(1, "rgba(255, 248, 200, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(x - w, y - h, w * 2, h * 4);
}

function drawWallDecor(
  ctx: CanvasRenderingContext2D,
  _state: GameState,
  cam: number,
): void {
  const spacing = 360;
  const startX = -((cam * 0.45) % spacing);
  for (let x = startX; x < VIEW_W + 120; x += spacing) {
    drawMotivationalPoster(ctx, x + 80, 200);
    drawWallClock(ctx, x + 220, 180);
  }
}

function drawMotivationalPoster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const w = 70;
  const h = 90;
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#7fb3d5";
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = "#2c5a78";
  ctx.fillRect(x + 4, y + h - 26, w - 8, 22);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HUSTLE", x + w / 2, y + h - 15);
  ctx.fillStyle = "#f4c430";
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 30, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawWallClock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const r = 20;
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillRect(x + Math.cos(a) * (r - 3) - 1, y + Math.sin(a) * (r - 3) - 1, 2, 2);
  }
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 8, y - 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 4, y - 14);
  ctx.stroke();
}

function drawCubicles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: number,
): void {
  for (const h of state.level.hills) {
    const sx = h.x - cam * 0.55;
    if (sx < -200 || sx > VIEW_W + 200) continue;
    drawCubicle(ctx, sx, h.y, h.scale);
  }
}

function drawCubicle(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  s: number,
): void {
  const w = 200 * s;
  const ht = 110 * s;
  const top = groundY - ht;

  ctx.fillStyle = "#7a8a99";
  ctx.fillRect(x - w / 2, top, w, ht);
  ctx.fillStyle = "#5d6b78";
  ctx.fillRect(x - w / 2, top, w, 8);
  ctx.fillStyle = "#374a5c";
  ctx.fillRect(x - w / 2, top - 4, w, 4);

  ctx.fillStyle = "#6a7886";
  for (let i = 1; i < 5; i++) {
    ctx.fillRect(x - w / 2, top + (ht / 5) * i, w, 1);
  }

  ctx.fillStyle = "#3a2a1a";
  const deskY = groundY - 30;
  const deskW = w * 0.7;
  ctx.fillRect(x - deskW / 2, deskY, deskW, 6);

  ctx.fillStyle = "#1a1a1a";
  const monX = x - deskW / 2 + 12;
  ctx.fillRect(monX, deskY - 22, 26, 22);
  ctx.fillStyle = "#5b8eef";
  ctx.fillRect(monX + 2, deskY - 20, 22, 16);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(monX + 10, deskY, 6, 4);

  ctx.fillStyle = "#8a6a4a";
  ctx.beginPath();
  ctx.arc(x + deskW / 2 - 14, deskY - 10, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5a3e22";
  ctx.fillRect(x + deskW / 2 - 18, deskY - 4, 8, 4);
}

function drawTile(ctx: CanvasRenderingContext2D, t: Tile): void {
  if (t.type === "ground") {
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = "#3a3a3a";
    for (let dx = 0; dx < t.w; dx += 6) {
      for (let dy = 0; dy < t.h; dy += 6) {
        if (((dx / 6) + (dy / 6)) % 2 === 0) {
          ctx.fillRect(t.x + dx, t.y + dy, 3, 3);
        }
      }
    }
    ctx.fillStyle = "#2c2c2c";
    ctx.fillRect(t.x, t.y, t.w, 2);
    ctx.fillStyle = "#5c5c5c";
    ctx.fillRect(t.x, t.y + 2, t.w, 1);
  } else if (t.type === "brick") {
    ctx.fillStyle = "#6b3410";
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = "#4a230a";
    ctx.fillRect(t.x, t.y, t.w, 3);
    ctx.fillRect(t.x, t.y + t.h - 3, t.w, 3);
    ctx.fillRect(t.x, t.y, 2, t.h);
    ctx.fillRect(t.x + t.w - 2, t.y, 2, t.h);

    const colors = ["#c0392b", "#27ae60", "#2980b9", "#d4ac0d", "#7d3c98"];
    const slotW = (t.w - 6) / 5;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(t.x + 3 + i * slotW, t.y + 4, slotW - 1, t.h - 8);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(t.x + 3 + i * slotW, t.y + 8, slotW - 1, 2);
      ctx.fillRect(t.x + 3 + i * slotW, t.y + t.h - 12, slotW - 1, 2);
    }
  } else if (t.type === "pipe") {
    ctx.fillStyle = "#dde7ee";
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = "#a0aab2";
    ctx.fillRect(t.x, t.y, 4, t.h);
    ctx.fillRect(t.x + t.w - 4, t.y, 4, t.h);

    ctx.fillStyle = "#3a8fd9";
    ctx.fillRect(t.x + 6, t.y + 4, t.w - 12, t.h - 16);
    ctx.fillStyle = "#5fb0ee";
    ctx.fillRect(t.x + 8, t.y + 6, 4, t.h - 20);

    ctx.fillStyle = "#6a6a6a";
    ctx.fillRect(t.x + t.w / 2 - 4, t.y + t.h - 10, 8, 6);
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(t.x + t.w / 2 - 2, t.y + t.h - 6, 4, 3);
  }
}

function drawClock(ctx: CanvasRenderingContext2D, c: Coin, t: number): void {
  const bob = Math.sin(t * 3 + c.x * 0.05) * 2;
  const cx = c.x;
  const cy = c.y + bob;
  const r = 11;

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, c.y + 14, r * 0.7, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a1a1a";
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    ctx.fillRect(cx + Math.cos(a) * (r - 2) - 1, cy + Math.sin(a) * (r - 2) - 1, 2, 2);
  }

  const hourAngle = t * 0.6;
  const minAngle = t * 6;
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hourAngle - Math.PI / 2) * 4, cy + Math.sin(hourAngle - Math.PI / 2) * 4);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(minAngle - Math.PI / 2) * 7, cy + Math.sin(minAngle - Math.PI / 2) * 7);
  ctx.stroke();

  ctx.fillStyle = "#e63946";
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  if (!e.alive) {
    if (e.squashedAt === null || e.squashedAt > 0.6) return;
    ctx.fillStyle = "#666";
    ctx.fillRect(e.x + 4, e.y + e.h - 6, e.w - 8, 6);
    ctx.fillStyle = "#999";
    ctx.fillRect(e.x + 6, e.y + e.h - 5, e.w - 12, 2);
    return;
  }
  if (e.kind === "boss") {
    drawBoss(ctx, e);
    if (e.phrase) drawSpeechBubble(ctx, e);
  } else if (e.kind === "teams") drawTeams(ctx, e);
  else if (e.kind === "email") drawEmail(ctx, e);
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, e: Enemy): void {
  if (!e.phrase) return;
  const t = performance.now() / 1000;
  const phase = e.phrasePhase ?? 0;
  const cycle = (t + phase) % 6;
  if (cycle > 4) return;
  const fadeIn = Math.min(1, cycle / 0.3);
  const fadeOut = cycle > 3.5 ? Math.max(0, 1 - (cycle - 3.5) / 0.5) : 1;
  const alpha = fadeIn * fadeOut;

  ctx.font = "bold 9px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = e.phrase;
  const padX = 6;
  const textW = ctx.measureText(text).width;
  const bubbleW = textW + padX * 2;
  const bubbleH = 16;
  const bubbleX = e.x + e.w / 2 - bubbleW / 2;
  const bubbleY = e.y - bubbleH - 8 + Math.sin(t * 2 + phase) * 1;

  ctx.globalAlpha = alpha;

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, bubbleX + 1, bubbleY + 1, bubbleW, bubbleH, 4);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 4);
  ctx.fill();
  ctx.strokeStyle = BRAND_PINK;
  ctx.lineWidth = 1.2;
  roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 4);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(e.x + e.w / 2 - 3, bubbleY + bubbleH - 1);
  ctx.lineTo(e.x + e.w / 2 + 3, bubbleY + bubbleH - 1);
  ctx.lineTo(e.x + e.w / 2, bubbleY + bubbleH + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BRAND_PINK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(e.x + e.w / 2 - 3, bubbleY + bubbleH);
  ctx.lineTo(e.x + e.w / 2, bubbleY + bubbleH + 4);
  ctx.lineTo(e.x + e.w / 2 + 3, bubbleY + bubbleH);
  ctx.stroke();

  ctx.fillStyle = "#1a1a1a";
  ctx.fillText(text, e.x + e.w / 2, bubbleY + bubbleH / 2 + 0.5);

  ctx.globalAlpha = 1;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBoss(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const x = e.x;
  const y = e.y;
  const w = e.w;
  const h = e.h;
  const cx = x + w / 2;

  const walk = Math.floor(performance.now() / 180) % 2;
  const legOffset = walk === 0 ? 0 : 2;

  ctx.fillStyle = "#e8c39a";
  ctx.fillRect(cx - 6, y + 2, 12, 9);

  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(cx - 6, y + 1, 12, 4);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 7, y, 14, 2);

  ctx.fillStyle = "#000";
  ctx.fillRect(cx - 4, y + 6, 2, 1);
  ctx.fillRect(cx + 2, y + 6, 2, 1);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 3, y + 9, 6, 1);

  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(x + 3, y + 11, w - 6, h - 19);
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - 3, y + 11, 6, h - 19);
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.moveTo(cx, y + 12);
  ctx.lineTo(cx - 2, y + 18);
  ctx.lineTo(cx + 2, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - 3, y + 17, 6, 6);

  ctx.fillStyle = "#e8c39a";
  ctx.fillRect(x + 1, y + 12, 3, 8);
  ctx.fillRect(x + w - 4, y + 12, 3, 8);

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 4, y + h - 8 + legOffset, w / 2 - 4, 8 - legOffset);
  ctx.fillRect(x + w / 2, y + h - 8 - legOffset + 4, w / 2 - 4, 8 + legOffset - 4);
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 4, y + h - 2, w / 2 - 4, 2);
  ctx.fillRect(x + w / 2, y + h - 2, w / 2 - 4, 2);
}

function drawTeams(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const x = e.x;
  const y = e.y;
  const w = e.w;
  const h = e.h;
  const bob = Math.sin(performance.now() / 180) * 1;

  const bodyTop = y + 4 + bob;
  const bodyH = h - 12;

  ctx.fillStyle = "#4a4f9e";
  ctx.fillRect(x + 2, bodyTop + 1, w - 4, bodyH);
  ctx.fillStyle = "#5b5fc7";
  ctx.fillRect(x + 2, bodyTop, w - 4, bodyH);

  ctx.beginPath();
  ctx.moveTo(x + 6, bodyTop + bodyH - 1);
  ctx.lineTo(x + 10, bodyTop + bodyH + 4);
  ctx.lineTo(x + 12, bodyTop + bodyH - 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T", x + w / 2, bodyTop + bodyH / 2 + 1);

  ctx.fillStyle = "#e63946";
  ctx.beginPath();
  ctx.arc(x + w - 5, bodyTop + 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 8px Arial";
  ctx.fillText("9", x + w - 5, bodyTop + 3);

  const walk = Math.floor(performance.now() / 160) % 2;
  ctx.fillStyle = "#1a1a1a";
  if (walk === 0) {
    ctx.fillRect(x + 8, y + h - 6, 4, 6);
    ctx.fillRect(x + w - 12, y + h - 4, 4, 4);
  } else {
    ctx.fillRect(x + 8, y + h - 4, 4, 4);
    ctx.fillRect(x + w - 12, y + h - 6, 4, 6);
  }
}

function drawEmail(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const x = e.x;
  const y = e.y;
  const w = e.w;
  const h = e.h;
  const bob = Math.sin(performance.now() / 200 + x) * 1;

  const envY = y + 4 + bob;
  const envH = h - 12;

  ctx.fillStyle = "#888";
  ctx.fillRect(x + 3, envY + 1, w - 6, envH);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 3, envY, w - 6, envH);
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, envY, w - 6, envH);

  ctx.strokeStyle = "#bbb";
  ctx.beginPath();
  ctx.moveTo(x + 3, envY);
  ctx.lineTo(x + w / 2, envY + envH * 0.55);
  ctx.lineTo(x + w - 3, envY);
  ctx.stroke();

  ctx.fillStyle = "#3a8fd9";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("@", x + w / 2, envY + envH - 4);

  ctx.fillStyle = "#e63946";
  ctx.beginPath();
  ctx.arc(x + w - 5, envY + 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 8px Arial";
  ctx.fillText("1", x + w - 5, envY + 3);

  const walk = Math.floor(performance.now() / 160) % 2;
  ctx.fillStyle = "#1a1a1a";
  if (walk === 0) {
    ctx.fillRect(x + 8, y + h - 6, 4, 6);
    ctx.fillRect(x + w - 12, y + h - 4, 4, 4);
  } else {
    ctx.fillRect(x + 8, y + h - 4, 4, 4);
    ctx.fillRect(x + w - 12, y + h - 6, 4, 6);
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: Player,
  status: string,
): void {
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  const w = p.w;
  const h = p.h;

  if (status === "dead") {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(1, -1);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    drawWoman(ctx, x, y, w, h, p.facing, 0, false);
    ctx.restore();
    return;
  }

  const t = performance.now() / 1000;

  if (p.invincible > 0) {
    drawInvincibleAura(ctx, x + w / 2, y + h / 2, w, h, t, p.invincible);
  }
  if (p.speedBoost > 0) {
    drawSpeedTrail(ctx, x, y, w, h, p.facing, p.vx);
  }

  const walking = Math.abs(p.vx) > 10 && p.onGround;
  const frame = walking ? Math.floor(p.walkAnim) % 2 : 0;

  if (p.invincible > 0) {
    const flashHide = p.invincible < 1.5 && Math.floor(t * 12) % 2 === 0;
    if (flashHide) return;
  }

  drawWoman(ctx, x, y, w, h, p.facing, frame, !p.onGround);
}

function drawInvincibleAura(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  t: number,
  remaining: number,
): void {
  const pulse = 0.6 + 0.4 * Math.sin(t * 6);
  const r = Math.max(w, h) * 0.7;
  const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
  const fade = remaining < 1.5 ? remaining / 1.5 : 1;
  grad.addColorStop(0, `rgba(227, 25, 146, ${0.55 * pulse * fade})`);
  grad.addColorStop(0.6, `rgba(252, 76, 0, ${0.3 * pulse * fade})`);
  grad.addColorStop(1, "rgba(252, 76, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 2;
    const sx = cx + Math.cos(a) * (r * 0.55);
    const sy = cy + Math.sin(a) * (r * 0.55);
    ctx.fillStyle = i % 2 === 0 ? BRAND_PINK : BRAND_ORANGE;
    ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
  }
}

function drawSpeedTrail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  facing: 1 | -1,
  vx: number,
): void {
  if (Math.abs(vx) < 60) return;
  const dir = facing === 1 ? -1 : 1;
  ctx.fillStyle = BRAND_ORANGE;
  for (let i = 0; i < 3; i++) {
    const off = (i + 1) * 6;
    const alpha = 0.6 - i * 0.15;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x + (dir === -1 ? -off : w + off - 4), y + 24 + i * 6, 6, 2);
    ctx.fillRect(x + (dir === -1 ? -off : w + off - 4), y + 38 + i * 4, 6, 2);
  }
  ctx.globalAlpha = 1;
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, t: number): void {
  const bob = Math.sin(t * 2.5 + pu.bobPhase) * 3;
  const cx = pu.x + pu.w / 2;
  const cy = pu.y + pu.h / 2 + bob;

  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 22);
  const color = pu.kind === "coffee" ? BRAND_ORANGE : BRAND_PINK;
  glow.addColorStop(0, color + "55");
  glow.addColorStop(1, color + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 24, cy - 24, 48, 48);

  if (pu.kind === "coffee") drawCoffee(ctx, cx, cy, t);
  else if (pu.kind === "headphones") drawHeadphones(ctx, cx, cy);
  else drawWfh(ctx, cx, cy, t);
}

function drawWfh(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
): void {
  const float = Math.sin(t * 3) * 1;
  ctx.fillStyle = BRAND_PINK;
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy - 1 + float);
  ctx.lineTo(cx, cy - 11 + float);
  ctx.lineTo(cx + 11, cy - 1 + float);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRAND_ORANGE;
  ctx.fillRect(cx - 9, cy - 1 + float, 18, 11);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 4, cy + 4 + float, 4, 6);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx + 1, cy + 1 + float, 5, 4);
  ctx.fillStyle = BRAND_PINK;
  ctx.fillRect(cx - 7, cy + 11, 14, 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 5, cy + 13, 10, 1);
}

function drawCoffee(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
): void {
  for (let i = 0; i < 3; i++) {
    const sx = cx - 4 + i * 4;
    const sw = 2;
    const sy = cy - 14 + Math.sin(t * 4 + i) * 1;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(sx, sy - 6, sw, 6);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(sx, sy - 12, sw, 4);
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 9, cy - 6, 18, 14);
  ctx.fillStyle = BRAND_PINK;
  ctx.fillRect(cx - 9, cy - 6, 18, 4);
  ctx.fillStyle = BRAND_ORANGE;
  ctx.fillRect(cx - 9, cy - 2, 18, 2);
  ctx.fillStyle = "#3a1a08";
  ctx.fillRect(cx - 7, cy - 4, 14, 3);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx + 11, cy + 1, 4, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 9, cy + 8, 18, 2);
}

function drawHeadphones(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.strokeStyle = BRAND_PINK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 11, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = BRAND_PINK;
  ctx.fillRect(cx - 13, cy, 5, 10);
  ctx.fillRect(cx + 8, cy, 5, 10);

  ctx.fillStyle = BRAND_ORANGE;
  ctx.fillRect(cx - 12, cy + 1, 3, 8);
  ctx.fillRect(cx + 9, cy + 1, 3, 8);

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 11, cy + 3, 1, 4);
  ctx.fillRect(cx + 10, cy + 3, 1, 4);
}

function drawWoman(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  facing: 1 | -1,
  frame: number,
  jumping: boolean,
): void {
  ctx.save();
  if (facing === -1) {
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), 0);
  }

  const skin = "#a06b3a";
  const skinShadow = "#7e5128";
  const hair = "#0e0e0e";
  const hairHighlight = "#222";
  const blouse = BRAND_PINK;
  const blouseShadow = "#a01368";
  const pants = "#1f1f1f";
  const shoes = "#0a0a0a";

  ctx.fillStyle = hair;
  ctx.fillRect(x + 3, y + 2, w - 6, 6);
  ctx.fillRect(x + 1, y + 4, w - 2, 8);

  ctx.fillStyle = skin;
  ctx.fillRect(x + 6, y + 8, w - 12, 10);
  ctx.fillStyle = skinShadow;
  ctx.fillRect(x + 6, y + 16, w - 12, 2);

  ctx.fillStyle = hair;
  ctx.fillRect(x + 4, y + 10, 3, 14);
  ctx.fillRect(x + w - 7, y + 10, 3, 14);
  ctx.fillStyle = hairHighlight;
  ctx.fillRect(x + 5, y + 12, 1, 8);
  ctx.fillRect(x + w - 6, y + 12, 1, 8);

  ctx.fillStyle = "#000";
  ctx.fillRect(x + 9, y + 12, 2, 2);
  ctx.fillRect(x + w - 11, y + 12, 2, 2);

  ctx.fillStyle = "#c43a5a";
  ctx.fillRect(x + w / 2 - 2, y + 16, 4, 1);

  ctx.fillStyle = blouse;
  ctx.fillRect(x + 3, y + 18, w - 6, 16);
  ctx.fillStyle = blouseShadow;
  ctx.fillRect(x + 3, y + 18, w - 6, 3);
  ctx.fillRect(x + w / 2 - 1, y + 18, 2, 16);

  ctx.fillStyle = "#d4ac0d";
  ctx.fillRect(x + w / 2 - 4, y + 20, 2, 2);
  ctx.fillRect(x + w / 2 + 2, y + 20, 2, 2);

  ctx.fillStyle = skin;
  if (jumping) {
    ctx.fillRect(x - 1, y + 20, 5, 8);
    ctx.fillRect(x + w - 4, y + 16, 5, 8);
  } else {
    const armOffset = frame === 0 ? 0 : 2;
    ctx.fillRect(x - 1, y + 22 + armOffset, 5, 10);
    ctx.fillRect(x + w - 4, y + 22 - armOffset, 5, 10);
  }

  ctx.fillStyle = pants;
  if (jumping) {
    ctx.fillRect(x + 3, y + 34, w / 2 - 3, h - 38);
    ctx.fillRect(x + w / 2, y + 34, w / 2 - 3, h - 36);
  } else {
    const legOffset = frame === 0 ? 0 : 3;
    ctx.fillRect(x + 4, y + 34 + legOffset, w / 2 - 4, h - 38 - legOffset);
    ctx.fillRect(x + w / 2, y + 34 - legOffset + 3, w / 2 - 4, h - 38 + legOffset - 3);
  }

  ctx.fillStyle = shoes;
  ctx.fillRect(x + 3, y + h - 4, w / 2 - 3, 4);
  ctx.fillRect(x + w / 2, y + h - 4, w / 2 - 3, 4);

  ctx.restore();
}

function drawDoor(ctx: CanvasRenderingContext2D, state: GameState): void {
  const fx = state.level.flagX;
  const groundY = state.level.tiles[0]?.y ?? 23 * TILE;
  const doorW = 60;
  const doorH = 110;
  const doorX = fx - doorW / 2 + 4;
  const doorY = groundY - doorH;

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(doorX - 4, doorY - 4, doorW + 8, doorH + 4);

  ctx.fillStyle = "#5a3e22";
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.fillStyle = "#3e2810";
  ctx.fillRect(doorX, doorY, doorW, 4);
  ctx.fillRect(doorX, doorY, 3, doorH);

  ctx.fillStyle = "#3e2810";
  ctx.fillRect(doorX + 8, doorY + 12, doorW - 16, 30);
  ctx.fillRect(doorX + 8, doorY + 50, doorW - 16, 30);
  ctx.fillStyle = "#7a5a32";
  ctx.fillRect(doorX + 10, doorY + 14, doorW - 20, 26);
  ctx.fillRect(doorX + 10, doorY + 52, doorW - 20, 26);

  ctx.fillStyle = "#d4ac0d";
  ctx.beginPath();
  ctx.arc(doorX + doorW - 10, doorY + doorH / 2 + 10, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BRAND_PINK;
  ctx.fillRect(doorX - 6, doorY - 26, doorW + 12, 22);
  ctx.fillStyle = BRAND_ORANGE;
  ctx.fillRect(doorX - 6, doorY - 8, doorW + 12, 4);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXIT", fx + 4, doorY - 15);
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = "rgba(20,15,5,0.78)";
  ctx.fillRect(0, 0, VIEW_W, HUD_TOP_OFFSET + HUD_HEIGHT);
  ctx.fillStyle = BRAND_PINK;
  ctx.fillRect(0, HUD_TOP_OFFSET + HUD_HEIGHT, VIEW_W, 2);

  const baseY = HUD_TOP_OFFSET;

  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.fillText("PTO HRS", 10, baseY + 10);
  ctx.fillStyle = BRAND_ORANGE;
  ctx.font = "bold 16px monospace";
  ctx.fillText(state.coinsCollected.toString().padStart(2, "0"), 10, baseY + 28);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("STRESS", VIEW_W / 2, baseY + 10);
  drawStressBar(ctx, VIEW_W / 2 - 42, baseY + 22, 84, 8, state.score);

  ctx.textAlign = "right";
  ctx.fillText("CLOCK", VIEW_W - 10, baseY + 10);
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = state.time < 60 ? BRAND_PINK : "#fff";
  const mins = Math.floor(Math.max(0, state.time) / 60);
  const secs = Math.floor(Math.max(0, state.time) % 60);
  ctx.fillText(`${mins}:${secs.toString().padStart(2, "0")}`, VIEW_W - 10, baseY + 28);

  drawPowerUpTimers(ctx, state);
}

function drawPowerUpTimers(ctx: CanvasRenderingContext2D, state: GameState): void {
  const p = state.player;
  const active: Array<{
    color: string;
    label: string;
    time: number;
    max: number;
  }> = [];
  if (p.speedBoost > 0) {
    active.push({ color: BRAND_ORANGE, label: "CAFFEINATED", time: p.speedBoost, max: 8 });
  }
  if (p.invincible > 0) {
    active.push({ color: BRAND_PINK, label: "DO NOT DISTURB", time: p.invincible, max: 6 });
  }
  if (p.floaty > 0) {
    active.push({ color: BRAND_PINK, label: "WORK FROM HOME", time: p.floaty, max: 7 });
  }
  if (active.length === 0) return;

  const startY = HUD_TOP_OFFSET + HUD_HEIGHT + 8;
  for (let i = 0; i < active.length; i++) {
    const a = active[i];
    const y = startY + i * 22;
    const w = 160;
    const x = (VIEW_W - w) / 2;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, w, 18);
    ctx.fillStyle = a.color;
    ctx.fillRect(x, y, w * (a.time / a.max), 18);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(a.label, x + w / 2, y + 9);
  }
}

function drawStressBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number,
): void {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  const pct = Math.min(1, score / 5000);
  ctx.fillStyle = BRAND_ORANGE;
  ctx.fillRect(x, y, w * (1 - pct), h);
  ctx.fillStyle = BRAND_PINK;
  ctx.fillRect(x + w * (1 - pct), y, w * pct, h);
}

function drawCenterText(
  ctx: CanvasRenderingContext2D,
  big: string,
  small: string,
  state: GameState,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = BRAND_PINK;
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(big, VIEW_W / 2, VIEW_H / 2 - 90);

  const cardW = 280;
  const cardH = 150;
  const cardX = (VIEW_W - cardW) / 2;
  const cardY = VIEW_H / 2 - 40;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 10);
  ctx.fill();
  ctx.strokeStyle = BRAND_PINK;
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 10);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FINAL SCORE", VIEW_W / 2, cardY + 20);

  ctx.fillStyle = BRAND_ORANGE;
  ctx.font = "bold 38px monospace";
  ctx.fillText(state.score.toString().padStart(5, "0"), VIEW_W / 2, cardY + 52);

  const colY = cardY + 96;
  const leftX = cardX + cardW / 4;
  const rightX = cardX + (cardW * 3) / 4;
  ctx.fillStyle = "#9aa";
  ctx.font = "bold 10px monospace";
  ctx.fillText("PTO HRS", leftX, colY);
  ctx.fillText("TIME LEFT", rightX, colY);
  ctx.fillStyle = BRAND_PINK;
  ctx.font = "bold 18px monospace";
  ctx.fillText(state.coinsCollected.toString().padStart(2, "0"), leftX, colY + 22);
  const mins = Math.floor(Math.max(0, state.time) / 60);
  const secs = Math.floor(Math.max(0, state.time) % 60);
  ctx.fillStyle = "#fff";
  ctx.fillText(`${mins}:${secs.toString().padStart(2, "0")}`, rightX, colY + 22);

  ctx.fillStyle = BRAND_PINK;
  ctx.font = "bold 14px monospace";
  ctx.fillText(small, VIEW_W / 2, cardY + cardH + 36);
}
