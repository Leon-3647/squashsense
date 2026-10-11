# SquashSense

Bilingual project website for SquashSense, a student-built squash training research prototype by Leon: a racket-mounted motion sensor and camera-based body tracking on one timeline.

The site presents the prototype as it is — what the recorded test demonstrates, what is reported but not independently verified, and what remains unvalidated. See `docs/project-overview.html` for the one-page summary and `docs/implementation-notes.md` for the evidence gaps behind the page.

## Structure

- `index.html` — the page. Chinese text is the source in the markup; English strings live in `js/content.js` and are swapped in by `js/main.js` (`data-i18n*` attributes). English is the default; `?lang=zh` / `?lang=en` select a language and the choice is remembered.
- `js/main.js` — language switch, mobile menu, video players (one plays at a time; playback pauses when a player leaves the viewport or the tab is hidden and never resumes on its own), short/full introduction versions, chapter seeking.
- `js/installation.js` — the canvas sketch of the sensor mounting (unchanged).
- `styles/main.css` — original styles plus the 2026-10 revision block appended at the end.
- `assets/` — photos, demo frames (`assets/demo/`), videos and the English captions file (`assets/captions/`).
- `docs/` — project overview page and implementation notes.

## Media

- `assets/training-demo.mp4` — 2:00 screen recording of the training interface, 27 August 2026 (no narration).
- `assets/author-intro.mp4` — Leon's 12:32 introduction, re-encoded to 720p (about 55 MB; the original 1080p file is in the git history).
- `assets/author-intro-short.mp4` — 1:18 cut of the introduction (0:00–0:22, 5:19–6:02, 6:34–6:48 of the original).
- `assets/captions/author-intro.en.vtt` — English captions for the full introduction, produced by speech recognition and corrected by context.

## Publishing

Static site, no build step. GitHub Pages serves the `main` branch from the repository root. To preview locally:

```
python3 -m http.server 8000
```

then open http://localhost:8000/ (the page uses ES modules, so it needs a server rather than a `file://` URL).
