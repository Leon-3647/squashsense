import { english, siteConfig } from './content.js?v=20261010-evidence1';
import { initInstallation } from './installation.js?v=20261004-motion2';

/* ---------- Language ---------- */
const translatedNodes = [...document.querySelectorAll('[data-i18n],[data-i18n-html],[data-i18n-alt],[data-i18n-aria]')];
const original = new Map(translatedNodes.map(node => [node, { text: node.textContent, html: node.innerHTML, alt: node.getAttribute('alt'), aria: node.getAttribute('aria-label') }]));
const titles = { en: 'SquashSense — Review your swing with racket motion and body tracking', zh: 'SquashSense — 用球拍运动数据和身体追踪复盘挥拍' };
const descriptions = {
  en: 'SquashSense is a student-built squash training research prototype: a racket-mounted motion sensor and camera-based body tracking on one timeline, with an honest account of what has and has not been tested.',
  zh: 'SquashSense 是一个学生自制的壁球训练研究原型：球拍末端的运动传感器加场边摄像头的身体追踪，把两路数据放在同一条时间线上，供训练后复盘。',
};
let language = 'en';
const urlLang = new URLSearchParams(location.search).get('lang');
if (urlLang === 'zh' || urlLang === 'en') language = urlLang;
else { try { language = localStorage.getItem('squashsense-language') === 'zh' ? 'zh' : 'en'; } catch {} }
const langButton = document.querySelector('.lang-switch');
const missingKeys = new Set();
function lookup(key) {
  if (Object.prototype.hasOwnProperty.call(english, key)) return english[key];
  missingKeys.add(key);
  return null;
}
function setLanguage(next, { updateUrl = true } = {}) {
  language = next;
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  translatedNodes.forEach(node => {
    const previous = original.get(node);
    if (node.dataset.i18n) { const v = next === 'en' ? lookup(node.dataset.i18n) : previous.text; if (v !== null) node.textContent = v; }
    if (node.dataset.i18nHtml) { const v = next === 'en' ? lookup(node.dataset.i18nHtml) : previous.html; if (v !== null) node.innerHTML = v; }
    if (node.dataset.i18nAlt) { const v = next === 'en' ? lookup(node.dataset.i18nAlt) : previous.alt; if (v !== null) node.alt = v; }
    if (node.dataset.i18nAria) { const v = next === 'en' ? lookup(node.dataset.i18nAria) : previous.aria; if (v !== null) node.setAttribute('aria-label', v); }
  });
  document.getElementById('lang-label').textContent = next === 'en' ? '中文' : 'EN';
  langButton.setAttribute('aria-label', next === 'en' ? '切换到中文' : 'Switch to English');
  langButton.setAttribute('lang', next === 'en' ? 'zh-CN' : 'en');
  document.title = titles[next];
  document.querySelector('meta[name=description]').content = descriptions[next];
  try { localStorage.setItem('squashsense-language', next); } catch {}
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('lang', next);
    history.replaceState(null, '', url);
  }
  if (missingKeys.size) console.warn('Missing English strings:', [...missingKeys]);
  window.dispatchEvent(new CustomEvent('site-language', { detail: next }));
}
langButton.addEventListener('click', () => setLanguage(language === 'zh' ? 'en' : 'zh'));
setLanguage(language, { updateUrl: urlLang !== null });
window.getSiteLanguage = () => language;
initInstallation(() => language);

/* ---------- Mobile menu ---------- */
const header = document.querySelector('.site-header');
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('site-nav');
function setMenu(open) {
  header.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  const label = open ? (language === 'en' ? english.menuClose : '关闭菜单') : (language === 'en' ? english.menuOpen : '打开菜单');
  menuToggle.setAttribute('aria-label', label);
  if (open) nav.querySelector('a').focus();
}
menuToggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) { setMenu(false); menuToggle.focus(); }
});
window.addEventListener('site-language', () => { if (menuToggle.getAttribute('aria-expanded') === 'true') setMenu(true); else menuToggle.setAttribute('aria-label', language === 'en' ? english.menuOpen : '打开菜单'); });
window.matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

/* ---------- Video players: one at a time, pause when hidden ---------- */
const players = [];
const statusText = key => language === 'en' ? english[key] : ({ videoLoading: '加载中…', videoPaused: '已暂停', videoPausedAway: '离开画面时已暂停' })[key];

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
  window.addEventListener('site-language', refresh);
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
  short: { en: english.creatorPlay, zh: '播放 1 分 18 秒精简版', ariaEn: english.creatorPlayAria, ariaZh: '播放 Leon 的项目介绍（1 分 18 秒精简版）' },
  full: { en: 'Play the full 12:32 interview', zh: '播放 12 分 32 秒完整版', ariaEn: 'Play Leon’s full project introduction (12 min 32 s, English captions)', ariaZh: '播放 Leon 的项目介绍完整版（12 分 32 秒，英文字幕）' },
};
function applyCreatorLabels() {
  const labels = playLabels[creatorVersion];
  creatorPlayButton.querySelector('[data-i18n]').textContent = language === 'en' ? labels.en : labels.zh;
  creatorPlayButton.setAttribute('aria-label', language === 'en' ? labels.ariaEn : labels.ariaZh);
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
window.addEventListener('site-language', applyCreatorLabels);
if (captionTrack.isConnected) captionTrack.remove(); // short version is the default
applyCreatorLabels();
