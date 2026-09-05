(() => {
  /*
   * Head centers as % of the photograph (left/top + translate -50%,-50%).
   * size is Object diameter as % of photograph width.
   * Julian's dad (bottom row, second from right) is omitted on purpose.
   *
   * Interior stills: canvas polar twirl + ripple, spinning ~9x faster than the original 8–15s version.
   * x / y / size / image stay the registered Object assignments.
   */
  const HEADS = [
    { x: 31.4, y: 23.6, size: 8.6, image: 'assets/well-interiors/img-0418.jpg', rot: 1.3, dir: 1, phase: 0.4, zoom: 1.34, twist: 58, twistAmp: 14, ripple: 24, rippleAmp: 8, freqX: 0.012, freqY: 0.02, freqAmp: 0.008, rippleHz: 0.55, twistType: 'turbulence', rippleType: 'fractalNoise', seed: 3, octaves: 3, bulge: 0.16, stretch: 0.2, skew: 11, smear: 1 },
    { x: 40.6, y: 19.6, size: 9.4, image: 'assets/well-interiors/img-0458.jpg', rot: 1.8, dir: -1, phase: 1.7, zoom: 1.28, twist: 46, twistAmp: 12, ripple: 18, rippleAmp: 7, freqX: 0.018, freqY: 0.011, freqAmp: 0.006, rippleHz: 0.72, twistType: 'fractalNoise', rippleType: 'turbulence', seed: 11, octaves: 2, bulge: 0.1, stretch: 0.14, skew: 7, smear: 0 },
    { x: 49.1, y: 23.0, size: 8.8, image: 'assets/well-interiors/img-0502.jpg', rot: 2.3, dir: 1, phase: 2.9, zoom: 1.32, twist: 42, twistAmp: 10, ripple: 22, rippleAmp: 9, freqX: 0.01, freqY: 0.016, freqAmp: 0.005, rippleHz: 0.41, twistType: 'fractalNoise', rippleType: 'fractalNoise', seed: 21, octaves: 3, bulge: 0.08, stretch: 0.11, skew: 5, smear: 0 },
    { x: 58.1, y: 21.2, size: 9.2, image: 'assets/well-interiors/img-0737-2.jpg', rot: 1.4, dir: -1, phase: 0.8, zoom: 1.3, twist: 54, twistAmp: 14, ripple: 16, rippleAmp: 6, freqX: 0.008, freqY: 0.014, freqAmp: 0.004, rippleHz: 0.33, twistType: 'turbulence', rippleType: 'fractalNoise', seed: 31, octaves: 2, bulge: 0.14, stretch: 0.18, skew: 9, smear: 1 },
    { x: 66.1, y: 24.8, size: 8.4, image: 'assets/well-interiors/img-5776.jpg', rot: 2.0, dir: 1, phase: 3.6, zoom: 1.26, twist: 44, twistAmp: 11, ripple: 20, rippleAmp: 8, freqX: 0.015, freqY: 0.009, freqAmp: 0.007, rippleHz: 0.64, twistType: 'fractalNoise', rippleType: 'turbulence', seed: 41, octaves: 4, bulge: 0.09, stretch: 0.12, skew: 6, smear: 0 },
    { x: 77.6, y: 23.2, size: 8.8, image: 'assets/well-interiors/img-8007.jpg', rot: 2.4, dir: -1, phase: 5.1, zoom: 1.24, twist: 40, twistAmp: 9, ripple: 18, rippleAmp: 7, freqX: 0.021, freqY: 0.013, freqAmp: 0.006, rippleHz: 0.88, twistType: 'fractalNoise', rippleType: 'fractalNoise', seed: 51, octaves: 2, bulge: 0.07, stretch: 0.09, skew: 4, smear: 0 },
    { x: 23.4, y: 34.8, size: 10.2, image: 'assets/well-interiors/img-6943.jpg', rot: 1.6, dir: 1, phase: 1.2, zoom: 1.31, twist: 48, twistAmp: 13, ripple: 19, rippleAmp: 7, freqX: 0.013, freqY: 0.019, freqAmp: 0.005, rippleHz: 0.47, twistType: 'turbulence', rippleType: 'fractalNoise', seed: 61, octaves: 3, bulge: 0.12, stretch: 0.16, skew: 8, smear: 1 },
    { x: 32.0, y: 35.2, size: 10.8, image: 'assets/well-interiors/img-6958.jpg', rot: 1.4, dir: -1, phase: 4.4, zoom: 1.29, twist: 42, twistAmp: 11, ripple: 24, rippleAmp: 9, freqX: 0.009, freqY: 0.017, freqAmp: 0.004, rippleHz: 0.58, twistType: 'fractalNoise', rippleType: 'turbulence', seed: 71, octaves: 2, bulge: 0.11, stretch: 0.13, skew: 6, smear: 0 },
    { x: 46.9, y: 36.5, size: 10.6, image: 'assets/well-interiors/img-7102.jpg', rot: 2.1, dir: 1, phase: 2.1, zoom: 1.27, twist: 52, twistAmp: 15, ripple: 16, rippleAmp: 6, freqX: 0.007, freqY: 0.012, freqAmp: 0.003, rippleHz: 0.29, twistType: 'turbulence', rippleType: 'fractalNoise', seed: 81, octaves: 3, bulge: 0.15, stretch: 0.19, skew: 10, smear: 1 },
    { x: 57.2, y: 35.8, size: 9.4, image: 'assets/well-interiors/img-7632-2.jpg', rot: 1.7, dir: -1, phase: 5.8, zoom: 1.33, twist: 42, twistAmp: 10, ripple: 21, rippleAmp: 8, freqX: 0.016, freqY: 0.01, freqAmp: 0.006, rippleHz: 0.69, twistType: 'fractalNoise', rippleType: 'fractalNoise', seed: 91, octaves: 4, bulge: 0.08, stretch: 0.1, skew: 5, smear: 0 },
    { x: 71.4, y: 35.5, size: 8.0, image: 'assets/well-interiors/img-7992.jpg', rot: 2.2, dir: 1, phase: 0.6, zoom: 1.25, twist: 40, twistAmp: 9, ripple: 18, rippleAmp: 7, freqX: 0.022, freqY: 0.015, freqAmp: 0.007, rippleHz: 0.81, twistType: 'fractalNoise', rippleType: 'turbulence', seed: 101, octaves: 2, bulge: 0.06, stretch: 0.08, skew: 3, smear: 0 },
    { x: 27.0, y: 45.0, size: 11.8, image: 'assets/well-interiors/img-5999.jpg', rot: 1.5, dir: -1, phase: 3.3, zoom: 1.3, twist: 50, twistAmp: 12, ripple: 16, rippleAmp: 6, freqX: 0.011, freqY: 0.018, freqAmp: 0.005, rippleHz: 0.38, twistType: 'turbulence', rippleType: 'fractalNoise', seed: 111, octaves: 3, bulge: 0.13, stretch: 0.17, skew: 8, smear: 1 },
    { x: 37.7, y: 44.8, size: 12.2, image: 'assets/well-interiors/img-9496.jpg', rot: 1.9, dir: 1, phase: 1.9, zoom: 1.28, twist: 40, twistAmp: 10, ripple: 23, rippleAmp: 9, freqX: 0.014, freqY: 0.008, freqAmp: 0.006, rippleHz: 0.76, twistType: 'fractalNoise', rippleType: 'turbulence', seed: 121, octaves: 2, bulge: 0.09, stretch: 0.12, skew: 6, smear: 0 },
    { x: 53.4, y: 45.2, size: 11.4, image: 'assets/well-interiors/screenshot-755.jpg', rot: 1.3, dir: -1, phase: 4.8, zoom: 1.34, twist: 56, twistAmp: 14, ripple: 16, rippleAmp: 6, freqX: 0.006, freqY: 0.011, freqAmp: 0.003, rippleHz: 0.26, twistType: 'turbulence', rippleType: 'fractalNoise', seed: 131, octaves: 3, bulge: 0.17, stretch: 0.21, skew: 12, smear: 1 },
    { x: 83.4, y: 46.4, size: 11.6, image: 'assets/well-interiors/screenshot-758.jpg', rot: 2.2, dir: 1, phase: 2.5, zoom: 1.27, twist: 44, twistAmp: 11, ripple: 20, rippleAmp: 8, freqX: 0.017, freqY: 0.012, freqAmp: 0.005, rippleHz: 0.52, twistType: 'fractalNoise', rippleType: 'fractalNoise', seed: 141, octaves: 3, bulge: 0.1, stretch: 0.13, skew: 7, smear: 0 }
  ];

  const interiors = [];
  let distortRaf = 0;
  const TWIRL_SIZE = 96;

  const OBJECT_SRC = 'assets/game/Object.png';
  const LAB_ON_SRC = 'audio/Lab 2.mp3';
  const PORTAL_SRC = 'videos/portal.mp4?v=1';
  const GALLERY_AUDIO_SRC = 'audio/git jules.mp3';
  const STOP_KEY = 'wc-ambient-stop';

  const root = document.getElementById('well-heads');
  const viewport = document.getElementById('well-viewport');
  const stage = document.getElementById('well-stage');
  const dad = document.getElementById('well-dad');
  const reveal = document.getElementById('well-reveal');
  const finale = document.getElementById('well-final');
  const finaleStage = document.getElementById('well-final-stage');
  const coda = document.getElementById('well-coda');
  const codaText = document.getElementById('well-coda-text');
  const codaLine1 = document.getElementById('well-coda-line-1');
  const codaLine2 = document.getElementById('well-coda-line-2');
  const blackout = document.getElementById('well-blackout');
  const objectEnd = document.getElementById('well-object-end');
  const objectEndFilm = document.getElementById('well-object-end-film');
  const objectEndHome = document.getElementById('well-object-end-home');
  if (!root || !viewport || !stage || !reveal || !finale || !finaleStage || !coda || !codaText || !codaLine1 || !codaLine2 || !blackout || !objectEnd || !objectEndFilm || !objectEndHome) return;

  if (window.SiteAccess && !window.SiteAccess.allows('gallery')) {
    window.location.replace('index.html');
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const debugEnabled = new URLSearchParams(window.location.search).has('well-debug');
  const timers = [];
  let pageVisible = document.visibilityState === 'visible';
  let interiorsAllowed = true;
  let sequenceDone = false;
  let cinematicStarted = false;
  let codaStarted = false;
  let objectEndStarted = false;
  let goingHome = false;
  let windRaf = 0;
  let portalLoopCount = 0;
  let galleryLoopCount = 0;
  let portalPhase = 'idle';
  let lastMediaTime = 0;
  let windStartedAt = 0;
  let windDurationMs = 0;
  let portalAudioCtx = null;
  let portalFilter = null;
  let portalDistortion = null;
  let portalGain = null;
  let portalGraphReady = false;
  let galleryKicked = false;

  const labOnAudio = new Audio(LAB_ON_SRC);
  labOnAudio.loop = true;
  labOnAudio.preload = 'auto';
  labOnAudio.hidden = true;
  document.body.appendChild(labOnAudio);

  const galleryEndAudio = new Audio(GALLERY_AUDIO_SRC);
  galleryEndAudio.preload = 'auto';
  galleryEndAudio.hidden = true;
  document.body.appendChild(galleryEndAudio);

  function signalOtherTabs() {
    try {
      localStorage.setItem(STOP_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  }

  function playLabOn() {
    if (!pageVisible || objectEndStarted) return;
    labOnAudio.play().catch(() => {});
  }

  function pauseLabOn() {
    labOnAudio.pause();
  }

  function stopLabOn() {
    labOnAudio.pause();
    labOnAudio.currentTime = 0;
  }

  function makeDistortionCurve(amount) {
    const n = 44100;
    const curve = new Float32Array(n);
    const k = amount;
    for (let i = 0; i < n; i += 1) {
      const x = (i * 2) / n - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve;
  }

  function hookPortalAudioGraph() {
    if (portalGraphReady) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      portalAudioCtx = new Ctx();
      const source = portalAudioCtx.createMediaElementSource(objectEndFilm);
      portalFilter = portalAudioCtx.createBiquadFilter();
      portalFilter.type = 'lowpass';
      portalFilter.frequency.value = 18000;
      portalFilter.Q.value = 0.7;
      portalDistortion = portalAudioCtx.createWaveShaper();
      portalDistortion.curve = makeDistortionCurve(0.01);
      portalDistortion.oversample = '4x';
      portalGain = portalAudioCtx.createGain();
      portalGain.gain.value = 1;
      source.connect(portalFilter);
      portalFilter.connect(portalDistortion);
      portalDistortion.connect(portalGain);
      portalGain.connect(portalAudioCtx.destination);
      portalGraphReady = true;
    } catch {
      portalAudioCtx = null;
    }
  }

  function cancelWind() {
    if (windRaf) {
      window.cancelAnimationFrame(windRaf);
      windRaf = 0;
    }
  }

  function stopGalleryEnd() {
    galleryEndAudio.removeEventListener('ended', onGalleryLoopEnd);
    galleryEndAudio.pause();
    galleryEndAudio.currentTime = 0;
    galleryLoopCount = 0;
  }

  function resetPortalColor() {
    objectEndFilm.playbackRate = 1;
    objectEndFilm.volume = 1;
    if (portalFilter) {
      portalFilter.frequency.value = 18000;
      portalFilter.Q.value = 0.7;
    }
    if (portalDistortion) portalDistortion.curve = makeDistortionCurve(0.01);
    if (portalGain) portalGain.gain.value = 1;
  }

  function applyPortalWind(t) {
    const eased = Math.min(1, Math.max(0, t));
    objectEndFilm.playbackRate = Math.max(0.08, 1 - eased * 0.92);
    if (portalFilter) {
      portalFilter.frequency.value = 18000 - eased * 17600;
      portalFilter.Q.value = 0.7 + eased * 14;
    }
    if (portalDistortion) portalDistortion.curve = makeDistortionCurve(0.01 + eased * 28);
    if (portalGain) portalGain.gain.value = 1;
    else objectEndFilm.volume = 1;
  }

  function portalLoopsNeeded() {
    return Math.max(2, Math.round(readNum('--well-portal-loops', 3)));
  }

  function galleryLoopsNeeded() {
    return Math.max(1, Math.round(readNum('--well-gallery-loops', 3)));
  }

  function resumePortalEnd() {
    if (!pageVisible || !objectEndStarted || galleryKicked || goingHome) return;
    if (portalPhase === 'idle') {
      playPortalEnd();
      return;
    }
    if (portalAudioCtx && portalAudioCtx.state === 'suspended') {
      portalAudioCtx.resume().catch(() => {});
    }
    if (objectEndFilm.paused) objectEndFilm.play().catch(() => {});
  }

  function playPortalEnd() {
    if (!pageVisible) return;
    if (portalPhase === 'gallery' || galleryKicked) return;
    if (portalPhase === 'normal' || portalPhase === 'wind') {
      if (portalAudioCtx && portalAudioCtx.state === 'suspended') {
        portalAudioCtx.resume().catch(() => {});
      }
      if (objectEndFilm.paused) objectEndFilm.play().catch(() => {});
      return;
    }
    stopLabOn();
    stopGalleryEnd();
    signalOtherTabs();
    hookPortalAudioGraph();
    if (portalAudioCtx && portalAudioCtx.state === 'suspended') {
      portalAudioCtx.resume().catch(() => {});
    }
    objectEndFilm.loop = true;
    objectEndFilm.muted = false;
    objectEndFilm.defaultMuted = false;
    objectEndFilm.preservesPitch = false;
    objectEndFilm.mozPreservesPitch = false;
    objectEndFilm.webkitPreservesPitch = false;
    objectEndFilm.removeAttribute('muted');
    resetPortalColor();
    if (!objectEndFilm.src || !objectEndFilm.currentSrc) {
      objectEndFilm.src = PORTAL_SRC;
    }
    portalPhase = 'normal';
    portalLoopCount = 0;
    lastMediaTime = 0;
    objectEndFilm.removeEventListener('timeupdate', onPortalTime);
    objectEndFilm.removeEventListener('ended', onPortalEnded);
    objectEndFilm.addEventListener('timeupdate', onPortalTime);
    objectEndFilm.addEventListener('ended', onPortalEnded);
    objectEndFilm.currentTime = 0;
    objectEndFilm.play().catch(() => {});
    armNormalPlayWatch();
  }

  function armNormalPlayWatch() {
    const startedAt = performance.now();
    const tick = () => {
      if (goingHome || portalPhase !== 'normal') return;
      const dur = Number.isFinite(objectEndFilm.duration) && objectEndFilm.duration > 0
        ? objectEndFilm.duration
        : 13.5;
      const readyAt = (portalLoopsNeeded() - 1) * dur * 1000 - 150;
      if (performance.now() - startedAt >= readyAt) {
        beginPortalWind();
        return;
      }
      later(tick, 300);
    };
    later(tick, 300);
  }

  function onPortalTime() {
    if (goingHome || !objectEndStarted || portalPhase === 'gallery') return;
    const time = objectEndFilm.currentTime;
    if (portalPhase === 'normal') {
      if (lastMediaTime > 1.2 && time < 0.8) {
        portalLoopCount += 1;
        if (portalLoopCount >= portalLoopsNeeded() - 1) beginPortalWind();
      }
      lastMediaTime = time;
    }
  }

  function onPortalEnded() {
    if (goingHome || !objectEndStarted) return;
    if (portalPhase === 'normal') {
      portalLoopCount += 1;
      if (portalLoopCount >= portalLoopsNeeded() - 1) {
        beginPortalWind();
        return;
      }
      objectEndFilm.currentTime = 0;
      objectEndFilm.play().catch(() => {});
      return;
    }
    if (portalPhase === 'wind') {
      const t = windDurationMs ? (performance.now() - windStartedAt) / windDurationMs : 1;
      if (t < 0.45) {
        objectEndFilm.currentTime = 0;
        objectEndFilm.play().catch(() => {});
        return;
      }
      finishPortalWind();
    }
  }

  function onGalleryLoopEnd() {
    if (goingHome) return;
    galleryLoopCount += 1;
    if (galleryLoopCount < galleryLoopsNeeded()) {
      galleryEndAudio.currentTime = 0;
      galleryEndAudio.play().catch(() => {});
      return;
    }
    goHome();
  }

  function stopPortalEnd() {
    cancelWind();
    objectEndFilm.pause();
    objectEndFilm.playbackRate = 1;
    objectEndFilm.currentTime = 0;
    portalLoopCount = 0;
    portalPhase = 'idle';
    lastMediaTime = 0;
    galleryKicked = false;
    objectEndFilm.removeEventListener('timeupdate', onPortalTime);
    objectEndFilm.removeEventListener('ended', onPortalEnded);
    stopGalleryEnd();
  }

  function goHome() {
    if (goingHome) return;
    goingHome = true;
    exitPage();
    window.location.replace('index.html');
  }

  function kickGalleryThenHome() {
    if (goingHome || !objectEndStarted || galleryKicked) return;
    galleryKicked = true;
    portalPhase = 'gallery';
    cancelWind();
    objectEndFilm.pause();
    objectEndFilm.volume = 0;
    if (portalGain) portalGain.gain.value = 0;
    galleryLoopCount = 0;
    galleryEndAudio.loop = false;
    galleryEndAudio.currentTime = 0;
    galleryEndAudio.removeEventListener('ended', onGalleryLoopEnd);
    galleryEndAudio.addEventListener('ended', onGalleryLoopEnd);
    galleryEndAudio.play().catch(() => {});
    const clipMs = Number.isFinite(galleryEndAudio.duration) && galleryEndAudio.duration > 0
      ? galleryEndAudio.duration * 1000
      : 11520;
    later(goHome, clipMs * galleryLoopsNeeded() + 1500);
  }

  function finishPortalWind() {
    if (portalPhase !== 'wind') return;
    cancelWind();
    kickGalleryThenHome();
  }

  function beginPortalWind() {
    if (portalPhase === 'wind' || portalPhase === 'gallery' || goingHome) return;
    portalPhase = 'wind';
    objectEndFilm.loop = false;
    if (portalAudioCtx && portalAudioCtx.state === 'suspended') {
      portalAudioCtx.resume().catch(() => {});
    }
    const dur = objectEndFilm.duration;
    const mediaSec = Number.isFinite(dur) && dur > 0 ? dur : 12;
    windDurationMs = Math.max(18000, mediaSec * 1000 * 2.2);
    windStartedAt = performance.now();
    applyPortalWind(0);
    if (objectEndFilm.paused || objectEndFilm.ended) {
      objectEndFilm.currentTime = 0;
      objectEndFilm.play().catch(() => {});
    }
    const tick = () => {
      if (portalPhase !== 'wind' || goingHome) return;
      const t = Math.min(1, (performance.now() - windStartedAt) / windDurationMs);
      applyPortalWind(t);
      if (t >= 1) {
        windRaf = 0;
        finishPortalWind();
        return;
      }
      windRaf = window.requestAnimationFrame(tick);
    };
    cancelWind();
    windRaf = window.requestAnimationFrame(tick);
  }

  function showObjectEnd() {
    if (objectEndStarted) return;
    objectEndStarted = true;
    setInteriorsRunning(false);
    objectEnd.classList.add('is-visible');
    playPortalEnd();
  }

  function drawCover(ctx, img, size) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const scale = Math.max(size / iw, size / ih) * 1.28;
    const w = iw * scale;
    const h = ih * scale;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (size - w) * 0.5, (size - h) * 0.5, w, h);
  }

  function createInterior(head, index) {
    const canvas = document.createElement('canvas');
    canvas.className = 'well-head-liquid';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = TWIRL_SIZE;
    canvas.height = TWIRL_SIZE;

    const ctx = canvas.getContext('2d', { alpha: false });
    const src = document.createElement('canvas');
    src.width = TWIRL_SIZE;
    src.height = TWIRL_SIZE;
    const srcCtx = src.getContext('2d', { alpha: false, willReadFrequently: true });

    const spec = {
      head,
      index,
      canvas,
      ctx,
      src,
      srcCtx,
      img: new Image(),
      ready: false,
      srcData: null,
      destData: ctx.createImageData(TWIRL_SIZE, TWIRL_SIZE),
      twistMul: index === 0 ? 3.2 : (index % 2 === 0 ? 2.1 + (index % 5) * 0.18 : -(1.7 + (index % 4) * 0.16))
    };

    spec.img.decoding = 'async';
    spec.img.addEventListener('load', () => {
      drawCover(srcCtx, spec.img, TWIRL_SIZE);
      spec.srcData = srcCtx.getImageData(0, 0, TWIRL_SIZE, TWIRL_SIZE);
      spec.ready = true;
    });
    spec.img.src = head.image;

    interiors.push(spec);
    return canvas;
  }

  function tickInteriors(now) {
    if (!interiorsAllowed || !pageVisible || reducedMotion.matches) {
      distortRaf = 0;
      return;
    }

    const t = now * 0.001;
    const size = TWIRL_SIZE;
    const cx = (size - 1) * 0.5;
    const maxR = size * 0.5;
    const maxR2 = maxR * maxR;

    for (let i = 0; i < interiors.length; i += 1) {
      const spec = interiors[i];
      if (!spec.ready || !spec.srcData) continue;

      const head = spec.head;
      const p = t + head.phase;
      const src = spec.srcData.data;
      const dest = spec.destData.data;
      const spin = (p / head.rot) * Math.PI * 2 * head.dir * 3;
      const twirl = spec.twistMul * (0.75 + 0.35 * Math.sin(p * 0.41));
      const ripAmp = 2.8 + head.ripple * 0.06;
      const ripFreq = 0.22 + head.rippleHz * 0.12;
      const zoom = head.zoom * (1 + Math.sin(p * 0.37) * head.bulge);
      const cxi = cx + Math.sin(p * 0.53) * 6.5;
      const cyi = cx + Math.cos(p * 0.47) * 6.5;
      const smear = 5.5 + head.stretch * 10;

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const dx0 = x - cx;
          const dy0 = y - cx;
          const di = (y * size + x) * 4;
          if (dx0 * dx0 + dy0 * dy0 > maxR2) {
            dest[di] = 0;
            dest[di + 1] = 0;
            dest[di + 2] = 0;
            dest[di + 3] = 255;
            continue;
          }
          const dx = x - cxi;
          const dy = y - cyi;
          const r2 = dx * dx + dy * dy;
          const r = Math.sqrt(r2);
          const u = Math.min(1, r / maxR);
          const falloff = (1 - u) * (1 - u);
          const theta = Math.atan2(dy, dx) + spin + twirl * falloff;
          const ripple = Math.sin(r * ripFreq - p * 7.2) * ripAmp * (0.35 + 0.65 * u);
          const sr = Math.max(0, (r + ripple) / zoom);
          let sx = cxi + Math.cos(theta) * sr;
          let sy = cyi + Math.sin(theta) * sr;
          sx += Math.sin((y / size) * Math.PI * 4.4 + p * 3.1) * smear * (0.45 + 0.55 * u);
          sy += Math.cos((x / size) * Math.PI * 3.4 - p * 2.6) * smear * 0.8 * (0.45 + 0.55 * u);
          if (sx < 0) sx = 0;
          else if (sx > size - 1) sx = size - 1;
          if (sy < 0) sy = 0;
          else if (sy > size - 1) sy = size - 1;
          const si = ((sy | 0) * size + (sx | 0)) * 4;
          dest[di] = src[si];
          dest[di + 1] = src[si + 1];
          dest[di + 2] = src[si + 2];
          dest[di + 3] = 255;
        }
      }

      spec.ctx.putImageData(spec.destData, 0, 0);
    }

    distortRaf = window.requestAnimationFrame(tickInteriors);
  }

  function setInteriorsRunning(on) {
    interiorsAllowed = on;
    const running = on && pageVisible && !reducedMotion.matches;
    viewport.classList.toggle('is-interior-paused', !running);
    if (running) {
      if (!distortRaf) distortRaf = window.requestAnimationFrame(tickInteriors);
    } else if (distortRaf) {
      window.cancelAnimationFrame(distortRaf);
      distortRaf = 0;
    }
  }

  HEADS.forEach((head, index) => {
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

    if (head.image) {
      filmInner.append(createInterior(head, index));
    }

    const shell = document.createElement('img');
    shell.className = 'well-head-shell';
    shell.src = OBJECT_SRC;
    shell.alt = '';
    shell.draggable = false;

    clip.append(filmInner, shell);
    node.append(clip);
    root.append(node);
  });

  window.requestAnimationFrame(() => {
    stage.classList.add('is-covered');
  });

  function startScene() {
    setInteriorsRunning(!objectEndStarted);
    if (objectEndStarted) resumePortalEnd();
    else playLabOn();
  }

  function pauseScene() {
    setInteriorsRunning(false);
    pauseLabOn();
    if (objectEndFilm) objectEndFilm.pause();
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
    setInteriorsRunning(false);
    stage.style.willChange = 'auto';
    finaleStage.style.setProperty('--well-moon-scale', String(moonFillScale()));
    finaleStage.classList.add('is-zoomed');
  }

  function resetSequenceVisuals() {
    snapClass(stage, 'is-zoomed', false);
    snapClass(reveal, 'is-visible', false);
    snapClass(finale, 'is-visible', false);
    snapClass(finale, 'is-leaving', false);
    snapClass(finaleStage, 'is-zoomed', false);
    snapClass(coda, 'is-visible', false);
    snapClass(codaLine1, 'is-visible', false);
    snapClass(codaLine2, 'is-visible', false);
    snapClass(blackout, 'is-visible', false);
    snapClass(objectEnd, 'is-visible', false);
    stopPortalEnd();
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
    const moonMs = readMs('--well-moon-ms', 8500);
    const moonAfterMs = readMs('--well-moon-after-ms', 400);
    const codaMs = readMs('--well-coda-ms', 6500);
    const codaTextDelayMs = readMs('--well-coda-text-delay-ms', 2500);
    const codaTextMs = readMs('--well-coda-text-ms', 4500);
    const homeMs = readMs('--well-home-ms', 3500);
    const blackMs = readMs('--well-black-ms', 900);
    const finaleAt = fadeAfterZoomMs + fadeMs + maskHoldMs;
    const moonAt = finaleAt + finalMs + moonHoldMs;
    const codaAt = moonAt + moonMs + moonAfterMs;

    function showCoda() {
      if (codaStarted) return;
      codaStarted = true;
      finaleStage.style.willChange = 'auto';
      coda.classList.add('is-visible');
      finale.classList.add('is-leaving');
      later(() => {
        codaLine1.classList.add('is-visible');
        later(() => {
          codaLine2.classList.add('is-visible');
          later(() => {
            codaLine1.classList.remove('is-visible');
            codaLine2.classList.remove('is-visible');
            later(() => {
              blackout.classList.add('is-visible');
              later(showObjectEnd, blackMs);
            }, codaTextMs);
          }, codaTextMs + homeMs);
        }, codaTextDelayMs);
      }, codaTextDelayMs);
    }

    stage.classList.add('is-zoomed');

    later(() => {
      reveal.classList.add('is-visible');
    }, fadeAfterZoomMs);

    later(() => {
      finale.classList.add('is-visible');
      setInteriorsRunning(false);
      stage.style.willChange = 'auto';
    }, finaleAt);

    later(() => {
      finishSequence();
    }, moonAt);

    later(showCoda, codaAt);

    finaleStage.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'transform') return;
      if (!finaleStage.classList.contains('is-zoomed')) return;
      later(showCoda, moonAfterMs);
    });
  }

  function startSequence() {
    cancelSequence();
    cinematicStarted = false;
    sequenceDone = false;
    codaStarted = false;
    objectEndStarted = false;
    goingHome = false;
    portalLoopCount = 0;
    galleryLoopCount = 0;
    portalPhase = 'idle';
    resetSequenceVisuals();
    setInteriorsRunning(true);

    const holdMs = readMs('--well-hold-ms', 5000);
    later(beginCinematic, holdMs);
  }

  function exitPage() {
    cancelSequence();
    setInteriorsRunning(false);
    stopLabOn();
    stopPortalEnd();
  }

  document.addEventListener('visibilitychange', () => {
    pageVisible = document.visibilityState === 'visible';
    if (pageVisible) startScene();
    else pauseScene();
  });

  window.addEventListener('pagehide', exitPage);
  window.addEventListener('freeze', () => {
    if (objectEndStarted && !galleryKicked) {
      pauseScene();
      return;
    }
    exitPage();
  });
  window.addEventListener('pageshow', (event) => {
    pageVisible = true;
    if (event.persisted) startSequence();
    startScene();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === STOP_KEY) {
      stopLabOn();
      if (objectEndStarted) stopPortalEnd();
    }
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

  objectEndHome.addEventListener('click', (event) => {
    event.preventDefault();
    if (!objectEndStarted) return;
    goHome();
  });

  signalOtherTabs();
  startSequence();
  startScene();
  if (new URLSearchParams(window.location.search).has('well-end')) {
    cancelSequence();
    showObjectEnd();
    window.__wellBeginWind = beginPortalWind;
    window.__wellStatus = () => ({
      phase: portalPhase,
      loops: portalLoopCount,
      rate: objectEndFilm.playbackRate,
      time: objectEndFilm.currentTime,
      paused: objectEndFilm.paused,
      ended: objectEndFilm.ended,
      graph: portalGraphReady,
      ctx: portalAudioCtx ? portalAudioCtx.state : 'none'
    });
  }
})();
