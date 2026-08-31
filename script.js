// Open music player in compact popup window
const openPlayerBtn = document.getElementById('open-player');

if (openPlayerBtn) {
  openPlayerBtn.addEventListener('click', () => {
    const w = 1000;
    const h = 650;
    const left = Math.max(0, Math.round((screen.width - w) / 2));
    const top = Math.max(0, Math.round((screen.height - h) / 2));
    const features = `width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`;
    const popup = window.open('player.html', 'what-crisis-player', features);
    if (!popup) window.open('player.html', '_blank');
  });
}

const ambient = window.CrisisAmbient;

function startHomeAudio() {
  if (!ambient) return;
  if (document.getElementById('crisis-game')?.classList.contains('is-open')) return;
  ambient.play('home');
}

if (ambient) {
  ambient.play('home');
  const unlockHome = () => startHomeAudio();
  window.addEventListener('pointerdown', unlockHome, { once: true });
  window.addEventListener('keydown', unlockHome, { once: true });
}

// Portal video — reduced motion + autoplay-blocked fallback only.
const portalVideo = document.querySelector('.portal-video');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (portalVideo) {
  if (reducedMotionQuery.matches) {
    portalVideo.removeAttribute('autoplay');
    portalVideo.pause();
  } else {
    portalVideo.play().catch(() => {});
  }

  reducedMotionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      portalVideo.removeAttribute('autoplay');
      portalVideo.pause();
    } else {
      portalVideo.setAttribute('autoplay', '');
      portalVideo.play().catch(() => {});
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
