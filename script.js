// Open music player in compact popup window (desktop) or in-page overlay
// (coarse pointer / popup-blocked). Same player.html in both cases.
const ambient = window.CrisisAmbient;
const openPlayerBtn = document.getElementById('open-player');
const playerShell = document.getElementById('home-player-shell');
const playerFrame = document.getElementById('home-player-frame');
const portalVideo = document.querySelector('.portal-video');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

function gameIsOpen() {
  return document.getElementById('crisis-game')?.classList.contains('is-open');
}

function playerOverlayOpen() {
  return playerShell && !playerShell.hidden;
}

function prefersInlinePlayer() {
  return coarsePointerQuery.matches;
}

function homePortalNeeded() {
  if (!portalVideo || reducedMotionQuery.matches) return false;
  if (document.hidden) return false;
  if (gameIsOpen()) return false;
  if (playerOverlayOpen()) return false;
  return true;
}

function pauseHomePortal() {
  if (!portalVideo) return;
  portalVideo.pause();
}

function resumeHomePortal() {
  if (!portalVideo || !homePortalNeeded()) return;
  portalVideo.play().catch(() => {});
}

function resumeHomePortalSoon() {
  resumeHomePortal();
  requestAnimationFrame(resumeHomePortal);
  setTimeout(resumeHomePortal, 50);
}

function startHomeAudio() {
  if (!ambient) return;
  if (gameIsOpen()) return;
  if (playerOverlayOpen()) return;
  ambient.play('home');
}

function closeInlinePlayer() {
  if (!playerShell) return;
  playerShell.hidden = true;
  if (playerFrame) playerFrame.src = 'about:blank';
  resumeHomePortalSoon();
  startHomeAudio();
}

function openInlinePlayer() {
  if (!playerShell || !playerFrame) return;
  pauseHomePortal();
  playerFrame.src = 'player.html';
  playerShell.hidden = false;
}

if (openPlayerBtn) {
  openPlayerBtn.addEventListener('click', () => {
    if (ambient) ambient.silencePage();

    if (prefersInlinePlayer()) {
      openInlinePlayer();
      return;
    }

    const w = 1000;
    const h = 650;
    const left = Math.max(0, Math.round((screen.width - w) / 2));
    const top = Math.max(0, Math.round((screen.height - h) / 2));
    const features = `width=${w},height=${h},left=${left},top=${top}`;
    const popup = window.open('player.html', 'what-crisis-player', features);
    // Fine-pointer only: do not fall back to the overlay. Some browsers
    // open the named popup but still return a null handle; overlaying
    // on null would duplicate the player on desktop.
    if (!popup) return;

    const resumeHome = () => {
      if (gameIsOpen()) return;
      resumeHomePortalSoon();
      startHomeAudio();
    };

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        resumeHome();
      }
    }, 400);
  });
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data && event.data.type === 'wc-player-close') closeInlinePlayer();
});

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!playerOverlayOpen()) return;
  closeInlinePlayer();
});

if (playerShell) {
  playerShell.addEventListener('click', (event) => {
    if (event.target === playerShell) closeInlinePlayer();
  });
}

if (ambient) {
  ambient.silencePage();
  ambient.play('home');
  const unlockHome = () => startHomeAudio();
  window.addEventListener('pointerdown', unlockHome, { once: true });
  window.addEventListener('keydown', unlockHome, { once: true });
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    if (gameIsOpen() || playerOverlayOpen()) return;
    startHomeAudio();
    resumeHomePortalSoon();
  });
}

window.addEventListener('pointerdown', () => resumeHomePortal());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseHomePortal();
  else resumeHomePortalSoon();
});

const gameRoot = document.getElementById('crisis-game');
if (gameRoot) {
  const watchGame = () => {
    if (gameIsOpen()) pauseHomePortal();
    else resumeHomePortalSoon();
  };
  watchGame();
  new MutationObserver(watchGame).observe(gameRoot, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// Portal video — reduced motion + autoplay-blocked fallback only.
if (portalVideo) {
  if (reducedMotionQuery.matches) {
    portalVideo.removeAttribute('autoplay');
    pauseHomePortal();
  } else {
    resumeHomePortal();
  }

  reducedMotionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      portalVideo.removeAttribute('autoplay');
      pauseHomePortal();
    } else {
      portalVideo.setAttribute('autoplay', '');
      resumeHomePortal();
    }
  });
}

