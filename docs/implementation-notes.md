# Implementation notes — October 2026 revision

Working notes for Leon. Nothing here is published on the page; it records where each claim on the site comes from, what could not be verified, and what is still missing.

## Evidence used

| Source | Used for |
|---|---|
| `assets/training-demo.mp4` (screen recording, 2026-08-27) | Every description of what the interface displays; the walkthrough frames in `assets/demo/`; the metric table; the "problems visible in the recording" list; session facts (22 min, 197 swings, free hitting, one player) |
| `assets/author-intro.mp4` (12:32 interview, English) | How the system works, the two documented changes (clock alignment, swing detection), what Leon built, what was new to him, next steps; the written summary and chapter timestamps; captions |
| Photos in `assets/` | Build captions (workbench, grip mounting, camera on glass, courtside laptop, sensor close-up) |
| Earlier Cowork session notes (Leon's own statements, August 2026) | Component names (ESP32-S3, ICM42688, ESP-NOW, USB receiver, ROCK 5C, MediaPipe), the fact that the app was developed on a simulator before real data |
| Leon's answers in this session | Credits (teammates tested, a teacher advised, AI-assisted coding), roles only, no names; website repo is public and may be linked |

**Not inspected:** the application repository (`squash-app`) and the firmware repository (Racket tracker). They were not on this Mac and are not public. The page says so in the "How it works" note and in the overview.

## Claims that are reported, not verified

These appear on the page attributed to Leon's description ("as I describe it", "my own account"):

- Clock alignment on fastest observed delivery with gradual correction and displayed uncertainty.
- Swing detection by sustained acceleration; contact = shock on the accelerometer while near peak speed; phases assigned afterwards from direction changes.
- Firmware details: packet format with corruption detection; first microcontroller project.
- Gravity separation, smoothing decisions and orientation estimation in the sensor processing.
- Detection and scoring tuned on a simulator before court sessions.

## Inferences made on the page (flagged so you can correct them)

1. **Latency card ≈ 1,252,800 ms is a clock-reference offset, not a delay.** Basis: the value is constant across the whole session (1,252,760 → 1,252,893 ms over about 100 s of recording), which a real delivery delay would not do, and the interview describes the sensor, computer and browser keeping separate clocks. If the real cause is different, edit `t4L1`, `m11St`, `walk2L4` (EN in `js/content.js`, ZH in `index.html`) and the overview.
2. **"挥拍节奏" is not a plain swings-per-minute rate.** Basis: it is negative throughout (−3.0 to −6.4). The page says only that it is unvalidated.
3. **Header "已识别挥拍" vs card "挥拍次数" use different rules.** Basis: the two numbers differ on the same screen (38 vs 44, 80 vs 59, 167 vs 94). The page says the counters disagree, not why.
4. **"重心 稳定" is a software judgement.** Basis: it is a label, not a number.
5. **The courtside camera does not send frames back to the browser timeline.** Basis: the interface's own message "无视频：后端摄像头不回传画面".
6. **Angles marked * are image-plane angles.** Basis: the interface's own note "* 表示图像平面角".
7. **Session date 27 August 2026.** Basis: the interface header (8月27日星期四) and the report (2026-08-27 · 11:10); the workbench photo's monitor shows the same date.
8. **Short-cut timestamps.** 0:00–0:22, 5:19–6:02 and 6:34–6:48 of the original, chosen at sentence boundaries from the VAD segmentation.

## Facts left out because they are not known or not measured

- Sensor weight, dimensions, battery type and capacity, battery life, charging method.
- Setup / calibration time.
- Number of informal court sessions and who swung in them (Leon chose "a few sessions" but no count was given). The page says "a small number of informal court sessions" and "the sessions were not logged".
- Whether teammates swung with the sensor fitted (only "took part in the court tests" is stated).
- The swing-speed conversion method (angular velocity → km/h) and the lever length it assumes.
- Which open-source web libraries the interface uses (not visible in the recording; the page says "open-source web libraries").
- Mentor's and teammates' names (Leon chose roles only).
- Age when Leon started playing: the old page said eight, the interview says nine. The page now says "about ten years"; pick one if you want a number.
- Whether the purple enclosure and the sensor housing were 3D-printed or bought (the page says all hardware is off-the-shelf; the housing is described only as "a short cylindrical housing").
- Exact camera module and lens.

## Known inconsistencies in the recording (shown on the page rather than hidden)

- 挥拍速度 261.7 km/h (+579 %) at 20:19; 96.1 km/h (+85 %) at 20:48.
- 挥拍一致性 0 分 / CV 174.4 % at 20:19; 55 分 / CV 9.8 % at 20:48.
- 未设置中立姿态 throughout → 拍面角度 values have no reference; the report still says "击球时拍面角度偏大（均值 85.1°）".
- Report swing types: 正手 8, 反手 4, 发球 65, 未分类 ≈ 120 of 197.
- 击球前加速时间 3.59 s in the deep-analysis card (not plausible for one swing; not mentioned on the page because it appears only briefly).
- Latency card 1,252,7xx ms (see inference 1).

## Captions

`assets/captions/author-intro.en.vtt` was produced with an automatic speech recogniser (SenseVoice via sherpa-onnx, VAD-segmented) and then edited: proper nouns fixed (Hotchkiss, Leon Li), obvious mis-hearings corrected from context (e.g. "squashhor" → "squash court", "Showt" → "a shock", "Claire who used" → "players who use", "dedicating it into work" → "dedicating it to luck", "insane / host subject" → "in sync / whole subject"). Two passages remain uncertain in the audio and are rendered conservatively: 10:08–10:13 ("It's this thing of detecting corruption —") and 3:32–3:38 ("filling it in and making this more well-rounded"). Please listen to those two and correct the file if needed. The track is labelled "English (auto-generated, edited)" and the page says the wording may differ slightly from the audio.

## Things you may want to change

- The page names the school only as "a boarding high school in the United States"; the video says the name aloud and the captions include it.
- The four tournament photos removed from the page (`assets/author/leon-focus.jpg`, `leon-rally.jpg`, `leon-backswing.jpg`, `leon-next-shot.jpg`) are still in the repository. Delete them if you do not plan to use them.
- The original 1080p `author-intro.mp4` (104 MB) was replaced by a 720p encode (55 MB) in the working tree; the original stays in git history on the previous commit.
- The page is English-only as of 11 October 2026 (Leon's request, with US college admissions readers in mind). The Chinese copy and the language switch were removed; the bilingual version is in git history (commit 2175d4f). The only Chinese left on the page is the prototype's own on-screen labels, each placed after its English meaning.

## Testing performed (container Chromium via Playwright, 1440×900 and 390×844)

58 automated checks passed: language switch (lang attribute, title, meta description, nav, aria-labels, alt text, URL parameter, no missing strings), `?lang=` on load, all nav anchors resolve and land below the sticky header, docs/overview and captions load, installation step buttons and replay, video exclusivity (starting one pauses the other), pause when scrolled out of view and when the tab is hidden with no auto-resume, overlay/playback state sync, version switch with captions attached only to the full version, chapter buttons, missing-source error message, keyboard focus and Enter on the play button, all images load, no horizontal overflow, mobile menu open/close/Escape, 16:9 players on mobile.

Not testable here: actual H.264/AAC playback (the test browser has no proprietary codecs; a WebM test clip was used to exercise the player logic). Please play both videos once in Safari and Chrome after pushing.
