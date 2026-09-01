(() => {
  const gallery = document.getElementById('julian-gallery');
  const artwork = document.getElementById('julian-artwork');
  const artImage = document.getElementById('julian-art-image');
  if (!gallery || !artwork || !artImage || typeof tracks === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const artId = params.get('art');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function goHome() {
    window.location.href = 'index.html';
  }

  function showArtwork(track) {
    if (!track) {
      goHome();
      return;
    }
    gallery.hidden = true;
    gallery.replaceChildren();
    artwork.hidden = false;
    artImage.src = track.artwork;
    document.body.style.overflow = 'hidden';
  }

  function showGallery() {
    artwork.hidden = true;
    artImage.removeAttribute('src');
    gallery.hidden = false;
    document.body.style.overflow = '';

    tracks.forEach((track) => {
      const stone = document.createElement('button');
      stone.type = 'button';
      stone.className = 'julian-stone';
      stone.dataset.trackId = track.id;

      const film = document.createElement('video');
      film.className = 'julian-stone-film';
      film.muted = true;
      film.loop = true;
      film.playsInline = true;
      film.setAttribute('playsinline', '');
      film.preload = 'metadata';
      film.src = getTrackInterior(track);

      const shell = document.createElement('img');
      shell.className = 'julian-stone-shell';
      shell.src = track.portal;
      shell.alt = '';
      shell.draggable = false;

      stone.append(film, shell);
      stone.addEventListener('click', () => {
        window.location.href = getArtworkUrl(track.id);
      });
      gallery.append(stone);

      if (!reducedMotion.matches) {
        film.play().catch(() => {});
      }
    });
  }

  if (artId) {
    if (window.SiteAccess && !window.SiteAccess.allows('artwork')) {
      goHome();
      return;
    }
    showArtwork(getTrackById(artId));
    artwork.addEventListener('click', goHome);
    return;
  }

  if (window.SiteAccess && !window.SiteAccess.allows('gallery')) {
    goHome();
    return;
  }

  showGallery();
})();
