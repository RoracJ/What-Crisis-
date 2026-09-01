window.CrisisAmbient = (() => {
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

  function unlock() {
    Object.keys(sources).forEach(get);
  }

  function play(name) {
    if (!sources[name]) return;
    if (current === name) {
      const audio = get(name);
      if (audio.paused) audio.play().catch(() => {});
      return;
    }
    if (current) stopNamed(current);
    current = name;
    get(name).play().catch(() => {});
  }

  function stop() {
    if (!current) return;
    stopNamed(current);
    current = null;
  }

  return {
    play,
    stop,
    unlock,
    get current() { return current; }
  };
})();
