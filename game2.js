(() => {
  const C = window.CrisisGame2Config;
  const root = document.getElementById('crisis-game2');
  const canvas = document.getElementById('crisis-game2-canvas');
  if (!C || !root || !canvas) return;

  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const debugEnabled = new URLSearchParams(window.location.search).has('game2-debug');
  const deathFlash = document.getElementById('crisis-game2-fire');

  const view = { scale: 1, ox: 0, oy: 0, dw: 0, dh: 0 };
  const sprites = { player: null, thrower: null, head: null, fireball: null, object: null, space: null };

  let open = false;
  let running = false;
  let assetsReady = false;
  let raf = 0;
  let spawnTimer = 0;
  let spawnEpoch = 0;
  let deathTimer = 0;
  let lastT = 0;
  let reachedTop = false;
  let portalZoom = 0;
  let portalZooming = false;
  let portalSent = false;
  let dead = false;
  let death = null;
  let player = null;
  let heads = [];
  let currentWave = 1;
  let spawnedInWave = 0;
  let triggeredWaves = new Set();
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

  function tierById(id) {
    return C.TIERS.find((tier) => tier.id === id);
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

  function makePlaceholderHead() {
    const s = C.HEAD_PLACEHOLDER_SIZE;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const g = c.getContext('2d');
    const r = s * 0.42;
    g.translate(s / 2, s / 2);
    g.fillStyle = C.COLORS.headFill;
    g.beginPath();
    g.ellipse(0, 1, r, r * 1.08, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = C.COLORS.headRim;
    g.lineWidth = s * 0.07;
    g.stroke();
    g.fillStyle = C.COLORS.headRim;
    g.globalAlpha = 0.35;
    g.beginPath();
    g.ellipse(-r * 0.22, -r * 0.18, r * 0.16, r * 0.12, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(r * 0.24, -r * 0.16, r * 0.16, r * 0.12, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    return { canvas: c, w: s, h: s };
  }

  async function loadSprites() {
    const jobs = [];
    if (C.PLAYER_SRC) {
      jobs.push(loadImage(C.PLAYER_SRC).then((img) => {
        sprites.player = punchAndCrop(img);
      }));
    }
    if (C.THROWER_SRC) {
      jobs.push(loadImage(C.THROWER_SRC).then((img) => {
        sprites.thrower = punchAndCrop(img);
      }));
    }
    if (C.FIREBALL_SRC) {
      jobs.push(loadImage(C.FIREBALL_SRC).then((img) => {
        sprites.fireball = punchAndCrop(img);
      }));
    }
    if (C.OBJECT_SRC) {
      jobs.push(loadImage(C.OBJECT_SRC).then((img) => {
        sprites.object = punchAndCrop(img);
      }));
    }
    if (C.HEAD_SRC) {
      jobs.push(loadImage(C.HEAD_SRC).then((img) => {
        sprites.head = punchAndCrop(img);
      }));
    }
    if (C.SPACE_SRC) {
      jobs.push(loadImage(C.SPACE_SRC).then((img) => {
        sprites.space = { canvas: img, w: img.naturalWidth, h: img.naturalHeight };
      }));
    }
    await Promise.all(jobs);
    if (!sprites.head) sprites.head = makePlaceholderHead();
    assetsReady = true;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    applyView();
  }

  function applyView() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const base = Math.min(cw / C.WORLD_W, ch / C.WORLD_H);
    view.dw = C.WORLD_W * base;
    view.dh = C.WORLD_H * base;
    if (!reachedTop || portalZoom <= 0) {
      view.scale = base;
      view.ox = (cw - view.dw) / 2;
      view.oy = (ch - view.dh) / 2;
      return;
    }
    const t = portalZoom * portalZoom * (3 - 2 * portalZoom);
    const obj = objectPos();
    const fill = Math.min(cw, ch) * (C.PORTAL_ZOOM_FILL || 2.4) / C.OBJECT_HEIGHT;
    view.scale = base + (fill - base) * t;
    view.ox = cw / 2 - obj.x * view.scale;
    view.oy = ch / 2 - obj.y * view.scale;
  }

  function sx(x) {
    return view.ox + x * view.scale;
  }

  function sy(y) {
    return view.oy + y * view.scale;
  }

  function clearSpawn() {
    spawnEpoch += 1;
    if (spawnTimer) {
      window.clearTimeout(spawnTimer);
      spawnTimer = 0;
    }
  }

  function clearDeath() {
    if (deathTimer) {
      window.clearTimeout(deathTimer);
      deathTimer = 0;
    }
  }

  function stopLoop() {
    running = false;
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function resetPlayer() {
    const tier = tierById(C.PLAYER_START_TIER);
    player = {
      x: C.PLAYER_START_X,
      y: tier.y,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      climbing: false,
      ladder: null,
      tierId: tier.id
    };
  }

  function resetRun() {
    clearSpawn();
    clearDeath();
    heads = [];
    currentWave = 1;
    spawnedInWave = 0;
    triggeredWaves = new Set();
    dead = false;
    death = null;
    reachedTop = false;
    portalZoom = 0;
    portalZooming = false;
    portalSent = false;
    if (deathFlash) deathFlash.classList.remove('is-flash');
    resetPlayer();
    lastT = performance.now();
  }

  function waveSize() {
    return C.HEAD_WAVE || 2;
  }

  function spawnHead() {
    if (!open || !running || dead || reachedTop) return;
    if (spawnedInWave >= waveSize()) return;
    if (heads.length >= (C.HEAD_MAX || 12)) return;
    const tier = tierById(C.THROWER_TIER);
    const dir = tier.dir || 1;
    spawnedInWave += 1;
    heads.push({
      x: C.THROWER_X + C.HEAD_SPAWN_OFFSET_X * dir,
      y: tier.y - C.HEAD_RADIUS,
      vx: dir * C.HEAD_SPEED,
      vy: 0,
      angle: 0,
      state: 'roll',
      tierId: tier.id,
      wave: currentWave,
      bounced: false,
      dropTo: null
    });
  }

  function scheduleSpawn(delay) {
    spawnEpoch += 1;
    const epoch = spawnEpoch;
    if (spawnTimer) {
      window.clearTimeout(spawnTimer);
      spawnTimer = 0;
    }
    if (!open || !running || dead || reachedTop) return;
    if (spawnedInWave >= waveSize()) return;
    spawnTimer = window.setTimeout(() => {
      spawnTimer = 0;
      if (epoch !== spawnEpoch || !open || !running || dead || reachedTop) return;
      spawnHead();
      if (spawnedInWave < waveSize()) scheduleSpawn(C.HEAD_SPAWN_INTERVAL_MS);
    }, delay);
  }

  function maybeStartNextWave(head, landedTier) {
    if (dead || reachedTop || !head) return;
    const trigger = C.HEAD_WAVE_TRIGGER_TIER;
    if (!trigger || landedTier !== trigger) return;
    if (triggeredWaves.has(head.wave)) return;
    triggeredWaves.add(head.wave);
    currentWave += 1;
    spawnedInWave = 0;
    scheduleSpawn(C.HEAD_WAVE_NEXT_MS || 0);
  }

  function killPlayer() {
    if (dead || reachedTop || death) return;
    dead = true;
    death = {
      x: player.x,
      y: player.y - C.PLAYER_HEIGHT * 0.5,
      h: C.PLAYER_HEIGHT
    };
    if (deathFlash) {
      deathFlash.classList.remove('is-flash');
      void deathFlash.offsetWidth;
      deathFlash.classList.add('is-flash');
    }
    heads = [];
    clearSpawn();
    deathTimer = window.setTimeout(() => {
      deathTimer = 0;
      resetRun();
      if (!open) return;
      if (document.visibilityState === 'visible') {
        if (!running) {
          running = true;
          lastT = performance.now();
          raf = window.requestAnimationFrame(loop);
        }
        scheduleSpawn(C.HEAD_SPAWN_FIRST_MS);
      }
    }, C.DEATH_RESET_MS);
  }

  function sendToPortal() {
    if (portalSent) return;
    portalSent = true;
    window.dispatchEvent(new CustomEvent('wc-game2-complete', {
      detail: { at: performance.now() }
    }));
  }

  function markReachedTop() {
    if (reachedTop || dead) return;
    reachedTop = true;
    clearSpawn();
    heads = [];
    portalZoom = 0;
    portalZooming = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      portalZoom = 1;
      portalZooming = false;
      sendToPortal();
    }
  }

  function updatePortalZoom(dt) {
    if (!portalZooming || !reachedTop) return;
    const ms = C.PORTAL_ZOOM_MS || 1600;
    portalZoom = Math.min(1, portalZoom + (dt * 1000) / ms);
    if (portalZoom >= 1) {
      portalZooming = false;
      sendToPortal();
    }
  }

  function overlappingLadder(px, py) {
    for (let i = 0; i < C.LADDERS.length; i += 1) {
      const lad = C.LADDERS[i];
      const from = tierById(lad.from);
      const to = tierById(lad.to);
      if (Math.abs(px - lad.x) > C.CLIMB_RANGE) continue;
      if (py < to.y - 8 || py > from.y + 8) continue;
      return lad;
    }
    return null;
  }

  function onPlatformX(tier, x) {
    return x >= tier.left && x <= tier.right;
  }

  function landOn(tier) {
    player.y = tier.y;
    player.vy = 0;
    player.grounded = true;
    player.climbing = false;
    player.ladder = null;
    player.tierId = tier.id;
  }

  function pressKey(name) {
    if (!name) return;
    keys.add(name);
  }

  function releaseKey(name) {
    keys.delete(name);
  }

  function keyHeld(name) {
    return keys.has(name);
  }

  function updatePlayer(dt) {
    if (dead || reachedTop) return;

    const left = keyHeld('arrowleft') || keyHeld('a');
    const right = keyHeld('arrowright') || keyHeld('d');
    const up = keyHeld('arrowup') || keyHeld('w');
    const down = keyHeld('arrowdown') || keyHeld('s');
    const jump = keyHeld(' ');

    const lad = overlappingLadder(player.x, player.y);

    if (!player.climbing && lad) {
      const from = tierById(lad.from);
      const to = tierById(lad.to);
      const canUp = up && player.y > to.y + 2;
      const canDown = down && player.y < from.y - 2;
      if (canUp || canDown) {
        player.climbing = true;
        player.grounded = false;
        player.ladder = lad;
        player.x = lad.x;
        player.vy = 0;
      }
    }

    if (player.climbing && player.ladder) {
      const from = tierById(player.ladder.from);
      const to = tierById(player.ladder.to);
      player.x = player.ladder.x;
      if (up) player.y -= C.CLIMB_SPEED * dt;
      if (down) player.y += C.CLIMB_SPEED * dt;
      if (player.y < to.y) player.y = to.y;
      if (player.y > from.y) player.y = from.y;
      if (left || right) player.facing = left ? -1 : 1;

      if (player.y <= to.y + 0.5 && !down) {
        landOn(to);
      } else if (player.y >= from.y - 0.5 && !up) {
        landOn(from);
      }
      return;
    }

    if (left && !right) {
      player.x -= C.PLAYER_SPEED * dt;
      player.facing = -1;
    } else if (right && !left) {
      player.x += C.PLAYER_SPEED * dt;
      player.facing = 1;
    }

    if (jump && player.grounded) {
      player.grounded = false;
      player.vy = -C.PLAYER_JUMP;
    }

    const prevY = player.y;
    if (!player.grounded) {
      player.vy += C.GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.vy >= 0) {
        for (let i = 0; i < C.TIERS.length; i += 1) {
          const tier = C.TIERS[i];
          if (!onPlatformX(tier, player.x)) continue;
          if (prevY <= tier.y + 2 && player.y >= tier.y && player.vy >= 0) {
            landOn(tier);
            break;
          }
        }
      }
    } else {
      const tier = tierById(player.tierId);
      if (!tier || !onPlatformX(tier, player.x)) {
        player.grounded = false;
      } else {
        player.y = tier.y;
        player.vy = 0;
      }
    }

    player.x = Math.max(16, Math.min(C.WORLD_W - 16, player.x));
    if (player.y > C.WORLD_H + 40) killPlayer();
  }

  function dropFor(tierId, x, vx) {
    for (let i = 0; i < C.DROPS.length; i += 1) {
      const drop = C.DROPS[i];
      if (drop.from !== tierId) continue;
      const approaching = (vx > 0 && x >= drop.x) || (vx < 0 && x <= drop.x);
      if (approaching) return drop;
    }
    return null;
  }

  function updateHeads(dt) {
    const keep = [];
    for (let i = 0; i < heads.length; i += 1) {
      const head = heads[i];
      head.angle += C.HEAD_SPIN * dt * (head.vx >= 0 ? 1 : -1);

      if (head.state === 'roll') {
        head.x += head.vx * dt;
        const tier = tierById(head.tierId);
        if (tier) head.y = tier.y - C.HEAD_RADIUS;
        const drop = dropFor(head.tierId, head.x, head.vx);
        if (drop) {
          head.state = 'drop';
          head.dropTo = drop.to;
          head.x = drop.x;
          head.vy = 0;
          head.bounced = false;
        }
      } else if (head.state === 'drop') {
        head.vy += C.GRAVITY * dt;
        head.y += head.vy * dt;
        head.x += head.vx * C.HEAD_DROP_DRIFT * dt;
        const next = tierById(head.dropTo);
        const landY = next ? next.y - C.HEAD_RADIUS : C.WORLD_H + 80;
        if (head.y >= landY) {
          head.y = landY;
          if (next) maybeStartNextWave(head, next.id);
          if (!head.bounced) {
            head.vy = -C.HEAD_BOUNCE;
            head.bounced = true;
          } else if (head.vy >= 0) {
            if (!next) continue;
            head.state = 'roll';
            head.tierId = next.id;
            head.vx = (next.dir || 1) * C.HEAD_SPEED;
            head.vy = 0;
            head.dropTo = null;
            head.bounced = false;
          }
        }
      }

      if (head.x < -40 || head.x > C.WORLD_W + 40 || head.y > C.WORLD_H + 50) continue;
      keep.push(head);
    }
    heads = keep;
  }

  function playerHurtBox() {
    const h = C.PLAYER_HEIGHT;
    const spr = sprites.player;
    const w = spr ? h * (spr.w / spr.h) : h * 0.38;
    const spec = C.PLAYER_HURT;
    const bw = Math.max(4, w * spec.xFrac);
    const bh = Math.max(4, h * spec.yFrac);
    return {
      x: player.x - bw / 2,
      y: player.y - h + (h - bh) / 2 + h * (spec.yBias || 0),
      w: bw,
      h: bh
    };
  }

  function circleHitsBox(cx, cy, r, box) {
    const nx = Math.max(box.x, Math.min(cx, box.x + box.w));
    const ny = Math.max(box.y, Math.min(cy, box.y + box.h));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  function checkCollisions() {
    if (dead || reachedTop || !player) return;
    const box = playerHurtBox();
    for (let i = 0; i < heads.length; i += 1) {
      if (circleHitsBox(heads[i].x, heads[i].y, C.HEAD_HURT_RADIUS, box)) {
        killPlayer();
        return;
      }
    }
  }

  function objectPos() {
    const tier = tierById(C.OBJECT_TIER);
    return {
      x: C.OBJECT_X,
      y: tier.y - C.OBJECT_LIFT
    };
  }

  function objectBox() {
    const pos = objectPos();
    const h = C.OBJECT_HEIGHT;
    const spr = sprites.object;
    const w = spr ? h * (spr.w / spr.h) : h;
    const spec = C.OBJECT_HURT;
    const bw = Math.max(8, w * spec.xFrac);
    const bh = Math.max(8, h * spec.yFrac);
    return {
      x: pos.x - bw / 2,
      y: pos.y - bh / 2,
      w: bw,
      h: bh
    };
  }

  function boxesOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function checkGoal() {
    if (dead || reachedTop || !player) return;
    if (boxesOverlap(playerHurtBox(), objectBox())) markReachedTop();
  }

  function drawWorldRect(x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(sx(x), sy(y), w * view.scale, h * view.scale);
  }

  function drawSprite(spr, x, y, height, opts = {}) {
    if (!spr) return;
    const w = height * (spr.w / spr.h);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    if (opts.flip) ctx.scale(-1, 1);
    if (opts.angle) ctx.rotate(opts.angle);
    const dw = w * view.scale;
    const dh = height * view.scale;
    const ox = -dw / 2;
    const oy = opts.center ? -dh / 2 : -dh;
    ctx.drawImage(spr.canvas, ox, oy, dw, dh);
    ctx.restore();
  }

  function drawFallbackPerson(x, y, height, fill) {
    const w = height * 0.34;
    ctx.fillStyle = fill;
    ctx.fillRect(sx(x - w / 2), sy(y - height), w * view.scale, height * view.scale);
  }

  function drawLadders() {
    const w = C.LADDER_WIDTH;
    ctx.strokeStyle = C.COLORS.ladder;
    ctx.lineWidth = Math.max(1.5, 2.2 * view.scale);
    C.LADDERS.forEach((lad) => {
      const from = tierById(lad.from);
      const to = tierById(lad.to);
      const left = lad.x - w / 2;
      const right = lad.x + w / 2;
      ctx.beginPath();
      ctx.moveTo(sx(left), sy(to.y));
      ctx.lineTo(sx(left), sy(from.y));
      ctx.moveTo(sx(right), sy(to.y));
      ctx.lineTo(sx(right), sy(from.y));
      for (let y = to.y + C.LADDER_RUNG; y < from.y; y += C.LADDER_RUNG) {
        ctx.moveTo(sx(left), sy(y));
        ctx.lineTo(sx(right), sy(y));
      }
      ctx.stroke();
    });
  }

  function drawTiers() {
    const t = C.PLATFORM_THICKNESS;
    C.TIERS.forEach((tier) => {
      drawWorldRect(tier.left, tier.y, tier.right - tier.left, t, C.COLORS.girder);
      drawWorldRect(tier.left, tier.y, tier.right - tier.left, 3, C.COLORS.girderLip);
    });
  }

  function drawDebug() {
    if (!debugEnabled) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 80, 54, 0.85)';
    ctx.lineWidth = 1;
    C.LADDERS.forEach((lad) => {
      const from = tierById(lad.from);
      const to = tierById(lad.to);
      ctx.strokeRect(sx(lad.x - C.CLIMB_RANGE), sy(to.y), C.CLIMB_RANGE * 2 * view.scale, (from.y - to.y) * view.scale);
    });
    C.DROPS.forEach((drop) => {
      const tier = tierById(drop.from);
      ctx.beginPath();
      ctx.arc(sx(drop.x), sy(tier.y), 5 * view.scale, 0, Math.PI * 2);
      ctx.stroke();
    });
    const goal = objectBox();
    ctx.strokeStyle = 'rgba(80, 200, 120, 0.9)';
    ctx.strokeRect(sx(goal.x), sy(goal.y), goal.w * view.scale, goal.h * view.scale);
    if (player) {
      const box = playerHurtBox();
      ctx.strokeStyle = 'rgba(255, 220, 80, 0.9)';
      ctx.strokeRect(sx(box.x), sy(box.y), box.w * view.scale, box.h * view.scale);
    }
    ctx.restore();
  }

  function drawSpace(cw, ch) {
    const bg = sprites.space;
    ctx.fillStyle = C.COLORS.letterbox;
    ctx.fillRect(0, 0, cw, ch);
    if (!bg) return;
    const scale = Math.max(cw / bg.w, ch / bg.h);
    const dw = bg.w * scale;
    const dh = bg.h * scale;
    const fx = C.SPACE_FOCUS_X == null ? 0.5 : C.SPACE_FOCUS_X;
    const fy = C.SPACE_FOCUS_Y == null ? 0.5 : C.SPACE_FOCUS_Y;
    const ox = Math.min(0, Math.max(cw - dw, cw / 2 - dw * fx));
    const oy = Math.min(0, Math.max(ch - dh, ch / 2 - dh * fy));
    ctx.drawImage(bg.canvas, ox, oy, dw, dh);
  }

  function render() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    drawSpace(cw, ch);

    drawLadders();
    drawTiers();

    const objectTier = tierById(C.OBJECT_TIER);
    const obj = objectPos();
    if (sprites.object) {
      drawSprite(sprites.object, obj.x, obj.y, C.OBJECT_HEIGHT, { center: true });
    } else if (objectTier) {
      ctx.beginPath();
      ctx.fillStyle = '#2a4a6a';
      ctx.arc(sx(obj.x), sy(obj.y), (C.OBJECT_HEIGHT * 0.5) * view.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    const throwTier = tierById(C.THROWER_TIER);
    if (sprites.thrower) {
      drawSprite(sprites.thrower, C.THROWER_X, throwTier.y, C.THROWER_HEIGHT, { flip: C.THROWER_FLIP });
    } else {
      drawFallbackPerson(C.THROWER_X, throwTier.y, C.THROWER_HEIGHT, '#1a1410');
    }

    heads.forEach((head) => {
      if (sprites.head) {
        drawSprite(sprites.head, head.x, head.y, C.HEAD_RADIUS * 2, {
          center: true,
          angle: head.angle
        });
      } else {
        ctx.beginPath();
        ctx.fillStyle = C.COLORS.headFill;
        ctx.arc(sx(head.x), sy(head.y), C.HEAD_RADIUS * view.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (player && !dead && !reachedTop) {
      if (sprites.player) {
        drawSprite(sprites.player, player.x, player.y, C.PLAYER_HEIGHT, { flip: player.facing < 0 });
      } else {
        drawFallbackPerson(player.x, player.y, C.PLAYER_HEIGHT, '#2a2420');
      }
    } else if (death && sprites.fireball) {
      drawSprite(sprites.fireball, death.x, death.y, death.h, { center: true });
    }

    drawDebug();
  }

  function loop(t) {
    if (!running) return;
    const now = t;
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    lastT = now;
    if (!dead && !reachedTop) {
      updatePlayer(dt);
      updateHeads(dt);
      checkCollisions();
      checkGoal();
    }
    updatePortalZoom(dt);
    applyView();
    render();
    raf = window.requestAnimationFrame(loop);
  }

  function canonicalKey(event) {
    const code = event.code || '';
    if (code === 'ArrowLeft' || code === 'KeyA') return code === 'KeyA' ? 'a' : 'arrowleft';
    if (code === 'ArrowRight' || code === 'KeyD') return code === 'KeyD' ? 'd' : 'arrowright';
    if (code === 'ArrowUp' || code === 'KeyW') return code === 'KeyW' ? 'w' : 'arrowup';
    if (code === 'ArrowDown' || code === 'KeyS') return code === 'KeyS' ? 's' : 'arrowdown';
    if (code === 'Space') return ' ';
    const key = (event.key || '').toLowerCase();
    if (key === 'left') return 'arrowleft';
    if (key === 'right') return 'arrowright';
    if (key === 'up') return 'arrowup';
    if (key === 'down') return 'arrowdown';
    if (key === 'spacebar' || key === 'space') return ' ';
    return key;
  }

  function isGameKey(key) {
    return ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(key);
  }

  function focusPlayfield() {
    root.tabIndex = -1;
    canvas.tabIndex = -1;
    const active = document.activeElement;
    if (active && active !== root && active !== canvas && active.blur) active.blur();
    root.focus({ preventScroll: true });
  }

  function setWellIdle(on) {
    const well = document.getElementById('well-viewport');
    if (well) well.inert = !!on;
  }

  function bindInput() {
    if (onKeyDown) return;
    onKeyDown = (event) => {
      if (!open) return;
      const key = canonicalKey(event);
      if (!isGameKey(key)) return;
      event.preventDefault();
      pressKey(key);
    };
    onKeyUp = (event) => {
      releaseKey(canonicalKey(event));
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
        clearSpawn();
        keys.clear();
        if (music) music.pause();
      } else if (!running) {
        lastT = performance.now();
        running = true;
        raf = window.requestAnimationFrame(loop);
        if (!dead && !reachedTop) scheduleSpawn(C.HEAD_SPAWN_INTERVAL_MS);
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

  function onPointerDown() {
    if (!open) return;
    startMusic();
    focusPlayfield();
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
    setWellIdle(true);
    bindInput();
    focusPlayfield();
    resize();
    resetRun();
    running = true;
    raf = window.requestAnimationFrame(loop);
    scheduleSpawn(C.HEAD_SPAWN_FIRST_MS);
    startMusic();
    if (!assetsReady) {
      loadSprites().catch(() => {
        if (!sprites.head) sprites.head = makePlaceholderHead();
        assetsReady = true;
      });
    }
  }

  function exit() {
    if (!open && !running) return;
    open = false;
    running = false;
    reachedTop = false;
    portalZoom = 0;
    portalZooming = false;
    portalSent = false;
    dead = false;
    death = null;
    if (deathFlash) deathFlash.classList.remove('is-flash');
    stopMusic();
    stopLoop();
    clearSpawn();
    clearDeath();
    heads = [];
    player = null;
    unbindInput();
    setWellIdle(false);
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
  }

  loadSprites().catch(() => {
    if (!sprites.head) sprites.head = makePlaceholderHead();
    assetsReady = true;
  });

  window.CrisisGame2 = {
    enter,
    exit,
    complete: markReachedTop,
    get reachedTop() {
      return reachedTop;
    },
    get debug() {
      return {
        open,
        running,
        dead,
        reachedTop,
        portalZoom,
        headCount: heads.length,
        currentWave,
        spawnedInWave,
        triggeredWaves: [...triggeredWaves],
        spawnTimer: !!spawnTimer,
        keys: [...keys],
        player: player && { x: player.x, y: player.y, grounded: player.grounded, climbing: player.climbing, tierId: player.tierId },
        heads: heads.map((head) => ({
          x: Math.round(head.x),
          y: Math.round(head.y),
          state: head.state,
          tierId: head.tierId
        }))
      };
    }
  };
})();
