(function () {
  const audio = new Audio();
  const video = document.getElementById('player-video');
  const trackListEl = document.getElementById('track-list');
  const btnPlay = document.getElementById('btn-play');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const stage = document.querySelector('.player-stage');

  let currentIndex = -1;
  let isPlaying = false;

  function renderTrackList() {
    trackListEl.innerHTML = tracks
      .map(
        (track, i) => `
          <li class="track-item">
            <button type="button" class="track-link" data-index="${i}">${track.title}</button>
          </li>
        `
      )
      .join('');
  }

  function updateActiveTrack() {
    trackListEl.querySelectorAll('.track-link').forEach((btn, i) => {
      btn.classList.toggle('is-active', i === currentIndex);
    });
  }

  function updatePlayButton() {
    btnPlay.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9654;';
    btnPlay.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  }

  function loadVideo(track) {
    video.pause();
    configureTrackInteriorVideo(video, track);
    video.load();
    video.currentTime = 0;
    return video.play().catch(() => {});
  }

  function loadTrack(index, autoplay = true) {
    if (!tracks.length) return;

    const i = ((index % tracks.length) + tracks.length) % tracks.length;
    if (window.SiteAccess && !window.SiteAccess.canPlayTrack(i)) return;
    const track = tracks[i];

    audio.pause();
    audio.src = track.audio;
    audio.load();
    audio.currentTime = 0;

    loadVideo(track);

    currentIndex = i;
    updateActiveTrack();

    if (autoplay) {
      audio.play()
        .then(() => {
          isPlaying = true;
          updatePlayButton();
        })
        .catch(() => {
          isPlaying = false;
          updatePlayButton();
        });
    } else {
      isPlaying = false;
      updatePlayButton();
    }
  }

  function togglePlay() {
    if (currentIndex < 0) {
      loadTrack(0, true);
      return;
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play()
        .then(() => {
          isPlaying = true;
        })
        .catch(() => {});
    }
    updatePlayButton();
  }

  function nextTrack() {
    loadTrack(currentIndex + 1, true);
  }

  function prevTrack() {
    loadTrack(currentIndex - 1, true);
  }

  renderTrackList();

  // Auto-load first track — video plays immediately; audio starts if allowed
  if (tracks.length) {
    loadTrack(0, true);
  }

  trackListEl.addEventListener('click', (event) => {
    const btn = event.target.closest('.track-link');
    if (!btn) return;
    loadTrack(Number(btn.dataset.index), true);
  });

  btnPlay.addEventListener('click', togglePlay);
  btnNext.addEventListener('click', nextTrack);
  btnPrev.addEventListener('click', prevTrack);

  const videoInner = document.querySelector('.player-video-inner');
  if (videoInner) {
    videoInner.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (currentIndex < 0 || typeof tracks === 'undefined') return;
      if (window.SiteAccess && !window.SiteAccess.allows('artwork')) return;
      const track = tracks[currentIndex];
      if (track) openTrackArtwork(track.id);
    });
  }

  audio.addEventListener('ended', nextTrack);

  audio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButton();
  });

  audio.addEventListener('pause', () => {
    if (audio.currentTime < audio.duration || audio.currentTime === 0) {
      isPlaying = false;
      updatePlayButton();
    }
  });

  // Media link — placeholder until Bandcamp / profile URLs are ready
  document.getElementById('media-link')?.addEventListener('click', (event) => {
    event.preventDefault();
  });

  // Video debug mode — ?video-debug
  const debugEnabled = new URLSearchParams(window.location.search).has('video-debug');

  if (debugEnabled && stage && video) {
    video.classList.add('debug');
    initVideoDebug(stage);
  }

  function initVideoDebug(stageEl) {
    const readVar = (name, fallback) =>
      getComputedStyle(stageEl).getPropertyValue(name).trim() || fallback;

    const parsePercent = (value) => parseFloat(value) || 0;

    let videoX = parsePercent(readVar('--video-x', '50%'));
    let videoY = parsePercent(readVar('--video-y', '56%'));
    let videoSize = parsePercent(readVar('--video-size', '20%'));

    const panel = document.createElement('aside');
    panel.className = 'video-debug-panel';
    panel.innerHTML = `
      <h2>Video Alignment</h2>
      <label>
        --video-x
        <input type="range" id="dbg-x" min="0" max="100" step="0.1" value="${videoX}">
        <output id="dbg-x-out">${videoX}%</output>
      </label>
      <label>
        --video-y
        <input type="range" id="dbg-y" min="0" max="100" step="0.1" value="${videoY}">
        <output id="dbg-y-out">${videoY}%</output>
      </label>
      <label>
        --video-size
        <input type="range" id="dbg-size" min="5" max="45" step="0.1" value="${videoSize}">
        <output id="dbg-size-out">${videoSize}%</output>
      </label>
      <div class="video-debug-actions">
        <button type="button" id="dbg-copy">Copy CSS</button>
        <button type="button" id="dbg-reset">Reset</button>
      </div>
    `;
    document.body.appendChild(panel);

    const defaults = { x: 50, y: 56, size: 20 };
    const xInput = panel.querySelector('#dbg-x');
    const yInput = panel.querySelector('#dbg-y');
    const sizeInput = panel.querySelector('#dbg-size');
    const xOut = panel.querySelector('#dbg-x-out');
    const yOut = panel.querySelector('#dbg-y-out');
    const sizeOut = panel.querySelector('#dbg-size-out');

    function applyVars() {
      stageEl.style.setProperty('--video-x', `${videoX}%`);
      stageEl.style.setProperty('--video-y', `${videoY}%`);
      stageEl.style.setProperty('--video-size', `${videoSize}%`);
      xOut.textContent = `${videoX}%`;
      yOut.textContent = `${videoY}%`;
      sizeOut.textContent = `${videoSize}%`;
    }

    xInput.addEventListener('input', () => {
      videoX = parseFloat(xInput.value);
      applyVars();
    });
    yInput.addEventListener('input', () => {
      videoY = parseFloat(yInput.value);
      applyVars();
    });
    sizeInput.addEventListener('input', () => {
      videoSize = parseFloat(sizeInput.value);
      applyVars();
    });

    panel.querySelector('#dbg-copy').addEventListener('click', () => {
      const css = `--video-x: ${videoX}%;\n--video-y: ${videoY}%;\n--video-size: ${videoSize}%;`;
      navigator.clipboard.writeText(css).catch(() => {
        window.prompt('Copy into player-config.css:', css);
      });
    });

    panel.querySelector('#dbg-reset').addEventListener('click', () => {
      videoX = defaults.x;
      videoY = defaults.y;
      videoSize = defaults.size;
      xInput.value = videoX;
      yInput.value = videoY;
      sizeInput.value = videoSize;
      applyVars();
    });
  }
})();