// Inner portal alignment debug — add ?portal-debug to the URL
const heroStage = document.querySelector('.hero-stage');
const debugEnabled = new URLSearchParams(window.location.search).has('portal-debug');

if (debugEnabled && heroStage && portalVideo) {
  portalVideo.classList.add('debug');
  initPortalDebug(heroStage);
}

function initPortalDebug(stage) {
  const readVar = (name, fallback) => {
    const value = getComputedStyle(stage).getPropertyValue(name).trim();
    return value || fallback;
  };

  const parsePercent = (value) => parseFloat(value) || 0;

  let innerX = parsePercent(readVar('--portal-inner-x', '55.5%'));
  let innerY = parsePercent(readVar('--portal-inner-y', '69.5%'));
  let innerSize = parsePercent(readVar('--portal-inner-size', '11.2%'));

  const panel = document.createElement('aside');
  panel.className = 'portal-debug-panel';
  panel.innerHTML = `
    <h2>Inner Portal Alignment</h2>
    <label>
      --portal-inner-x
      <input type="range" id="debug-x" min="0" max="100" step="0.1" value="${innerX}">
      <output id="debug-x-out">${innerX}%</output>
    </label>
    <label>
      --portal-inner-y
      <input type="range" id="debug-y" min="0" max="100" step="0.1" value="${innerY}">
      <output id="debug-y-out">${innerY}%</output>
    </label>
    <label>
      --portal-inner-size
      <input type="range" id="debug-size" min="1" max="20" step="0.1" value="${innerSize}">
      <output id="debug-size-out">${innerSize}%</output>
    </label>
    <div class="portal-debug-actions">
      <button type="button" id="debug-copy">Copy CSS</button>
      <button type="button" id="debug-reset">Reset</button>
    </div>
  `;
  document.body.appendChild(panel);

  const xInput = panel.querySelector('#debug-x');
  const yInput = panel.querySelector('#debug-y');
  const sizeInput = panel.querySelector('#debug-size');
  const xOut = panel.querySelector('#debug-x-out');
  const yOut = panel.querySelector('#debug-y-out');
  const sizeOut = panel.querySelector('#debug-size-out');

  const defaults = { x: 55.5, y: 69.5, size: 11.2 };

  function applyVars() {
    stage.style.setProperty('--portal-inner-x', `${innerX}%`);
    stage.style.setProperty('--portal-inner-y', `${innerY}%`);
    stage.style.setProperty('--portal-inner-size', `${innerSize}%`);
    xOut.textContent = `${innerX}%`;
    yOut.textContent = `${innerY}%`;
    sizeOut.textContent = `${innerSize}%`;
  }

  xInput.addEventListener('input', () => {
    innerX = parseFloat(xInput.value);
    applyVars();
  });

  yInput.addEventListener('input', () => {
    innerY = parseFloat(yInput.value);
    applyVars();
  });

  sizeInput.addEventListener('input', () => {
    innerSize = parseFloat(sizeInput.value);
    applyVars();
  });

  panel.querySelector('#debug-copy').addEventListener('click', () => {
    const css = `--portal-inner-x: ${innerX}%;\n--portal-inner-y: ${innerY}%;\n--portal-inner-size: ${innerSize}%;`;
    navigator.clipboard.writeText(css).catch(() => {
      window.prompt('Copy these values into portal-config.css:', css);
    });
  });

  panel.querySelector('#debug-reset').addEventListener('click', () => {
    innerX = defaults.x;
    innerY = defaults.y;
    innerSize = defaults.size;
    xInput.value = innerX;
    yInput.value = innerY;
    sizeInput.value = innerSize;
    applyVars();
  });
}
