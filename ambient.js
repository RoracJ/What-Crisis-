window.CrisisAmbient = (() => {
  const STOP_KEY = 'wc-ambient-stop';

  const sources = {
    home: 'audio/homer.mp3',
    street: 'audio/Game.mp3',
    labOff: 'audio/Lab1.mp3',
    labOn: 'audio/Lab 2.mp3',
    gallery: 'audio/git jules.mp3'
  };

  const players = {};
  let current = null;

  function get(name) {
    if (!sources[name]) return null;
    if (!players[name]) {
      const audio = new Audio(sources[name]);
      audio.loop = true;
      /* Don't download every scene track on first unlock — only current play(). */
      audio.preload = 'none';
      players[name] = audio;
    }
    return players[name];
  }

  function stopNamed(name) {
    const audio = players[name];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function muteDecorativeVideos(except) {
    document.querySelectorAll('video').forEach((el) => {
      if (except && el === except) return;
      el.muted = true;
      el.defaultMuted = true;
      el.setAttribute('muted', '');
      el.volume = 0;
    });
  }

  function stopAllAudio(except) {
    Object.keys(players).forEach((name) => {
      if (players[name] !== except) stopNamed(name);
    });
    document.querySelectorAll('audio').forEach((el) => {
      if (el === except) return;
      el.pause();
      el.currentTime = 0;
    });
  }

  function signalOtherTabs() {
    try {
      localStorage.setItem(STOP_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  }

  function stopAll() {
    current = null;
    stopAllAudio();
    muteDecorativeVideos();
  }

  /* Likely next ambient after the current scene (hidden path). */
  const NEXT = {
    home: null,
    street: 'labOff',
    labOff: 'labOn',
    labOn: 'gallery',
    gallery: null
  };

  function warm(name) {
    if (!name || !sources[name]) return;
    const audio = get(name);
    if (audio) audio.preload = 'auto';
  }

  function unlock() {
    /* After a real gesture: warm street only if the game layer is reachable. */
    if (!window.SiteAccess || window.SiteAccess.allows('game')) warm('street');
  }

  function play(name) {
    if (!sources[name]) return;
    signalOtherTabs();
    const audio = get(name);
    audio.preload = 'auto';
    stopAllAudio(audio);
    muteDecorativeVideos();
    current = name;
    audio.volume = 1;
    if (audio.paused) audio.play().catch(() => {});
    /* Staged: start fetching the following scene while this one plays. */
    warm(NEXT[name]);
  }

  function pauseCurrent() {
    if (current && players[current]) players[current].pause();
  }

  function stop() {
    signalOtherTabs();
    stopAll();
  }

  function silencePage(exceptVideo) {
    signalOtherTabs();
    current = null;
    stopAllAudio();
    muteDecorativeVideos(exceptVideo);
  }

  function soloVideo(video) {
    signalOtherTabs();
    current = null;
    stopAllAudio();
    muteDecorativeVideos(video);
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute('muted');
    video.volume = 1;
  }

  window.addEventListener('pagehide', stopAll);
  window.addEventListener('freeze', stopAll);

  window.addEventListener('storage', (event) => {
    if (event.key === STOP_KEY) stopAll();
  });

  return {
    play,
    stop,
    stopAll,
    silencePage,
    soloVideo,
    pauseCurrent,
    muteDecorativeVideos,
    unlock,
    warm,
    get current() {
      return current;
    }
  };
})();
