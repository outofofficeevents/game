import type {
  Level,
  Tile,
  Coin,
  Enemy,
  Cloud,
  Hill,
  EnemyKind,
  PowerUp,
  PowerUpKind,
} from "./types";

export const TILE = 32;
export const GROUND_ROW = 23;
export const GROUND_Y = GROUND_ROW * TILE;
export const LEVEL_ROWS = 25;

const ABOVE = (n: number) => GROUND_ROW - n;

export function buildLevel(): Level {
  const tiles: Tile[] = [];
  const coins: Coin[] = [];
  const enemies: Enemy[] = [];

  const levelWidth = 120 * TILE;
  const levelHeight = LEVEL_ROWS * TILE;

  const groundSegments: Array<[number, number]> = [
    [0, 22],
    [25, 35],
    [38, 55],
    [58, 80],
    [83, 95],
    [98, 120],
  ];

  for (const [start, end] of groundSegments) {
    for (let i = start; i < end; i++) {
      tiles.push({
        x: i * TILE,
        y: GROUND_Y,
        w: TILE,
        h: 2 * TILE,
        type: "ground",
      });
    }
  }

  const brickRow = (xStart: number, count: number, aboveGround: number) => {
    for (let i = 0; i < count; i++) {
      tiles.push({
        x: (xStart + i) * TILE,
        y: ABOVE(aboveGround) * TILE,
        w: TILE,
        h: TILE,
        type: "brick",
      });
    }
  };

  brickRow(8, 4, 4);
  brickRow(14, 1, 4);

  brickRow(28, 3, 3);
  brickRow(28, 3, 6);

  brickRow(42, 5, 4);
  brickRow(48, 3, 7);

  brickRow(62, 2, 3);
  brickRow(66, 2, 5);
  brickRow(70, 2, 7);
  brickRow(74, 4, 4);

  brickRow(85, 3, 4);

  brickRow(100, 5, 5);
  brickRow(106, 3, 7);
  brickRow(112, 2, 4);

  const pipe = (x: number, height: number) => {
    for (let h = 0; h < height; h++) {
      tiles.push({
        x: x * TILE,
        y: (GROUND_ROW - 1 - h) * TILE,
        w: 2 * TILE,
        h: TILE,
        type: "pipe",
      });
    }
  };
  pipe(18, 2);
  pipe(45, 3);
  pipe(78, 2);
  pipe(110, 3);

  const coinAt = (x: number, aboveGround: number) => {
    coins.push({
      x: x * TILE + TILE / 2,
      y: ABOVE(aboveGround) * TILE + TILE / 2,
      collected: false,
    });
  };

  for (let i = 0; i < 4; i++) coinAt(8 + i, 6);
  for (let i = 0; i < 3; i++) coinAt(28 + i, 8);
  for (let i = 0; i < 5; i++) coinAt(42 + i, 6);
  for (let i = 0; i < 3; i++) coinAt(48 + i, 9);
  coinAt(66, 7);
  coinAt(67, 7);
  coinAt(70, 9);
  coinAt(71, 9);
  for (let i = 0; i < 4; i++) coinAt(74 + i, 6);
  for (let i = 0; i < 5; i++) coinAt(100 + i, 7);
  for (let i = 0; i < 3; i++) coinAt(106 + i, 9);

  coinAt(15, 2);
  coinAt(16, 2);
  coinAt(38, 2);
  coinAt(39, 2);
  coinAt(58, 2);
  coinAt(59, 2);
  coinAt(83, 2);
  coinAt(84, 2);
  coinAt(98, 2);
  coinAt(99, 2);

  const enemyKinds: EnemyKind[] = ["boss", "teams", "email"];
  const bossPhrases = [
    "Got a sec?",
    "Quick sync?",
    "Per my last email...",
    "Loop me in",
    "Circle back?",
    "Touch base?",
    "Do you have a minute?",
    "Just following up",
    "Let's take this offline",
    "Can we hop on a call?",
  ];
  let enemyIndex = 0;
  let bossPhraseIdx = 0;
  const enemyAt = (x: number, kind?: EnemyKind) => {
    const k = kind ?? enemyKinds[enemyIndex % enemyKinds.length];
    enemyIndex++;
    const enemy: Enemy = {
      x: x * TILE,
      y: GROUND_Y - TILE,
      w: TILE,
      h: TILE,
      vx: -40,
      vy: 0,
      alive: true,
      squashedAt: null,
      kind: k,
    };
    if (k === "boss") {
      enemy.phrase = bossPhrases[bossPhraseIdx % bossPhrases.length];
      enemy.phrasePhase = bossPhraseIdx * 0.7;
      bossPhraseIdx++;
    }
    enemies.push(enemy);
  };

  enemyAt(5, "teams");
  enemyAt(12, "email");
  enemyAt(20, "boss");
  enemyAt(43, "email");
  enemyAt(50, "teams");
  enemyAt(63, "boss");
  enemyAt(70, "email");
  enemyAt(76, "teams");
  enemyAt(86, "boss");
  enemyAt(91, "email");
  enemyAt(102, "teams");
  enemyAt(108, "boss");
  enemyAt(115, "boss");

  const powerUps: PowerUp[] = [];
  const powerUpAt = (x: number, aboveGround: number, kind: PowerUpKind) => {
    powerUps.push({
      x: x * TILE + 4,
      y: ABOVE(aboveGround) * TILE + 4,
      w: TILE - 8,
      h: TILE - 8,
      kind,
      collected: false,
      bobPhase: x * 0.3,
    });
  };
  powerUpAt(16, 4, "coffee");
  powerUpAt(28, 7, "wfh");
  powerUpAt(32, 9, "headphones");
  powerUpAt(53, 5, "coffee");
  powerUpAt(60, 9, "wfh");
  powerUpAt(72, 9, "headphones");
  powerUpAt(89, 6, "coffee");
  powerUpAt(96, 9, "wfh");
  powerUpAt(108, 9, "headphones");

  const clouds: Cloud[] = [];
  for (let i = 0; i < 36; i++) {
    clouds.push({
      x: i * 160 + 80,
      y: 50 + (i % 3) * 36,
      scale: 0.85 + (i % 2) * 0.15,
    });
  }

  const hills: Hill[] = [];
  for (let i = 0; i < 16; i++) {
    hills.push({
      x: i * 280 + 80,
      y: GROUND_Y,
      scale: i % 2 === 0 ? 1 : 0.85,
    });
  }

  const flagX = 118 * TILE;
  const flagY = ABOVE(8) * TILE;

  return {
    width: levelWidth,
    height: levelHeight,
    tiles,
    coins,
    enemies,
    powerUps,
    clouds,
    hills,
    flagX,
    flagY,
  };
}
