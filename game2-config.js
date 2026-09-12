/*
 * ═══════════════════════════════════════════════════════════
 *  MINI-GAME 2 — tunables only
 * ═══════════════════════════════════════════════════════════
 *
 * World units are internal pixels. The canvas letterboxes this
 * coordinate system into any viewport. Do not size gameplay
 * from window.innerWidth / innerHeight.
 *
 * HEAD_SRC: Julian's father's head cutout for the rolling balls.
 */

window.CrisisGame2Config = {
  WORLD_W: 480,
  WORLD_H: 640,

  PLAYER_SRC: 'assets/game/Headed.png',
  THROWER_SRC: 'assets/game/Headless.png',
  FIREBALL_SRC: 'assets/game/Fireball.png',
  OBJECT_SRC: 'assets/game/Object.png',
  SPACE_SRC: 'assets/well-final.jpg',
  SPACE_FOCUS_X: 0.178,
  SPACE_FOCUS_Y: 0.219,
  MUSIC_SRC: 'audio/Game.mp3',
  HEAD_SRC: 'assets/game/Head.png',

  PLAYER_SPEED: 132,
  PLAYER_JUMP: 430,
  GRAVITY: 1450,
  CLIMB_SPEED: 96,
  CLIMB_RANGE: 26,

  PLAYER_HEIGHT: 78,
  PLAYER_START_X: 86,
  PLAYER_START_TIER: 'bottom',
  PLAYER_HURT: { xFrac: 0.30, yFrac: 0.42, yBias: 0.12 },

  THROWER_X: 78,
  THROWER_TIER: 'top',
  THROWER_HEIGHT: 86,
  THROWER_FLIP: true,

  OBJECT_X: 402,
  OBJECT_TIER: 'top',
  OBJECT_HEIGHT: 136,
  OBJECT_LIFT: 68,
  OBJECT_HURT: { xFrac: 0.52, yFrac: 0.52 },
  PORTAL_ZOOM_MS: 1600,
  PORTAL_ZOOM_FILL: 2.4,

  HEAD_SPEED: 78,
  HEAD_SPAWN_INTERVAL_MS: 2600,
  HEAD_SPAWN_FIRST_MS: 1100,
  HEAD_WAVE: 2,
  HEAD_MAX: 12,
  HEAD_WAVE_TRIGGER_TIER: 'low',
  HEAD_WAVE_NEXT_MS: 180,
  HEAD_RADIUS: 13,
  HEAD_HURT_RADIUS: 11,
  HEAD_SPIN: 5.4,
  HEAD_BOUNCE: 92,
  HEAD_DROP_DRIFT: 0.22,
  HEAD_SPAWN_OFFSET_X: 36,
  HEAD_PLACEHOLDER_SIZE: 64,

  DEATH_RESET_MS: 950,

  PLATFORM_THICKNESS: 14,
  LADDER_WIDTH: 22,
  LADDER_RUNG: 13,

  TIERS: [
    { id: 'top', y: 168, left: 42, right: 438, dir: 1 },
    { id: 'high', y: 302, left: 42, right: 438, dir: -1 },
    { id: 'low', y: 436, left: 42, right: 438, dir: 1 },
    { id: 'bottom', y: 570, left: 42, right: 438, dir: -1 }
  ],

  LADDERS: [
    { x: 372, from: 'bottom', to: 'low' },
    { x: 108, from: 'low', to: 'high' },
    { x: 360, from: 'high', to: 'top' }
  ],

  DROPS: [
    { from: 'top', x: 404, to: 'high' },
    { from: 'high', x: 76, to: 'low' },
    { from: 'low', x: 404, to: 'bottom' }
  ],

  COLORS: {
    paper: '#8c867c',
    paperEdge: '#6f6a62',
    girder: '#2c241c',
    girderLip: '#5a4a38',
    ladder: '#3a3228',
    headFill: '#d2c4a8',
    headRim: '#3a2e24',
    letterbox: '#000000'
  }
};
