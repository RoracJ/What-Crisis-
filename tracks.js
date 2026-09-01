/*
 * ═══════════════════════════════════════════════════════════
 *  SHARED ALBUM / GALLERY MAP — source of truth
 * ═══════════════════════════════════════════════════════════
 *
 * One entry per song, in player order. Player, hidden gallery,
 * and Julian artwork all read this same list.
 *
 * Replace later, per track:
 *   portal   — Object / stone outline image
 *   interior — muted looping film inside that Object
 *   artwork  — Julian emoji art shown full-bleed
 *
 * `video` is the player Object interior. Gallery uses `interior`
 * (falls back to `video`, then videos/portal.mov).
 */

const tracks = [
  {
    id: 'track-one',
    title: 'Track One',
    audio: 'audio/track-one.mp3',
    video: 'video/track-one.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  },
  {
    id: 'track-two',
    title: 'Track Two',
    audio: 'audio/track-two.mp3',
    video: 'video/track-two.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  },
  {
    id: 'track-three',
    title: 'Track Three',
    audio: 'audio/track-three.mp3',
    video: 'video/track-three.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  },
  {
    id: 'track-four',
    title: 'Track Four',
    audio: 'audio/track-four.mp3',
    video: 'video/track-four.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  },
  {
    id: 'track-five',
    title: 'Track Five',
    audio: 'audio/track-five.mp3',
    video: 'video/track-five.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  },
  {
    id: 'track-six',
    title: 'Track Six',
    audio: 'audio/track-six.mp3',
    video: 'video/track-six.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  },
  {
    id: 'track-seven',
    title: 'Track Seven',
    audio: 'audio/track-seven.mp3',
    video: 'video/track-seven.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  },
  {
    id: 'track-eight',
    title: 'Track Eight',
    audio: 'audio/track-eight.mp3',
    video: 'video/track-eight.mov',
    portal: 'assets/game/Object.png',
    interior: 'videos/portal.mov',
    artwork: 'assets/game/Object.png'
  }
];

function getTrackById(id) {
  return tracks.find((track) => track.id === id) || null;
}

function getTrackInterior(track) {
  return (track && (track.interior || track.video)) || 'videos/portal.mov';
}

function getArtworkUrl(id) {
  return `julian.html?art=${encodeURIComponent(id)}`;
}

function openTrackArtwork(id) {
  const url = getArtworkUrl(id);
  if (window.opener && !window.opener.closed) {
    window.opener.location.href = url;
    window.opener.focus();
    return;
  }
  window.location.href = url;
}
