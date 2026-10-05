(() => {
  const GALLERY_STOP_KEY = 'wc-ambient-stop';
  const GALLERY_AUDIO_SRC = 'audio/git jules.mp3';

  const gallery = document.getElementById('julian-gallery');
  const portalsRoot = document.getElementById('gallery-portals');
  const stage = document.querySelector('.gallery-stage');
  const artwork = document.getElementById('julian-artwork');
  const artImage = document.getElementById('julian-art-image');
  if (!gallery || !portalsRoot || !stage || !artwork || !artImage || typeof tracks === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const artId = params.get('art');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const debugEnabled = params.has('gallery-debug');
  const galleryAudio = new Audio(GALLERY_AUDIO_SRC);
  galleryAudio.loop = true;
  galleryAudio.preload = 'none';
  galleryAudio.setAttribute('data-gallery-music', '');
  galleryAudio.hidden = true;
  document.body.appendChild(galleryAudio);

  let portalFilms = [];
  let galleryActive = false;
  let artworkArmedAt = 0;

  function stopGalleryAudio() {
    galleryAudio.pause();
    galleryAudio.currentTime = 0;
  }

  function startGalleryAudio() {
    galleryAudio.preload = 'auto';
    galleryAudio.play().catch(() => {});
  }

  function signalOtherTabsStop() {
    try {
      localStorage.setItem(GALLERY_STOP_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  }

  function pausePortalFilms() {
    portalFilms.forEach((film) => {
      film.pause();
      film.currentTime = 0;
    });
  }

  function playPortalFilms() {
    if (reducedMotion.matches) return;
    portalFilms.forEach((film) => {
      if (!film.isConnected) return;
      if (!film.getAttribute('src') && !film.currentSrc) return;
      film.play().catch(() => {});
    });
  }

  function unlockGalleryPlayback() {
    startGalleryAudio();
    if (!gallery.hidden) playPortalFilms();
  }

  function stopGalleryScene() {
    galleryActive = false;
    stopGalleryAudio();
    pausePortalFilms();
  }

  function startGalleryScene() {
    galleryActive = true;
    startGalleryAudio();
    playPortalFilms();
  }

  function goHome() {
    stopGalleryScene();
    signalOtherTabsStop();
    window.location.replace('index.html');
  }

  function goWell() {
    stopGalleryScene();
    signalOtherTabsStop();
    if (window.CrisisGame3) window.CrisisGame3.exit();
    window.location.replace('well.html');
  }

  function goClassPhoto() {
    stopGalleryScene();
    signalOtherTabsStop();
    if (window.CrisisGame3) window.CrisisGame3.exit();
    window.location.replace('well.html?photo');
  }

  function enterMiniGame3() {
    if (performance.now() < artworkArmedAt) return;
    goWell();
  }

  window.addEventListener('wc-game3-complete', () => {
    if (!window.__wcGame3Won) return;
    window.__wcGame3Won = false;
    goClassPhoto();
  });

  function openGalleryArtwork(track) {
    if (!track) return;
    startGalleryAudio();
    showArtwork(track);
    const url = getArtworkUrl(track.id);
    window.history.pushState({ art: track.id }, '', url);
  }

  function showArtwork(track) {
    if (!track) {
      goHome();
      return;
    }
    pausePortalFilms();
    startGalleryAudio();
    gallery.hidden = true;
    portalsRoot.replaceChildren();
    portalFilms = [];
    artwork.hidden = false;
    artImage.src = track.artwork;
    artworkArmedAt = performance.now() + 600;
    window.__artArmed = artworkArmedAt;
    document.body.style.overflow = 'hidden';
  }

  function buildPortalFilm(track, index) {
    const film = document.createElement('video');
    film.className = 'gallery-portal-film';
    /*
     * Portal copies are tiny (~700KB for all 8). Start every Object
     * immediately so the gallery landing page fills in fast.
     */
    const src = typeof getTrackGalleryInterior === 'function'
      ? getTrackGalleryInterior(track)
      : (track.galleryVideo || track.video);
    film.muted = true;
    film.defaultMuted = true;
    film.setAttribute('muted', '');
    film.volume = 0;
    film.loop = true;
    film.playsInline = true;
    film.setAttribute('playsinline', '');
    film.setAttribute('webkit-playsinline', '');
    film.autoplay = true;
    film.controls = false;
    film.disablePictureInPicture = true;
    film.setAttribute('disablepictureinpicture', '');
    /* First four auto; rest metadata so the network stays responsive. */
    const preload = index < 4 ? 'auto' : 'metadata';
    film.preload = preload;
    if (typeof configureTrackInteriorVideo === 'function') {
      configureTrackInteriorVideo(film, track, { preload, gallery: true, src });
    } else {
      film.src = src;
    }
    return film;
  }

  function warmRemainingPortalFilms() {
    /* Promote later films to full download shortly after first paint. */
    portalFilms.forEach((film, index) => {
      if (index < 4) return;
      window.setTimeout(() => {
        if (!galleryActive || !film.isConnected) return;
        if (film.preload === 'auto') return;
        film.preload = 'auto';
        if (!reducedMotion.matches) film.play().catch(() => {});
      }, 120 + index * 90);
    });
  }

  function showGallery() {
    artwork.hidden = true;
    artImage.removeAttribute('src');
    gallery.hidden = false;
    portalsRoot.replaceChildren();
    portalFilms = [];
    document.body.style.overflow = 'hidden';

    tracks.forEach((track, index) => {
      const arm = GALLERY_ARMS[index];
      if (!arm) return;

      const portal = document.createElement('button');
      portal.type = 'button';
      portal.className = 'gallery-portal';
      portal.dataset.trackId = track.id;
      portal.dataset.arm = arm.name;
      portal.setAttribute('aria-label', track.title);

      const clip = document.createElement('div');
      clip.className = 'gallery-portal-clip';
      if (debugEnabled) clip.classList.add('debug');

      const filmInner = document.createElement('div');
      filmInner.className = 'gallery-portal-film-inner';

      const film = buildPortalFilm(track, index);
      filmInner.append(film);

      const shell = document.createElement('img');
      shell.className = 'gallery-portal-shell';
      shell.src = track.portal;
      shell.alt = '';
      shell.draggable = false;

      clip.append(filmInner, shell);
      portal.append(clip);
      portal.addEventListener('click', () => openGalleryArtwork(track));
      portalsRoot.append(portal);
      portalFilms.push(film);

      film.addEventListener('loadeddata', () => {
        if (galleryActive && !reducedMotion.matches) film.play().catch(() => {});
      });
    });

    startGalleryScene();
    warmRemainingPortalFilms();

    if (debugEnabled) initGalleryDebug(stage);
  }

  function initGalleryDebug(stageEl) {
    const readVar = (name, fallback) =>
      getComputedStyle(stageEl).getPropertyValue(name).trim() || fallback;

    const parseNum = (value, fallback) => parseFloat(value) || fallback;

    let portalSize = parseNum(readVar('--portal-size', '18.9%'), 18.9);

    const panel = document.createElement('aside');
    panel.className = 'gallery-debug-panel';
    panel.innerHTML = `
      <h2>Object Size</h2>
      <label>--portal-size<input type="range" id="dbg-size" min="8" max="30" step="0.1" value="${portalSize}"><output id="dbg-size-out">${portalSize}%</output></label>
      <div class="gallery-debug-actions">
        <button type="button" id="dbg-copy">Copy CSS</button>
        <button type="button" id="dbg-reset">Reset</button>
      </div>
    `;
    document.body.appendChild(panel);

    const defaults = { portalSize: 18.9 };

    function applyVars() {
      stageEl.style.setProperty('--portal-size', `${portalSize}%`);
      panel.querySelector('#dbg-size-out').textContent = `${portalSize}%`;
    }

    panel.querySelector('#dbg-size').addEventListener('input', (e) => {
      portalSize = parseFloat(e.target.value);
      applyVars();
    });

    panel.querySelector('#dbg-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(`--portal-size: ${portalSize}%;`).catch(() => {
        window.prompt('Copy into gallery-config.css:', `--portal-size: ${portalSize}%;`);
      });
    });

    panel.querySelector('#dbg-reset').addEventListener('click', () => {
      portalSize = defaults.portalSize;
      panel.querySelector('#dbg-size').value = portalSize;
      applyVars();
    });
  }

  window.addEventListener('popstate', () => {
    const id = new URLSearchParams(window.location.search).get('art');
    if (id) {
      showArtwork(getTrackById(id));
      return;
    }
    if (!gallery.hidden) return;
    showGallery();
  });

  window.addEventListener('pagehide', () => {
    stopGalleryScene();
    if (window.CrisisGame3) window.CrisisGame3.exit();
  });
  window.addEventListener('unload', () => {
    stopGalleryScene();
    if (window.CrisisGame3) window.CrisisGame3.exit();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      galleryAudio.pause();
      pausePortalFilms();
      return;
    }
    if (!gallery.hidden) {
      startGalleryScene();
      return;
    }
    if (!artwork.hidden) startGalleryAudio();
  });

  window.addEventListener('storage', (event) => {
    if (event.key === GALLERY_STOP_KEY) stopGalleryScene();
  });

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    const id = new URLSearchParams(window.location.search).get('art');
    if (id) {
      showArtwork(getTrackById(id));
      return;
    }
    if (!gallery.hidden && !galleryActive) showGallery();
  });

  window.addEventListener('pointerdown', unlockGalleryPlayback, { once: true });
  window.addEventListener('keydown', unlockGalleryPlayback, { once: true });

  if (new URLSearchParams(window.location.search).has('game3')) {
    if (window.SiteAccess && !window.SiteAccess.allows('gallery')) {
      goHome();
      return;
    }
    enterMiniGame3();
    return;
  }

  if (artId) {
    if (window.SiteAccess && !window.SiteAccess.allows('artwork')) {
      goHome();
      return;
    }
    showArtwork(getTrackById(artId));
    return;
  }

  if (window.SiteAccess && !window.SiteAccess.allows('gallery')) {
    goHome();
    return;
  }

  showGallery();
})();
