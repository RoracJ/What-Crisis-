(() => {
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
  const ambient = window.CrisisAmbient;
  let portalFilms = [];
  let galleryActive = false;

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
      film.play().catch(() => {});
    });
  }

  function unlockGalleryPlayback() {
    if (ambient && galleryActive) ambient.play('gallery');
    playPortalFilms();
  }

  function stopGalleryScene() {
    galleryActive = false;
    if (ambient) ambient.stop();
    pausePortalFilms();
  }

  function startGalleryScene() {
    galleryActive = true;
    if (ambient) ambient.play('gallery');
    playPortalFilms();
  }

  function goHome() {
    stopGalleryScene();
    window.location.href = 'index.html';
  }

  artwork.addEventListener('click', goHome);

  function openGalleryArtwork(track) {
    if (!track) return;
    showArtwork(track);
    const url = getArtworkUrl(track.id);
    window.history.pushState({ art: track.id }, '', url);
  }

  function showArtwork(track) {
    if (!track) {
      goHome();
      return;
    }
    stopGalleryScene();
    gallery.hidden = true;
    portalsRoot.replaceChildren();
    portalFilms = [];
    artwork.hidden = false;
    artImage.src = track.artwork;
    document.body.style.overflow = 'hidden';
  }

  function buildPortalFilm(track) {
    const film = document.createElement('video');
    film.className = 'gallery-portal-film';
    if (typeof configureTrackInteriorVideo === 'function') {
      configureTrackInteriorVideo(film, track);
    } else {
      film.muted = true;
      film.setAttribute('muted', '');
      film.loop = true;
      film.playsInline = true;
      film.setAttribute('playsinline', '');
      film.setAttribute('webkit-playsinline', '');
      film.autoplay = true;
      film.preload = 'auto';
      film.controls = false;
      film.src = typeof getTrackInterior === 'function' ? getTrackInterior(track) : track.video;
    }
    return film;
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

      const film = buildPortalFilm(track);
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
    if (galleryActive) stopGalleryScene();
  });

  if (ambient) {
    window.addEventListener('pointerdown', unlockGalleryPlayback, { once: true });
    window.addEventListener('keydown', unlockGalleryPlayback, { once: true });
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
