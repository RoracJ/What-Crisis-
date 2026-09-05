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
 *   artwork  — full Julian drawing shown on the black artwork page
 *
 * `video` is the player + gallery Object interior loop.
 */

const tracks = [
  {
    id: 'track-one',
    title: 'Track One',
    audio: 'audio/track-one.m4a',
    video: 'video/track-one.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-one.jpg'
  },
  {
    id: 'track-two',
    title: 'Track Two',
    audio: 'audio/track-two.m4a',
    video: 'video/track-two.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-two.jpg'
  },
  {
    id: 'track-three',
    title: 'Track Three',
    audio: 'audio/track-three.m4a',
    video: 'video/track-three.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-three.jpg'
  },
  {
    id: 'track-four',
    title: 'Track Four',
    audio: 'audio/track-four.m4a',
    video: 'video/track-four.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-four.jpg'
  },
  {
    id: 'track-five',
    title: 'Track Five',
    audio: 'audio/track-five.m4a',
    video: 'video/track-five.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-five.jpg'
  },
  {
    id: 'track-six',
    title: 'Track Six',
    audio: 'audio/track-six.m4a',
    video: 'video/track-six.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-six.jpg'
  },
  {
    id: 'track-seven',
    title: 'Track Seven',
    audio: 'audio/track-seven.mp3',
    video: 'video/track-seven.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-seven.jpg'
  },
  {
    id: 'track-eight',
    title: 'Track Eight',
    audio: 'audio/track-eight.mp3',
    video: 'video/track-eight.mov',
    portal: 'assets/game/Object.png',
    artwork: 'assets/artwork/track-eight.jpg'
  }
];

const GALLERY_ARMS = [
  { name: 'top', degrees: 0 },
  { name: 'upper-right', degrees: 45 },
  { name: 'right', degrees: 90 },
  { name: 'lower-right', degrees: 135 },
  { name: 'bottom', degrees: 180 },
  { name: 'lower-left', degrees: 225 },
  { name: 'left', degrees: 270 },
  { name: 'upper-left', degrees: 315 }
];

function getTrackById(id) {
  return tracks.find((track) => track.id === id) || null;
}

function getTrackInterior(track) {
  return (track && (track.video || track.interior)) || 'videos/portal.mov?v=2';
}

function getTrackAudio(track) {
  return (track && track.audio) || '';
}

/** Shared player + gallery interior video setup (muted loop, no controls). */
function configureTrackInteriorVideo(video, track) {
  if (!video || !track) return video;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.volume = 0;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.autoplay = true;
  video.preload = 'auto';
  video.controls = false;
  video.disablePictureInPicture = true;
  video.setAttribute('disablepictureinpicture', '');
  video.src = getTrackInterior(track);
  return video;
}

function createTrackInteriorVideo(track) {
  const video = document.createElement('video');
  configureTrackInteriorVideo(video, track);
  return video;
}

function getArtworkUrl(id) {
  return `julian.html?art=${encodeURIComponent(id)}`;
}

function openTrackArtwork(id) {
  const url = getArtworkUrl(id);
  if (window.opener && !window.opener.closed) {
    if (window.opener.CrisisAmbient) window.opener.CrisisAmbient.silencePage();
    window.opener.location.href = url;
    window.opener.focus();
    return;
  }
  window.location.href = url;
}

function getGalleryArmPosition(stage, armDegrees) {
  const styles = getComputedStyle(stage);
  const cx = parseFloat(styles.getPropertyValue('--station-cx')) || 50;
  const cy = parseFloat(styles.getPropertyValue('--station-cy')) || 50;
  const radius = parseFloat(styles.getPropertyValue('--portal-radius')) || 41.5;
  const rad = (armDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad)
  };
}
