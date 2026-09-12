(() => {
  const C = window.CrisisGame3Config;
  const root = document.getElementById('crisis-game3');
  const canvas = document.getElementById('crisis-game3-canvas');
  if (!C || !root || !canvas) return;

  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const view = { scale: 1, ox: 0, oy: 0, dw: 0, dh: 0 };
  const sprites = { bg: null, player: null, enemy: null, briefcase: null, cars: [] };

  let open = false;
  let running = false;
  let assetsReady = false;
  let raf = 0;
  let lastT = 0;
  let complete = false;
  let completeTimer = 0;
  let winZoom = 0;
  let winSent = false;
  let lastShotAt = -9999;
  let player = null;
  let shot = null;
  let enemies = [];
  let cars = [];
  let onKeyDown = null;
  let onKeyUp = null;
  let onResize = null;
  let onVisibility = null;
  let onBlur = null;
  let music = null;

  function ensureMusic() {
    if (music || !C.MUSIC_SRC) return;
    music = new Audio(C.MUSIC_SRC);
    music.loop = true;
    music.preload = 'auto';
    music.hidden = true;
    document.body.appendChild(music);
  }

  function startMusic() {
    ensureMusic();
    if (!music) return;
    music.play().catch(() => {});
  }

  function stopMusic() {
    if (!music) return;
    music.pause();
    music.currentTime = 0;
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
    if (opaque / (w * h) > 0.92) {
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
    if (maxX <= minX || maxY <= minY) return { canvas: off, w, h };
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

  async function loadSprites() {
    const jobs = [
      loadImage(C.BG_SRC).then((img) => {
        sprites.bg = { canvas: img, w: img.naturalWidth, h: img.naturalHeight };
      }),
      loadImage(C.PLAYER_SRC).then((img) => {
        sprites.player = punchAndCrop(img);
      }),
      loadImage(C.ENEMY_SRC).then((img) => {
        sprites.enemy = punchAndCrop(img);
      }),
      loadImage(C.BRIEFCASE_SRC).then((img) => {
        sprites.briefcase = punchAndCrop(img);
      })
    ];
    const uniqueCars = [...new Set((C.CARS || []).map((car) => car.src))];
    uniqueCars.forEach((src) => {
      jobs.push(loadImage(src).then((img) => {
        sprites.cars[src] = punchAndCrop(img);
      }));
    });
    await Promise.all(jobs);
    assetsReady = true;
  }

  function spriteSize(spr, height) {
    if (!spr) return { w: height * 0.4, h: height };
    return { w: height * (spr.w / spr.h), h: height };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scale = Math.min(cw / C.WORLD_W, ch / C.WORLD_H);
    view.scale = scale;
    view.dw = C.WORLD_W * scale;
    view.dh = C.WORLD_H * scale;
    view.ox = (cw - view.dw) / 2;
    view.oy = (ch - view.dh) / 2;
  }

  function sx(x) {
    return view.ox + x * view.scale;
  }

  function sy(y) {
    return view.oy + y * view.scale;
  }

  function boxesOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hurtBox(x, y, height, spr, spec, center) {
    const size = spriteSize(spr, height);
    const bw = Math.max(4, size.w * spec.xFrac);
    const bh = Math.max(4, size.h * spec.yFrac);
    return {
      x: x - bw / 2,
      y: center
        ? y - bh / 2
        : y - height + (height - bh) / 2 + height * (spec.yBias || 0),
      w: bw,
      h: bh
    };
  }

  function carBox(car) {
    return {
      x: car.x - car.w / 2,
      y: car.y - car.h,
      w: car.w,
      h: car.h
    };
  }

  function enemyBody(enemy) {
    const size = spriteSize(sprites.enemy, C.ENEMY_HEIGHT);
    return {
      x: enemy.x - size.w / 2,
      y: enemy.y - size.h,
      w: size.w,
      h: size.h
    };
  }

  function hitsCar(box) {
    for (let i = 0; i < cars.length; i += 1) {
      if (boxesOverlap(box, carBox(cars[i]))) return true;
    }
    return false;
  }

  function outOfBounds(x) {
    return x < C.ENEMY_MARGIN || x > C.WORLD_W - C.ENEMY_MARGIN;
  }

  function buildCars() {
    cars = (C.CARS || []).map((spec) => {
      const spr = sprites.cars[spec.src];
      const size = spriteSize(spr, spec.h);
      return {
        src: spec.src,
        x: spec.x,
        y: spec.y,
        w: size.w,
        h: spec.h
      };
    });
  }

  function spawnEnemies() {
    enemies = [];
    const total = C.ENEMY_COUNT;
    const chains = Math.max(1, C.ENEMY_CHAINS);
    const per = Math.ceil(total / chains);
    let left = total;
    for (let c = 0; c < chains && left > 0; c += 1) {
      const count = Math.min(per, left);
      const y = C.ENEMY_START_Y + c * C.ENEMY_CHAIN_GAP;
      const dir = c % 2 === 0 ? 1 : -1;
      const startX = dir > 0 ? C.ENEMY_MARGIN + 8 : C.WORLD_W - C.ENEMY_MARGIN - 8;
      for (let i = 0; i < count; i += 1) {
        enemies.push({
          x: startX + dir * i * C.ENEMY_SPACING,
          y,
          vx: dir * C.ENEMY_SPEED
        });
      }
      left -= count;
    }
  }

  function resetPlayer() {
    player = {
      x: C.PLAYER_START_X,
      y: C.PLAYER_Y,
      facing: 1,
      spin: 0
    };
  }

  function clearShot() {
    shot = null;
  }

  function clearComplete() {
    if (completeTimer) {
      window.clearTimeout(completeTimer);
      completeTimer = 0;
    }
    complete = false;
    winZoom = 0;
    winSent = false;
  }

  function resetRun() {
    clearComplete();
    clearShot();
    lastShotAt = -9999;
    resetPlayer();
    buildCars();
    spawnEnemies();
    lastT = performance.now();
  }

  function fireShot(now) {
    if (complete || shot || !player) return;
    if (now - lastShotAt < C.SHOT_COOLDOWN_MS) return;
    lastShotAt = now;
    shot = {
      x: player.x,
      y: player.y - C.PLAYER_HEIGHT * 0.62,
      vy: -C.SHOT_SPEED,
      angle: 0
    };
  }

  function sendComplete() {
    if (winSent) return;
    winSent = true;
    window.__wcGame3Won = true;
    window.dispatchEvent(new CustomEvent('wc-game3-complete', {
      detail: { at: performance.now() }
    }));
    if (typeof window.onMiniGame3Complete === 'function') {
      window.onMiniGame3Complete();
    }
  }

  function finishGame() {
    if (complete) return;
    complete = true;
    clearShot();
    winZoom = 0;
    winSent = false;
    if (player) player.spin = 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      winZoom = 1;
      completeTimer = window.setTimeout(() => {
        completeTimer = 0;
        sendComplete();
      }, C.COMPLETE_MS || 200);
    }
  }

  function updateWin(dt) {
    if (!complete || winSent) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ms = C.WIN_ZOOM_MS || 1300;
    winZoom = Math.min(1, winZoom + (dt * 1000) / ms);
    if (player) {
      player.spin = (player.spin || 0) + (C.WIN_SPIN || 16) * (1 + winZoom * 2.4) * dt;
    }
    if (winZoom >= 1 && !completeTimer) {
      completeTimer = window.setTimeout(() => {
        completeTimer = 0;
        sendComplete();
      }, C.WIN_HOLD_MS || 420);
    }
  }

  function canonicalKey(event) {
    const code = event.code || '';
    if (code === 'ArrowLeft' || code === 'KeyA') return code === 'KeyA' ? 'a' : 'arrowleft';
    if (code === 'ArrowRight' || code === 'KeyD') return code === 'KeyD' ? 'd' : 'arrowright';
    if (code === 'Space') return ' ';
    const key = (event.key || '').toLowerCase();
    if (key === 'left') return 'arrowleft';
    if (key === 'right') return 'arrowright';
    if (key === 'spacebar' || key === 'space') return ' ';
    return key;
  }

  function isGameKey(key) {
    return ['arrowleft', 'arrowright', ' ', 'a', 'd'].includes(key);
  }

  function keyHeld(name) {
    return keys.has(name);
  }

  function updatePlayer(dt, now) {
    if (!player || complete) return;
    const left = keyHeld('arrowleft') || keyHeld('a');
    const right = keyHeld('arrowright') || keyHeld('d');
    if (left && !right) {
      player.x -= C.PLAYER_SPEED * dt;
      player.facing = -1;
    } else if (right && !left) {
      player.x += C.PLAYER_SPEED * dt;
      player.facing = 1;
    }
    player.x = Math.max(22, Math.min(C.WORLD_W - 22, player.x));
    if (keyHeld(' ')) fireShot(now);
  }

  function updateShot(dt) {
    if (!shot) return;
    shot.y += shot.vy * dt;
    shot.angle += C.SHOT_SPIN * dt;
    if (shot.y < -20) {
      clearShot();
      return;
    }
    const box = hurtBox(shot.x, shot.y, C.SHOT_HEIGHT, sprites.briefcase, C.SHOT_HURT, true);
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      const eBox = hurtBox(enemy.x, enemy.y, C.ENEMY_HEIGHT, sprites.enemy, C.ENEMY_HURT, false);
      if (boxesOverlap(box, eBox)) {
        enemies.splice(i, 1);
        clearShot();
        if (enemies.length === 0) finishGame();
        return;
      }
    }
  }

  function turnEnemy(enemy) {
    enemy.y += C.ENEMY_STEP;
    enemy.vx *= -1;
    enemy.x += Math.sign(enemy.vx) * C.ENEMY_NUDGE;
    enemy.x = Math.max(C.ENEMY_MARGIN, Math.min(C.WORLD_W - C.ENEMY_MARGIN, enemy.x));
  }

  function updateEnemies(dt) {
    if (complete) return;
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      const nextX = enemy.x + enemy.vx * dt;
      const probe = enemyBody({ x: nextX, y: enemy.y });
      if (outOfBounds(nextX) || hitsCar(probe)) turnEnemy(enemy);
      else enemy.x = nextX;
    }
  }

  function checkPlayerHit() {
    if (!player || complete) return;
    const pBox = hurtBox(player.x, player.y, C.PLAYER_HEIGHT, sprites.player, C.PLAYER_HURT, false);
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      const eBox = hurtBox(enemy.x, enemy.y, C.ENEMY_HEIGHT, sprites.enemy, C.ENEMY_HURT, false);
      if (enemy.y >= C.PLAYER_DANGER_Y || boxesOverlap(eBox, pBox)) {
        resetRun();
        return;
      }
    }
  }

  function drawSprite(spr, x, y, height, opts = {}) {
    if (!spr) return;
    const size = spriteSize(spr, height);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    if (opts.flip) ctx.scale(-1, 1);
    if (opts.angle) ctx.rotate(opts.angle);
    const dw = size.w * view.scale;
    const dh = size.h * view.scale;
    const ox = -dw / 2;
    const oy = opts.center ? -dh / 2 : -dh;
    ctx.drawImage(spr.canvas, ox, oy, dw, dh);
    ctx.restore();
  }

  function drawBackground(cw, ch) {
    const bg = sprites.bg;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    if (!bg) return;
    const zoom = C.BG_ZOOM || 1;
    const scale = Math.max(cw / bg.w, ch / bg.h) * zoom;
    const dw = bg.w * scale;
    const dh = bg.h * scale;
    const fx = C.BG_FOCUS_X == null ? 0.5 : C.BG_FOCUS_X;
    const fy = C.BG_FOCUS_Y == null ? 0.5 : C.BG_FOCUS_Y;
    const ox = Math.min(0, Math.max(cw - dw, cw / 2 - dw * fx));
    const oy = Math.min(0, Math.max(ch - dh, ch / 2 - dh * fy));
    ctx.drawImage(bg.canvas, ox, oy, dw, dh);
  }

  function render() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    ctx.save();
    if (complete && player && winZoom > 0) {
      const cam = 1 + winZoom * ((C.WIN_ZOOM_SCALE || 5.2) - 1);
      const px = sx(player.x);
      const py = sy(player.y - C.PLAYER_HEIGHT * 0.52);
      ctx.translate(cw / 2, ch / 2);
      ctx.scale(cam, cam);
      ctx.translate(-px, -py);
    }

    drawBackground(cw, ch);

    cars.forEach((car) => {
      const spr = sprites.cars[car.src];
      if (spr) drawSprite(spr, car.x, car.y, car.h);
    });

    enemies.forEach((enemy) => {
      drawSprite(sprites.enemy, enemy.x, enemy.y, C.ENEMY_HEIGHT, { flip: enemy.vx > 0 });
    });

    if (shot) {
      drawSprite(sprites.briefcase, shot.x, shot.y, C.SHOT_HEIGHT, {
        center: true,
        angle: shot.angle
      });
    }

    if (player) {
      if (complete) {
        drawSprite(sprites.player, player.x, player.y - C.PLAYER_HEIGHT * 0.5, C.PLAYER_HEIGHT, {
          center: true,
          angle: player.spin || 0
        });
      } else {
        drawSprite(sprites.player, player.x, player.y, C.PLAYER_HEIGHT, { flip: player.facing < 0 });
      }
    }
    ctx.restore();
  }

  function loop(t) {
    if (!running) return;
    const now = t;
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    lastT = now;
    if (!complete) {
      updatePlayer(dt, now);
      updateShot(dt);
      updateEnemies(dt);
      checkPlayerHit();
    } else {
      updateWin(dt);
    }
    render();
    raf = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    running = false;
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function focusPlayfield() {
    root.tabIndex = -1;
    canvas.tabIndex = -1;
    const active = document.activeElement;
    if (active && active !== root && active !== canvas && active.blur) active.blur();
    root.focus({ preventScroll: true });
  }

  function setPageIdle(on) {
    const well = document.getElementById('well-viewport');
    const gallery = document.getElementById('julian-gallery');
    const artwork = document.getElementById('julian-artwork');
    if (well) well.inert = !!on;
    if (gallery) gallery.inert = !!on;
    if (artwork) artwork.inert = !!on;
  }

  function onPointerDown() {
    if (!open) return;
    startMusic();
    focusPlayfield();
  }

  function bindInput() {
    if (onKeyDown) return;
    onKeyDown = (event) => {
      if (!open) return;
      startMusic();
      const key = canonicalKey(event);
      if (!isGameKey(key)) return;
      event.preventDefault();
      keys.add(key);
      if (key === ' ') fireShot(performance.now());
    };
    onKeyUp = (event) => {
      keys.delete(canonicalKey(event));
    };
    onResize = () => {
      if (open) resize();
    };
    onBlur = () => {
      keys.clear();
    };
    onVisibility = () => {
      if (!open) return;
      if (document.visibilityState === 'hidden') {
        stopLoop();
        keys.clear();
        if (music) music.pause();
      } else if (!running) {
        lastT = performance.now();
        running = true;
        raf = window.requestAnimationFrame(loop);
        focusPlayfield();
        startMusic();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    root.addEventListener('pointerdown', onPointerDown);
  }

  function unbindInput() {
    if (!onKeyDown) return;
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibility);
    root.removeEventListener('pointerdown', onPointerDown);
    onKeyDown = null;
    onKeyUp = null;
    onResize = null;
    onVisibility = null;
    onBlur = null;
    keys.clear();
  }

  function enter() {
    if (open) return;
    open = true;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    setPageIdle(true);
    bindInput();
    focusPlayfield();
    resize();
    resetRun();
    running = true;
    raf = window.requestAnimationFrame(loop);
    startMusic();
    if (!assetsReady) {
      loadSprites().then(() => {
        if (open) {
          buildCars();
          resize();
        }
      }).catch(() => {});
    }
  }

  function exit() {
    if (!open && !running) return;
    open = false;
    stopMusic();
    stopLoop();
    clearComplete();
    clearShot();
    enemies = [];
    cars = [];
    player = null;
    unbindInput();
    setPageIdle(false);
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
  }

  loadSprites().catch(() => {});

  window.CrisisGame3 = {
    enter,
    exit,
    get complete() {
      return complete;
    },
    get debug() {
      return {
        open,
        running,
        complete,
        winZoom,
        enemyCount: enemies.length,
        hasShot: !!shot,
        keys: [...keys],
        player: player && { x: player.x, y: player.y }
      };
    }
  };

  const wellBoot = new URLSearchParams(window.location.search);
  if (document.getElementById('well-viewport')
    && !wellBoot.has('photo')
    && !wellBoot.has('class')
    && !wellBoot.has('game2')
    && !wellBoot.has('well-end')) {
    enter();
  }
})();
