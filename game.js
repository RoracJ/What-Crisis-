(() => {
  const ASSET = (name) => `assets/game/${name}`;
  const WORLD_W = 1536;
  const WORLD_H = 1024;
  const FILES = {
    Background: 'Background.png',
    Headed: 'Headed.png',
    Headless: 'Headless.png',
    Car: 'Car.png',
    Car1: 'Car1.png',
    Car2: 'Car2.png',
    Briefcase: 'Briefcase.png',
    Object: 'Object.png',
    Fireball: 'Fireball.png',
    Fire: 'Fire.png',
    Saucer: 'saucer.png',
    cloud1: 'cloud1.png',
    cloud2: 'cloud2.png',
    cloud3: 'cloud3.png',
    news: 'news.png',
    paperball: 'paperball.png',
    cup: 'cup.png',
    shadow1: 'shadow1.png',
    shadow2: 'shadow2.png',
    shadow3: 'shadow3.png'
  };

  const trigger = document.getElementById('open-game');
  const root = document.getElementById('crisis-game');
  const canvas = document.getElementById('crisis-canvas');
  const promptEl = document.getElementById('crisis-prompt');
  const deathFlash = document.getElementById('crisis-death-flash');
  const labVideo = document.getElementById('lab-video');
  const labPort = labVideo && labVideo.parentElement;
  const labLight = document.getElementById('lab-light');
  const labGauge = document.getElementById('lab-gauge');
  const labKnob = document.getElementById('lab-knob');
  const ambient = window.CrisisAmbient;
  if (!trigger || !root || !canvas) return;

  const ctx = canvas.getContext('2d');
  const sprites = {};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const keys = new Set();

  const PLAYER_START = { x: 0.5, y: 0.93 };
  const OBJECT_POS = { x: 0.5, y: 0.13 };

  let assetsReady = false;
  let open = false;
  let inLab = false;
  let running = false;
  let lastT = 0;
  let promptUntil = 0;
  let debrisAt = 0;
  let view = { scale: 1, ox: 0, oy: 0, dw: 0, dh: 0 };
  let player;
  let briefcase;
  let walkers = [];
  let cars = [];
  let saucers = [];
  let clouds = [];
  let debris = [];
  let death = null;
  let spawnUntil = 0;
  let labOn = false;
  let pointer = null;
  let pointerOrigin = null;
  let pointerMoved = false;
  let lastFacing = { x: 1, y: 0 };

  if (new URLSearchParams(window.location.search).has('game-debug')) {
    document.body.classList.add('game-debug');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
  }

  function punchAndCrop(img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0);
    const imageData = octx.getImageData(0, 0, w, h);
    const { data } = imageData;

    let opaque = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 12) opaque += 1;
    }
    const coverage = opaque / (w * h);

    if (coverage > 0.92) {
      const cr = data[0];
      const cg = data[1];
      const cb = data[2];
      const thresh = 48 * 48;
      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - cr;
        const dg = data[i + 1] - cg;
        const db = data[i + 2] - cb;
        if (dr * dr + dg * dg + db * db < thresh) data[i + 3] = 0;
      }
      octx.putImageData(imageData, 0, 0);
    }

    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    const sample = octx.getImageData(0, 0, w, h).data;
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if (sample[(y * w + x) * 4 + 3] > 18) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX <= minX || maxY <= minY) {
      return { canvas: off, w, h };
    }
    const pad = 2;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const cropped = document.createElement('canvas');
    cropped.width = cw;
    cropped.height = ch;
    cropped.getContext('2d').drawImage(off, minX, minY, cw, ch, 0, 0, cw, ch);
    return { canvas: cropped, w: cw, h: ch };
  }

  const RAW_KEYS = new Set(['Background', 'Fire']);

  async function loadSprites() {
    await Promise.all(Object.entries(FILES).map(async ([key, file]) => {
      const img = await loadImage(ASSET(file));
      sprites[key] = RAW_KEYS.has(key)
        ? { canvas: img, w: img.naturalWidth, h: img.naturalHeight }
        : punchAndCrop(img);
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const scale = Math.min(cw / WORLD_W, ch / WORLD_H);
    view.scale = scale;
    view.dw = WORLD_W * scale;
    view.dh = WORLD_H * scale;
    view.ox = (cw - view.dw) / 2;
    view.oy = (ch - view.dh) / 2;
  }

  function toScreen(nx, ny) {
    return {
      x: view.ox + nx * view.dw,
      y: view.oy + ny * view.dh
    };
  }

  function toWorld(clientX, clientY) {
    return {
      x: (clientX - view.ox) / view.dw,
      y: (clientY - view.oy) / view.dh
    };
  }

  function spriteSize(key, worldH) {
    const spr = sprites[key];
    const h = worldH * view.dh;
    const w = h * (spr.w / spr.h);
    return { w, h };
  }

  function resetPlayer() {
    player = {
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      vx: 0,
      vy: 0
    };
    briefcase = { mode: 'idle', x: player.x, y: player.y, angle: 0 };
    lastFacing = { x: 1, y: 0 };
    spawnUntil = performance.now() + 500;
  }

  function makeWalker(track, x) {
    return {
      x,
      y: track.y,
      dir: track.dir,
      speed: track.speed,
      mirror: !!track.mirror,
      alive: true
    };
  }

  function seedStreet() {
    walkers = [];
    cars = [];
    saucers = [];
    debris = [];
    death = null;
    if (deathFlash) deathFlash.classList.remove('is-flash');

    // Top → bottom: UFO, empty gap, cars, headless, cars, headless
    saucers = [
      { x: 0.18, y: 0.30, dir: 1, speed: 0.085, phase: 0 },
      { x: 0.72, y: 0.30, dir: 1, speed: 0.085, phase: 2.1 }
    ];

    cars = [
      { x: 0.16, y: 0.52, dir: -1, speed: 0.13, sprite: 'Car', shadow: 'shadow3' },
      { x: 0.70, y: 0.52, dir: -1, speed: 0.13, sprite: 'Car', shadow: 'shadow3' },
      { x: 0.28, y: 0.78, dir: 1, speed: 0.16, sprite: 'Car1', shadow: 'shadow2', mirror: true },
      { x: 0.82, y: 0.78, dir: 1, speed: 0.16, sprite: 'Car2', shadow: 'shadow1', mirror: true }
    ];

    const walkerTracks = [
      { y: 0.65, dir: -1, speed: 0.09, mirror: true },
      { y: 0.88, dir: 1, speed: 0.075, mirror: true }
    ];
    walkerTracks.forEach((track, i) => {
      for (let n = 0; n < 2; n += 1) {
        walkers.push(makeWalker(track, (n / 2) + i * 0.18));
      }
    });

    clouds = [
      { key: 'cloud1', x: 0.18, y: 0.16, speed: 0.012, size: 0.16 },
      { key: 'cloud2', x: 0.62, y: 0.08, speed: -0.008, size: 0.20 },
      { key: 'cloud3', x: 0.88, y: 0.20, speed: 0.015, size: 0.13 }
    ];

    debrisAt = performance.now() + 4000 + Math.random() * 3000;
    resetPlayer();
  }

  function drawSprite(key, nx, ny, worldH, opts = {}) {
    const spr = sprites[key];
    if (!spr) return null;
    const { w, h } = spriteSize(key, worldH);
    const p = toScreen(nx, ny);
    const cx = p.x;
    const cy = p.y;
    ctx.save();
    ctx.translate(cx, cy);
    if (opts.flip) ctx.scale(-1, 1);
    if (opts.angle) ctx.rotate(opts.angle);
    ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    ctx.drawImage(spr.canvas, -w / 2, -h * (opts.foot ? 0.92 : 0.5), w, h);
    ctx.restore();
    return { x: cx - w / 2, y: cy - h * (opts.foot ? 0.92 : 0.5), w, h, cx, cy };
  }

  function drawShadow(key, nx, ny, widthWorld) {
    const spr = sprites[key];
    if (!spr) return;
    const w = widthWorld * view.dw;
    const h = w * (spr.h / spr.w);
    const p = toScreen(nx, ny);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(spr.canvas, p.x - w / 2, p.y - h * 0.35, w, h);
    ctx.restore();
  }

  function hit(a, b, padA = 0.28, padB = 0.22) {
    if (!a || !b) return false;
    const ax = a.x + a.w * padA;
    const ay = a.y + a.h * padA;
    const aw = a.w * (1 - padA * 2);
    const ah = a.h * (1 - padA * 2);
    const bx = b.x + b.w * padB;
    const by = b.y + b.h * padB;
    const bw = b.w * (1 - padB * 2);
    const bh = b.h * (1 - padB * 2);
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Collide against the visible body, not the full tall/wide sprite canvas.
  function coreBox(rect, spec) {
    if (!rect) return null;
    const w = Math.max(2, rect.w * spec.xFrac);
    const h = Math.max(2, rect.h * spec.yFrac);
    return {
      x: rect.x + (rect.w - w) / 2,
      y: rect.y + (rect.h - h) / 2 + rect.h * (spec.yBias || 0),
      w,
      h
    };
  }

  const PLAYER_HURT = { xFrac: 0.32, yFrac: 0.22, yBias: 0.18 };
  const PLAYER_VS_SAUCER = { xFrac: 0.36, yFrac: 0.50, yBias: 0.02 };
  const WALKER_HURT = { xFrac: 0.30, yFrac: 0.22, yBias: 0.16 };
  const CAR_HURT = { xFrac: 0.50, yFrac: 0.38, yBias: 0.04 };
  const SAUCER_HURT = { xFrac: 0.58, yFrac: 0.62, yBias: 0 };

  function throwBriefcase() {
    if (death || !player || briefcase.mode !== 'idle') return;
    const len = Math.hypot(lastFacing.x, lastFacing.y) || 1;
    briefcase.mode = 'out';
    briefcase.x = player.x;
    briefcase.y = player.y - 0.06;
    briefcase.vx = (lastFacing.x / len) * 0.55;
    briefcase.vy = (lastFacing.y / len) * 0.55;
    briefcase.originX = player.x;
    briefcase.originY = player.y;
    briefcase.angle = 0;
  }

  function spawnDebris(now) {
    const kinds = ['news', 'paperball', 'cup'];
    const key = kinds[Math.floor(Math.random() * kinds.length)];
    const fromLeft = Math.random() < 0.5;
    debris.push({
      key,
      x: fromLeft ? -0.08 : 1.08,
      y: 0.68 + Math.random() * 0.24,
      vx: (fromLeft ? 1 : -1) * (0.08 + Math.random() * 0.06),
      vy: (Math.random() - 0.5) * 0.03,
      spin: (Math.random() - 0.5) * 3.2,
      angle: 0,
      size: key === 'news' ? 0.09 : 0.055
    });
    debrisAt = now + 4000 + Math.random() * 3000;
  }

  function killPlayer(now, rect) {
    if (death || !player) return;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    death = {
      x: (cx - view.ox) / view.dw,
      y: (cy - view.oy) / view.dh,
      h: rect.h / view.dh,
      until: now + 500
    };
    briefcase = { mode: 'idle', x: player.x, y: player.y, angle: 0 };
    if (deathFlash) {
      deathFlash.classList.remove('is-flash');
      void deathFlash.offsetWidth;
      deathFlash.classList.add('is-flash');
    }
  }

  function drawDeathFireball() {
    if (!death) return;
    drawSprite('Fireball', death.x, death.y, death.h);
  }

  function finishDeath() {
    death = null;
    if (deathFlash) deathFlash.classList.remove('is-flash');
    resetPlayer();
  }

  function update(dt, now) {
    if (inLab) return;

    if (death) {
      if (now >= death.until) finishDeath();
    } else {
      let mx = 0;
      let my = 0;
      if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
      if (keys.has('arrowright') || keys.has('d')) mx += 1;
      if (keys.has('arrowup') || keys.has('w')) my -= 1;
      if (keys.has('arrowdown') || keys.has('s')) my += 1;

      if (pointer) {
        mx = pointer.x - player.x;
        my = pointer.y - player.y;
        const dist = Math.hypot(mx, my);
        if (dist < 0.012) {
          mx = 0;
          my = 0;
        } else {
          mx /= dist;
          my /= dist;
        }
      }

      const speed = 0.16;
      if (mx || my) {
        const len = Math.hypot(mx, my) || 1;
        player.x += (mx / len) * speed * dt;
        player.y += (my / len) * speed * dt;
        lastFacing = { x: mx / len, y: my / len };
      }
      player.x = Math.max(0.06, Math.min(0.94, player.x));
      player.y = Math.max(0.08, Math.min(0.95, player.y));
    }

    walkers.forEach((w) => {
      if (!w.alive) {
        w.respawn = (w.respawn || 0) - dt;
        if (w.respawn <= 0) {
          w.alive = true;
          w.x = w.dir > 0 ? -0.16 : 1.16;
        }
        return;
      }
      w.x += w.dir * w.speed * dt;
      if (w.x > 1.18) w.x = -0.18;
      if (w.x < -0.18) w.x = 1.18;
    });

    cars.forEach((c) => {
      c.x += c.dir * c.speed * dt;
      if (c.x > 1.28) c.x = -0.28;
      if (c.x < -0.28) c.x = 1.28;
    });

    saucers.forEach((s) => {
      s.x += s.dir * s.speed * dt;
      s.phase += dt * 2.4;
      if (s.x > 1.32) s.x = -0.32;
      if (s.x < -0.32) s.x = 1.32;
    });

    clouds.forEach((c) => {
      c.x += c.speed * dt;
      if (c.x > 1.25) c.x = -0.2;
      if (c.x < -0.25) c.x = 1.2;
    });

    if (now >= debrisAt) spawnDebris(now);
    debris = debris.filter((d) => {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.angle += d.spin * dt;
      return d.x > -0.2 && d.x < 1.2 && d.y > -0.1 && d.y < 1.1;
    });

    if (briefcase.mode === 'out') {
      briefcase.x += briefcase.vx * dt;
      briefcase.y += briefcase.vy * dt;
      briefcase.angle += 14 * dt;
      const traveled = Math.hypot(briefcase.x - briefcase.originX, briefcase.y - briefcase.originY);
      if (traveled > 0.28 || briefcase.x < -0.05 || briefcase.x > 1.05 || briefcase.y < 0.02 || briefcase.y > 1.02) {
        briefcase.mode = 'back';
      }
    } else if (briefcase.mode === 'back') {
      const dx = player.x - briefcase.x;
      const dy = (player.y - 0.05) - briefcase.y;
      const dist = Math.hypot(dx, dy) || 1;
      briefcase.x += (dx / dist) * 0.7 * dt;
      briefcase.y += (dy / dist) * 0.7 * dt;
      briefcase.angle += 14 * dt;
      if (dist < 0.04) briefcase.mode = 'idle';
    } else {
      briefcase.x = player.x;
      briefcase.y = player.y;
    }
  }

  function render(now) {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    const bg = sprites.Background;
    ctx.drawImage(bg.canvas, view.ox, view.oy, view.dw, view.dh);

    clouds.forEach((c) => {
      drawSprite(c.key, c.x, c.y, c.size, { alpha: 0.72 });
    });

    const objectRect = drawSprite('Object', OBJECT_POS.x, OBJECT_POS.y, 0.12);

    saucers.forEach((s) => {
      const bob = Math.sin(s.phase) * 0.012;
      s.rect = drawSprite('Saucer', s.x, s.y + bob, 0.095, { flip: s.dir < 0 });
    });

    cars.forEach((c) => {
      drawShadow(c.shadow, c.x, c.y + 0.02, 0.18);
      c.rect = drawSprite(c.sprite, c.x, c.y, 0.11, { flip: (c.dir < 0) !== !!c.mirror, foot: true });
    });

    walkers.forEach((w) => {
      if (!w.alive) return;
      drawShadow('shadow1', w.x, w.y + 0.01, 0.08);
      w.rect = drawSprite('Headless', w.x, w.y, 0.175, { flip: (w.dir < 0) !== !!w.mirror, foot: true });
    });

    let playerRect = null;
    if (death) {
      drawDeathFireball();
    } else {
      playerRect = drawSprite('Headed', player.x, player.y, 0.19, {
        flip: lastFacing.x < 0,
        foot: true
      });
    }

    let caseRect = null;
    if (!death && briefcase.mode !== 'idle') {
      caseRect = drawSprite('Briefcase', briefcase.x, briefcase.y, 0.055, { angle: briefcase.angle });
    }

    debris.forEach((d) => {
      drawSprite(d.key, d.x, d.y, d.size, { angle: d.angle, alpha: 0.92 });
    });

    if (caseRect) {
      walkers.forEach((w) => {
        if (!w.alive || !w.rect) return;
        if (hit(caseRect, w.rect, 0.12, 0.22)) {
          w.alive = false;
          w.respawn = 1.1;
        }
      });
    }

    if (playerRect && !death && now >= spawnUntil) {
      const pBox = coreBox(playerRect, PLAYER_HURT);
      const inLane = (laneY, half = 0.048) => Math.abs(player.y - laneY) <= half;
      const killed = cars.some((c) => c.rect && inLane(c.y) && aabb(pBox, coreBox(c.rect, CAR_HURT)))
        || walkers.some((w) => w.alive && w.rect && inLane(w.y) && aabb(pBox, coreBox(w.rect, WALKER_HURT)))
        || saucers.some((s) => s.rect && aabb(coreBox(playerRect, PLAYER_VS_SAUCER), coreBox(s.rect, SAUCER_HURT)));
      if (killed) {
        killPlayer(now, playerRect);
        drawDeathFireball();
      }
      else if (player.y < 0.28 && objectRect && hit(playerRect, objectRect, 0.3, 0.22)) enterLab();
    }

    if (now >= promptUntil && promptEl.classList.contains('is-on')) {
      promptEl.classList.remove('is-on');
    }
  }

  function loop(t) {
    if (!running) return;
    const now = t;
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    lastT = now;
    if (!inLab) {
      update(reducedMotion.matches ? dt * 0.4 : dt, now);
      render(now);
    }
    requestAnimationFrame(loop);
  }

  function playLabVideo() {
    if (!labVideo || reducedMotion.matches || !labOn) return;
    labVideo.muted = true;
    const kick = () => {
      if (!labOn || reducedMotion.matches) return;
      if (labVideo.paused) labVideo.play().catch(() => {});
    };
    kick();
    labVideo.addEventListener('canplay', kick, { once: true });
    labVideo.addEventListener('loadeddata', kick, { once: true });
    requestAnimationFrame(kick);
    setTimeout(kick, 50);
    setTimeout(kick, 200);
  }

  function setLabOff() {
    labOn = false;
    if (labLight) labLight.hidden = true;
    if (labGauge) labGauge.hidden = false;
    if (labKnob) labKnob.classList.remove('is-on');
    if (labVideo) {
      labVideo.classList.remove('is-on');
      labVideo.pause();
      labVideo.currentTime = 0;
    }
    if (labPort) labPort.classList.remove('is-on');
  }

  function setLabOn() {
    labOn = true;
    if (labLight) labLight.hidden = false;
    if (labGauge) labGauge.hidden = true;
    if (labKnob) labKnob.classList.add('is-on');
    if (labPort) labPort.classList.add('is-on');
    if (labVideo) {
      labVideo.classList.add('is-on');
      playLabVideo();
    }
  }

  function enterLab() {
    if (inLab) return;
    inLab = true;
    root.classList.add('is-lab');
    promptEl.classList.remove('is-on');
    setLabOff();
    if (ambient) ambient.play('labOff');
  }

  function closeGame() {
    open = false;
    inLab = false;
    running = false;
    root.classList.remove('is-open', 'is-lab');
    root.setAttribute('aria-hidden', 'true');
    promptEl.classList.remove('is-on');
    if (deathFlash) deathFlash.classList.remove('is-flash');
    death = null;
    setLabOff();
    keys.clear();
    pointer = null;
    if (ambient) ambient.play('home');
  }

  function openGame() {
    if (window.SiteAccess && !window.SiteAccess.allows('game')) return;
    if (open) return;
    if (!assetsReady) return;
    open = true;
    inLab = false;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    root.classList.remove('is-lab');
    root.tabIndex = -1;
    root.focus({ preventScroll: true });
    resize();
    seedStreet();
    promptEl.classList.add('is-on');
    promptUntil = performance.now() + 2600;
    lastT = performance.now();
    running = true;
    if (ambient) ambient.play('street');
    requestAnimationFrame(loop);
    if (new URLSearchParams(window.location.search).has('lab')) enterLab();
  }

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (ambient) ambient.unlock();
    openGame();
  });

  window.addEventListener('resize', () => {
    if (open) resize();
  });

  window.addEventListener('keydown', (event) => {
    if (!open) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      event.preventDefault();
      closeGame();
      return;
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(key) || event.key === ' ') {
      event.preventDefault();
    }
    keys.add(key);
    if (key === ' ' || key === 'spacebar') throwBriefcase();
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (!open || inLab) return;
    canvas.setPointerCapture(event.pointerId);
    pointerOrigin = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
    pointer = toWorld(event.clientX, event.clientY);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!pointerOrigin) return;
    if (Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) > 10) {
      pointerMoved = true;
    }
    pointer = toWorld(event.clientX, event.clientY);
  });

  function endPointer(event) {
    if (!pointerOrigin) return;
    if (!pointerMoved) throwBriefcase();
    pointer = null;
    pointerOrigin = null;
    pointerMoved = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  if (labKnob) {
    labKnob.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!inLab) return;
      if (labOn) {
        setLabOff();
        if (ambient) ambient.play('labOff');
      } else {
        setLabOn();
        if (ambient) ambient.play('labOn');
      }
    });
  }

  if (labVideo) {
    labVideo.addEventListener('pause', () => {
      if (!labOn || reducedMotion.matches) return;
      if (document.visibilityState !== 'visible') return;
      labVideo.play().catch(() => {});
    });
    labVideo.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!inLab || !labOn) return;
      if (window.SiteAccess && !window.SiteAccess.allows('gallery')) return;
      if (ambient) ambient.silencePage();
      window.location.href = 'julian.html';
    });
  }

  loadSprites()
    .then(() => { assetsReady = true; })
    .catch(() => {});
})();
