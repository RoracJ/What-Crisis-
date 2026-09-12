/*
 * ═══════════════════════════════════════════════════════════
 *  MINI-GAME 3 — tunables only
 * ═══════════════════════════════════════════════════════════
 *
 * World units are internal pixels. The canvas letterboxes this
 * coordinate system into any viewport. Do not size gameplay
 * from window.innerWidth / innerHeight.
 *
 * Do not change Mini-Game 1 or Mini-Game 2 from this file.
 */

window.CrisisGame3Config = {
  WORLD_W: 480,
  WORLD_H: 640,

  BG_SRC: 'assets/game/Background.png',
  BG_FOCUS_X: 0.50,
  BG_FOCUS_Y: 0.66,
  BG_ZOOM: 1.48,
  PLAYER_SRC: 'assets/game/Headed.png',
  ENEMY_SRC: 'assets/game/Headless.png',
  BRIEFCASE_SRC: 'assets/game/Briefcase.png',
  SAUCER_SRC: 'assets/game/saucer.png',

  PLAYER_SPEED: 148,
  PLAYER_HEIGHT: 58,
  PLAYER_START_X: 240,
  PLAYER_Y: 586,
  PLAYER_ZONE_TOP: 536,
  PLAYER_HURT: { xFrac: 0.28, yFrac: 0.40, yBias: 0.10 },
  PLAYER_DANGER_Y: 560,

  SHOT_SPEED: 340,
  SHOT_SPIN: 14,
  SHOT_HEIGHT: 22,
  SHOT_COOLDOWN_MS: 480,
  SHOT_HURT: { xFrac: 0.70, yFrac: 0.70 },

  ENEMY_COUNT: 18,
  ENEMY_CHAINS: 3,
  ENEMY_SPEED: 72,
  ENEMY_HEIGHT: 40,
  ENEMY_STEP: 22,
  ENEMY_SPACING: 28,
  ENEMY_START_Y: 176,
  ENEMY_CHAIN_GAP: 46,
  ENEMY_MARGIN: 28,
  ENEMY_HURT: { xFrac: 0.42, yFrac: 0.55, yBias: 0.08 },
  ENEMY_NUDGE: 6,

  COMPLETE_MS: 420,
  WIN_ZOOM_MS: 1300,
  WIN_HOLD_MS: 420,
  WIN_ZOOM_SCALE: 5.2,
  WIN_SPIN: 16,

  CARS: [
    { src: 'assets/game/saucer.png', x: 88, y: 78, h: 30 },
    { src: 'assets/game/saucer.png', x: 240, y: 78, h: 30 },
    { src: 'assets/game/saucer.png', x: 392, y: 78, h: 30 },
    { src: 'assets/game/Car.png', x: 72, y: 348, h: 40 },
    { src: 'assets/game/Car1.png', x: 408, y: 348, h: 40 },
    { src: 'assets/game/Car2.png', x: 248, y: 448, h: 42 }
  ]
};
