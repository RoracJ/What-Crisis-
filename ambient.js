window.CrisisAmbient = (() => {
  const STOP_KEY = 'wc-ambient-stop';

  const sources = {
    home: 'audio/homer.mp3',
    street: 'audio/Game.mp3',
    labOff: 'audio/Lab1.mp3',
    labOn: 'audio/Lab 2.mp3'
  };

  const players = {};
  let current = null;

  function get(name) {
    if (!players[name]) {
      const audio = new Audio(sources[name]);
      audio.loop = true;
      audio.preload = 'auto';
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

  function silenceDomMedia() {
    document.querySelectorAll('audio, video').forEach((el) => {
      el.pause();
      if ('currentTime' in el) el.currentTime = 0;
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
    Object.keys(players).forEach(stopNamed);
    silenceDomMedia();
    current = null;
  }

  function unlock() {
    Object.keys(sources).forEach(get);
  }

  function play(name) {
    if (!sources[name]) return;
    signalOtherTabs();
    if (current === name) {
      const audio = get(name);
      if (audio.paused) audio.play().catch(() => {});
      return;
    }
    stopAll();
    current = name;
    get(name).play().catch(() => {});
  }

  function stop() {
    signalOtherTabs();
    stopAll();
  }

  function silencePage() {
    signalOtherTabs();
    stopAll();
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
    unlock,
    get current() {
      return current;
    }
  };
})();
