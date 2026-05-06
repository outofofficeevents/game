export type TileType = "ground" | "brick" | "pipe" | "block";

export interface Tile {
  x: number;
  y: number;
  w: number;
  h: number;
  type: TileType;
}

export interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

export type PowerUpKind = "coffee" | "headphones" | "wfh";

export interface PowerUp {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PowerUpKind;
  collected: boolean;
  bobPhase: number;
}

export type EnemyKind = "boss" | "teams" | "email";

export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  alive: boolean;
  squashedAt: number | null;
  kind: EnemyKind;
  phrase?: string;
  phrasePhase?: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
}

export interface Hill {
  x: number;
  y: number;
  scale: number;
}

export interface Level {
  width: number;
  height: number;
  tiles: Tile[];
  coins: Coin[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  clouds: Cloud[];
  hills: Hill[];
  flagX: number;
  flagY: number;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  alive: boolean;
  walkAnim: number;
  jumpHeld: boolean;
  invuln: number;
  speedBoost: number;
  invincible: number;
  floaty: number;
}

export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface GameState {
  player: Player;
  level: Level;
  cameraX: number;
  score: number;
  coinsCollected: number;
  time: number;
  status: "playing" | "won" | "dead";
  deathTimer: number;
  winTimer: number;
}
