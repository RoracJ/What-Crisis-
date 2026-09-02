(() => {
  /*
   * Head centers as % of the photograph (left/top + translate -50%,-50%).
   * size is Object diameter as % of photograph width.
   * Julian's dad (bottom row, second from right) is omitted on purpose.
   */
  const HEADS = [
    { x: 31.4, y: 23.6, size: 8.6 },
    { x: 40.6, y: 19.6, size: 9.4 },
    { x: 49.1, y: 23.0, size: 8.8 },
    { x: 58.1, y: 21.2, size: 9.2 },
    { x: 66.1, y: 24.8, size: 8.4 },
    { x: 77.6, y: 23.2, size: 8.8 },
    { x: 23.4, y: 34.8, size: 10.2 },
    { x: 32.0, y: 35.2, size: 10.8 },
    { x: 46.9, y: 36.5, size: 10.6 },
    { x: 57.2, y: 35.8, size: 9.4 },
    { x: 71.4, y: 35.5, size: 8.0 },
    { x: 27.0, y: 45.0, size: 11.8 },
    { x: 37.7, y: 44.8, size: 12.2 },
    { x: 53.4, y: 45.2, size: 11.4 },
    { x: 83.4, y: 46.4, size: 11.6 }
  ];

  const PORTAL_SRC = 'videos/portal.mov';
  const OBJECT_SRC = 'assets/game/Object.png';
  const LAB_ON_SRC = 'audio/Lab 2.mp3';
  const STOP_KEY = 'wc-ambient-stop';

  const root = document.getElementById('well-heads');
  const viewport = document.getElementById('well-viewport');
  const stage = document.getElementById('well-stage');
  const dad = document.getElementById('well-dad');
  const reveal = document.getElementById('well-reveal');
  const finale = document.getElementById('well-final');
  const finaleStage = document.getElementById('well-final-stage');
  if (!root || !viewport || !stage || !reveal || !finale || !finaleStage) return;

  if (window.SiteAccess && !window.SiteAccess.allows('gallery')) {
    window.location.replace('index.html');
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const debugEnabled = new URLSearchParams(window.location.search).has('well-debug');
  const films = [];
  const timers = [];
  let pageVisible = document.visibilityState === 'visible';
  let filmsAllowed = true;
  let sequenceDone = false;
  let cinematicStarted = false;
  let paintFrame = 0;

  const labOnAudio = new Audio(LAB_ON_SRC);
  labOnAudio.loop = true;
  labOnAudio.preload = 'auto';
  labOnAudio.hidden = true;
  document.body.appendChild(labOnAudio);

  function signalOtherTabs() {
    try {
      localStorage.setItem(STOP_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  }

  function playLabOn() {
    if (!pageVisible) return;
    labOnAudio.play().catch(() => {});
  }

  function pauseLabOn() {
    labOnAudio.pause();
  }

  function stopLabOn() {
    labOnAudio.pause();
    labOnAudio.currentTime = 0;
  }

  function configurePortalVideo(video) {
    video.muted = true;
    video.setAttribute('muted', '');
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.autoplay = true;
    video.preload = 'auto';
    video.controls = false;
    video.disablePictureInPicture = true;
    video.setAttribute('disablepictureinpicture', '');
    if (!video.getAttribute('src') && !video.currentSrc) video.src = PORTAL_SRC;
    return video;
  }

  const masterFilm = configurePortalVideo(
    document.getElementById('well-film-source') || document.createElement('video')
  );
  if (!masterFilm.isConnected) {
    masterFilm.className = 'well-film-source';
    masterFilm.hidden = true;
    masterFilm.setAttribute('aria-hidden', 'true');
    document.body.appendChild(masterFilm);
  }

  function sizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 128;
    const cssH = canvas.clientHeight || 128;
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  function paintCanvases() {
    if (masterFilm.readyState < 2) return;
    films.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      sizeCanvas(canvas);
      ctx.drawImage(masterFilm, 0, 0, canvas.width, canvas.height);
    });
  }

  function tickPaints() {
    paintCanvases();
    if (!pageVisible || !filmsAllowed || reducedMotion.matches) return;
    paintFrame = window.requestAnimationFrame(tickPaints);
  }

  function playFilms() {
    if (!pageVisible || !filmsAllowed || reducedMotion.matches) return;
    masterFilm.play().catch(() => {});
    if (!paintFrame) paintFrame = window.requestAnimationFrame(tickPaints);
  }

  function pauseFilms() {
    masterFilm.pause();
    if (paintFrame) {
      window.cancelAnimationFrame(paintFrame);
      paintFrame = 0;
    }
  }

  HEADS.forEach((head) => {
    const node = document.createElement('div');
    node.className = 'well-head';
    if (debugEnabled) node.classList.add('debug');
    node.style.left = `${head.x}%`;
    node.style.top = `${head.y}%`;
    node.style.setProperty('--head-size', `${head.size}%`);

    const clip = document.createElement('div');
    clip.className = 'well-head-clip';

    const filmInner = document.createElement('div');
    filmInner.className = 'well-head-film-inner';

    const film = document.createElement('canvas');
    film.className = 'well-head-film';
    filmInner.append(film);

    const shell = document.createElement('img');
    shell.className = 'well-head-shell';
    shell.src = OBJECT_SRC;
    shell.alt = '';
    shell.draggable = false;

    clip.append(filmInner, shell);
    node.append(clip);
    root.append(node);
    films.push(film);
    sizeCanvas(film);
  });

  window.requestAnimationFrame(() => {
    films.forEach(sizeCanvas);
    stage.classList.add('is-covered');
  });

  masterFilm.addEventListener('loadeddata', playFilms);
  masterFilm.addEventListener('playing', playFilms);
  if (masterFilm.readyState >= 2) playFilms();

  function startScene() {
    playFilms();
    playLabOn();
  }

  function pauseScene() {
    pauseFilms();
    pauseLabOn();
  }

  function later(fn, ms) {
    const id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function cancelSequence() {
    while (timers.length) window.clearTimeout(timers.pop());
  }

  function readMs(name, fallback) {
    const raw = getComputedStyle(viewport).getPropertyValue(name).trim();
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  function snapClass(el, className, on) {
    const prev = el.style.transition;
    el.style.transition = 'none';
    el.classList.toggle(className, on);
    void el.offsetWidth;
    el.style.transition = prev;
  }

  function readNum(name, fallback) {
    const raw = getComputedStyle(viewport).getPropertyValue(name).trim();
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  function moonFillScale() {
    const stageBox = finaleStage.getBoundingClientRect();
    const viewBox = viewport.getBoundingClientRect();
    const diamPct = readNum('--moon-diam', 5.4);
    const moonDiam = stageBox.width * (diamPct / 100);
    const fill = Math.max(viewBox.width, viewBox.height);
    return fill / Math.max(1, moonDiam);
  }

  function finishSequence() {
    sequenceDone = true;
    filmsAllowed = false;
    pauseFilms();
    stage.style.willChange = 'auto';
    finaleStage.style.setProperty('--well-moon-scale', String(moonFillScale()));
    finaleStage.classList.add('is-zoomed');
  }

  function resetSequenceVisuals() {
    snapClass(stage, 'is-zoomed', false);
    snapClass(reveal, 'is-visible', false);
    snapClass(finale, 'is-visible', false);
    snapClass(finaleStage, 'is-zoomed', false);
    if (dad) dad.classList.remove('is-spent');
  }

  function beginCinematic() {
    if (cinematicStarted) return;
    cinematicStarted = true;
    cancelSequence();
    if (dad) dad.classList.add('is-spent');

    const fadeAfterZoomMs = readMs('--well-fade-after-zoom-ms', 9000);
    const fadeMs = readMs('--well-fade-ms', 7800);
    const maskHoldMs = readMs('--well-mask-hold-ms', 1750);
    const finalMs = readMs('--well-final-ms', 7500);
    const moonHoldMs = readMs('--well-moon-hold-ms', 2000);
    const homeMs = readMs('--well-home-ms', 16000);
    const finaleAt = fadeAfterZoomMs + fadeMs + maskHoldMs;
    const moonAt = finaleAt + finalMs + moonHoldMs;

    stage.classList.add('is-zoomed');

    later(() => {
      reveal.classList.add('is-visible');
    }, fadeAfterZoomMs);

    later(() => {
      finale.classList.add('is-visible');
      filmsAllowed = false;
      pauseFilms();
      stage.style.willChange = 'auto';
    }, finaleAt);

    later(() => {
      finishSequence();
      later(goHome, homeMs);
    }, moonAt);
  }

  function goHome() {
    exitPage();
    window.location.replace('index.html');
  }

  function startSequence() {
    cancelSequence();
    cinematicStarted = false;
    sequenceDone = false;
    filmsAllowed = true;
    resetSequenceVisuals();

    const holdMs = readMs('--well-hold-ms', 5000);
    later(beginCinematic, holdMs);
  }

  function exitPage() {
    cancelSequence();
    pauseFilms();
    stopLabOn();
  }

  document.addEventListener('visibilitychange', () => {
    pageVisible = document.visibilityState === 'visible';
    if (pageVisible) startScene();
    else pauseScene();
  });

  window.addEventListener('pagehide', exitPage);
  window.addEventListener('freeze', exitPage);
  window.addEventListener('pageshow', (event) => {
    pageVisible = true;
    if (event.persisted) startSequence();
    startScene();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === STOP_KEY) stopLabOn();
  });
  window.addEventListener('pointerdown', startScene);
  window.addEventListener('keydown', startScene);

  if (dad) {
    if (debugEnabled) dad.classList.add('debug');
    dad.addEventListener('click', (event) => {
      event.preventDefault();
      startScene();
      beginCinematic();
    });
  }

  signalOtherTabs();
  startSequence();
  startScene();
})();
