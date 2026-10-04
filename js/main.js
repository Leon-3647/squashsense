import { english, siteConfig } from './content.js?v=20261002-intro-v6';
import { initInstallation } from './installation.js?v=20261004-motion2';

const translatedNodes = [...document.querySelectorAll('[data-i18n],[data-i18n-html],[data-i18n-alt],[data-i18n-aria]')];
const original = new Map(translatedNodes.map(node => [node, { text: node.textContent, html: node.innerHTML, alt: node.getAttribute('alt'), aria: node.getAttribute('aria-label') }]));
let language = 'en';
try { language = localStorage.getItem('squashsense-language') === 'zh' ? 'zh' : 'en'; } catch {}
const langButton = document.querySelector('.lang-switch');
function setLanguage(next) {
  language = next;
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  translatedNodes.forEach(node => {
    const previous = original.get(node);
    if (node.dataset.i18n) node.textContent = next === 'en' ? english[node.dataset.i18n] : previous.text;
    if (node.dataset.i18nHtml) node.innerHTML = next === 'en' ? english[node.dataset.i18nHtml] : previous.html;
    if (node.dataset.i18nAlt) node.alt = next === 'en' ? english[node.dataset.i18nAlt] : previous.alt;
    if (node.dataset.i18nAria) node.setAttribute('aria-label', next === 'en' ? english[node.dataset.i18nAria] : previous.aria);
  });
  document.getElementById('lang-label').textContent = next === 'en' ? '中文' : 'EN';
  langButton.setAttribute('aria-label', next === 'en' ? '切换到中文' : 'Switch to English');
  document.title = next === 'en' ? 'SquashSense — Every swing. A deeper insight.' : 'SquashSense — 让每一次挥拍，都有迹可循';
  document.querySelector('meta[name=description]').content = next === 'en' ? 'SquashSense combines a racket motion sensor and camera-based body pose tracking on ROCK 5C for a fuller view of squash training.' : 'SquashSense 将球拍惯性传感器与摄像头人体姿态结合，在 ROCK 5C 上呈现更完整的壁球训练视角。';
  try { localStorage.setItem('squashsense-language', next); } catch {}
  window.dispatchEvent(new CustomEvent('site-language', { detail: next }));
}
langButton.addEventListener('click', () => setLanguage(language === 'zh' ? 'en' : 'zh'));
setLanguage(language);
initInstallation(() => language);

const trainingVideo = document.getElementById('training-video');
const playButton = document.getElementById('play-demo');
const errorNotice = document.getElementById('video-error');
playButton.addEventListener('click', async () => {
  errorNotice.hidden = true;
  try { await trainingVideo.play(); playButton.hidden = true; }
  catch { errorNotice.hidden = false; }
});
trainingVideo.addEventListener('play', () => { playButton.hidden = true; });
trainingVideo.addEventListener('ended', () => { playButton.hidden = false; });
trainingVideo.addEventListener('error', () => { errorNotice.hidden = false; });

if (siteConfig.creatorVideo) {
  const image = document.querySelector('.creator-image');
  const creatorPlay = document.getElementById('play-creator');
  const creatorError = document.getElementById('creator-video-error');
  const authorVideo = document.createElement('video');
  authorVideo.id = 'creator-video';
  authorVideo.className = 'creator-video';
  authorVideo.playsInline = true;
  authorVideo.preload = 'none';
  authorVideo.poster = siteConfig.creatorPoster;
  authorVideo.src = siteConfig.creatorVideo;
  image.replaceChildren(authorVideo, creatorPlay);
  creatorPlay.hidden = false;
  creatorPlay.addEventListener('click', async () => {
    creatorError.hidden = true;
    try { await authorVideo.play(); }
    catch { creatorError.hidden = false; }
  });
  authorVideo.addEventListener('play', () => {
    creatorPlay.hidden = true;
    creatorError.hidden = true;
    authorVideo.controls = true;
  });
  authorVideo.addEventListener('ended', () => {
    creatorPlay.hidden = false;
    authorVideo.controls = false;
  });
  authorVideo.addEventListener('error', () => {
    creatorError.hidden = false;
    creatorPlay.hidden = false;
  });
  const syncAuthorLabel = () => {
    authorVideo.setAttribute('aria-label', language === 'zh' ? 'Leon 的项目介绍视频' : english.creatorVideoLabel);
  };
  syncAuthorLabel();
  window.addEventListener('site-language', syncAuthorLabel);
}
