import { siteConfig } from './content.js?v=20261011-en';
import { initInstallation } from './installation.js?v=20261011-en';

const language = 'en';
initInstallation(() => language);

/* ---------- Mobile menu ---------- */
const header = document.querySelector('.site-header');
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('site-nav');
function setMenu(open) {
  header.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  const label = open ? 'Close menu' : 'Open menu';
  menuToggle.setAttribute('aria-label', label);
  if (open) nav.querySelector('a').focus();
}
menuToggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) { setMenu(false); menuToggle.focus(); }
});
window.matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

/* ---------- Video players: one at a time, pause when hidden ---------- */
const players = [];
const statusText = key => ({ videoLoading: 'Loading…', videoPaused: 'Paused', videoPausedAway: 'Paused while off screen' })[key];

function setupPlayer(video, { overlay, button, error }) {
  const status = overlay.querySelector('[data-status]');
  const state = { video, button, overlay, error, started: false, pausedAway: false, manualPause: false };
  const showOverlay = (visible, note = '') => {
    overlay.classList.toggle('is-hidden', !visible);
    button.hidden = !visible;
    status.textContent = note;
  };
  const refresh = () => {
    if (!video.paused && !video.ended) showOverlay(false);
    else if (video.ended) showOverlay(true);
    else showOverlay(true, state.started ? (state.pausedAway ? statusText('videoPausedAway') : '') : '');
  };
  button.addEventListener('click', async () => {
    error.hidden = true;
    status.textContent = statusText('videoLoading');
    if (state.failed || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) { state.failed = false; video.load(); }
    // A <video> with <source> children never rejects play() when no source loads; check for it explicitly.
    setTimeout(() => { if (video.paused && video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) onError(); }, 3000);
    try { await video.play(); }
    catch (err) { if (err && err.name !== 'AbortError') onError(); }
  });
  video.addEventListener('play', () => {
    state.started = true; state.pausedAway = false; error.hidden = true;
    players.forEach(other => { if (other.video !== video && !other.video.paused) { other.manualPause = true; other.video.pause(); } });
    showOverlay(false);
  });
  video.addEventListener('playing', () => { status.textContent = ''; showOverlay(false); });
  video.addEventListener('pause', refresh);
  video.addEventListener('ended', refresh);
  video.addEventListener('waiting', () => { if (!video.paused) status.textContent = statusText('videoLoading'); });
  video.addEventListener('stalled', () => { if (!video.paused) status.textContent = statusText('videoLoading'); });
  const onError = () => { state.failed = true; error.hidden = false; showOverlay(true); };
  video.addEventListener('error', onError);
  // With <source> children the browser reports a failed load on the <source>, not on the <video>.
  video.querySelectorAll('source').forEach(source => source.addEventListener('error', onError));
  video.addEventListener('emptied', refresh);
  // Pause when most of the player leaves the viewport; never auto-resume.
  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    if (!entry.isIntersecting && !video.paused && !video.ended) { state.pausedAway = true; video.pause(); }
  }, { threshold: 0.25 });
  observer.observe(video);
  refresh();
  players.push(state);
  return state;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) players.forEach(p => { if (!p.video.paused && !p.video.ended) { p.pausedAway = true; p.video.pause(); } });
});

const trainingVideo = document.getElementById('training-video');
setupPlayer(trainingVideo, {
  overlay: trainingVideo.closest('[data-video-shell]').querySelector('[data-overlay]'),
  button: document.getElementById('play-demo'),
  error: document.getElementById('video-error'),
});

/* ---------- Introduction video: short / full versions and chapters ---------- */
const creatorVideo = document.getElementById('creator-video');
const creatorSource = creatorVideo.querySelector('source');
const captionTrack = creatorVideo.querySelector('track');
const creatorPlayButton = document.getElementById('play-creator');
const creatorPlayer = setupPlayer(creatorVideo, {
  overlay: creatorVideo.closest('[data-video-shell]').querySelector('[data-overlay]'),
  button: creatorPlayButton,
  error: document.getElementById('creator-video-error'),
});
const versionButtons = [...document.querySelectorAll('.version-button')];
const durationLabel = document.getElementById('creator-duration');
let creatorVersion = 'short';
const playLabels = {
  short: { text: 'Play the 1:18 short version', aria: 'Play Leon’s project introduction (1 min 18 s short version)' },
  full: { text: 'Play the full 12:32 interview', aria: 'Play Leon’s full project introduction (12 min 32 s, English captions)' },
};
function applyCreatorLabels() {
  const labels = playLabels[creatorVersion];
  creatorPlayButton.querySelector('.creator-play-text').textContent = labels.text;
  creatorPlayButton.setAttribute('aria-label', labels.aria);
  durationLabel.textContent = siteConfig[creatorVersion === 'short' ? 'creatorShort' : 'creatorFull'].duration;
}
function setCreatorVersion(version, { autoplay = false, seekTo = null } = {}) {
  const config = siteConfig[version === 'short' ? 'creatorShort' : 'creatorFull'];
  const changed = version !== creatorVersion;
  creatorVersion = version;
  versionButtons.forEach(b => { const active = b.dataset.version === version; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  if (changed) {
    creatorVideo.pause();
    creatorSource.src = config.src;
    // Captions are timed to the full interview only.
    if (version === 'full') { if (!captionTrack.isConnected) creatorVideo.appendChild(captionTrack); }
    else if (captionTrack.isConnected) captionTrack.remove();
    creatorVideo.load();
    creatorPlayer.started = false; creatorPlayer.pausedAway = false;
  }
  applyCreatorLabels();
  if (seekTo !== null) {
    const seek = () => { creatorVideo.currentTime = seekTo; };
    if (creatorVideo.readyState >= 1) seek(); else creatorVideo.addEventListener('loadedmetadata', seek, { once: true });
  }
  if (autoplay) creatorVideo.play().catch(() => {});
}
versionButtons.forEach(b => b.addEventListener('click', () => setCreatorVersion(b.dataset.version)));
document.querySelectorAll('#chapter-list [data-seek]').forEach(button => {
  button.addEventListener('click', () => {
    setCreatorVersion('full', { autoplay: true, seekTo: Number(button.dataset.seek) });
    creatorVideo.closest('.creator-block').scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
});
if (captionTrack.isConnected) captionTrack.remove(); // short version is the default
applyCreatorLabels();
