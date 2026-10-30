# Motion Studio V5 — Thynk motion generator

V5 adds a green **+** button at the top of the sidebar for assets and sound effects, plus **✦ Generate** in the toolbar. After saving images, videos and SFX, each Generate click creates a different seeded, frame-accurate composition using the **same assigned assets, scene narration, captions and timing**. Cuts can be reproduced from their saved generation number. Generic photos and videos are never scattered across unrelated scenes. ClipFlow's crop animation, timeline, playhead and captions are original HTML/CSS/SVG-style graphics informed by the two supplied reference frames. Device screens have no bezels or black frame; screen and panel corners use 35px radii. Native selects in the editor use the same styled popup treatment as the canvas menu.

The existing 20 directed templates remain available. This is a browser-native animation engine; it adapts motion-design principles from Hairline, Anatomy, Flick, Hypit, HyperFrames and Remotion, but does **not** install external AI agents or require their credentials. Uploaded assets persist in the browser's IndexedDB. A new Generate click selects a new deterministic direction; it does not invoke a paid AI text-to-video service.

**Windows installation from GitHub (CMD):**

```cmd
cd /d "E:\motion Studio"
git clone https://github.com/Furqan-shah-furqan/motion-studio.git Motion-Studio-V5
cd Motion-Studio-V5
npm ci
npm start
```

Open `http://localhost:8080`. Later, stop the app and run `git pull origin main` followed by `npm start` to sync updates. The old `Motion-studio-V3` folder can remain untouched.

**Note:** `motion-studio.html` and the MP4 files in `exports/` were created before V5; run `npm run build:portable` and `npm run render` locally if you want updated standalone HTML and all MP4 files. V5 rendering has not been confirmed in a real browser on this build.

Run `npm start` and open http://localhost:8080 for the V5 source project. No paid API or generation service is required.

The template picker contains exactly 20 built-in Thynk films. Each uses the same 54.186-second script and original narration, while the shared purple / white / pink palette frames 20 different caption entrances, 20 scene-transition styles, and 20 distinct motion-graphic treatments. Layouts, entry motion, wipes, framing, textures and pacing vary by template. Synchronized SFX and the editable source project are retained. `DESIGN.md` documents every scene and direction.

## Edit and apply assets

Select a template, choose Edit objects, then click a component or use Components. Position, dimensions, radius, text, fill, image and animation controls remain available. Right-click overlapping content to select a specific layer. Changes save in this browser.

Choose **Reference Library** in the left rail to search the bundled script-organized images, videos, GIFs and generated poster previews. Use **Use in selected film** to assign a visual reference to the selected template; posters are applied for video/GIF references, while the original files remain in the library. For actual uploaded video layers and reusable assets, choose **Add all assets** in the left rail. Upload a folder, choose files, or drop a folder. Recognized filenames select appropriate product/image/SFX slots; review the `Use as` controls before saving. **Save to selected video** applies assets immediately. Enter a name and choose **Save as new template** for a persistent copy. Original templates remain available. Assets and custom copies persist in IndexedDB; browser storage clearing removes these local copies. Use Project → Export project for a JSON containing the editable scene state and embedded images.

## Formats and playback

Phone, Instagram Post, Desktop, Tablet and Original formats preserve proportions through uniform composition fitting. Portrait, square and wide layouts keep captions inside safe margins. The single navbar keeps timestamp, scene, edit, playback switch and project controls together. Playback controls appear inside the preview when enabled. There is no document scrollbar.

Press Play or Space for narration and sound. Caption effects use the supplied soft UI pop only. Graphics use the supplied whoosh, punch and ding on authored events. Full SFX timing and measured levels are in `timing/directed-sfx.json`. The master narration remains unchanged at `assets/audio/master-source-audio.m4a`; the rendered films use `assets/audio/directed-mix.m4a`.

## Export

`previews/video-01.jpg` through `video-20.jpg` are refreshed from the V3 template compositions; `previews/V3-template-overview.jpg` is a quick contact sheet of all twenty. `exports/video-01.mp4` through `video-20.mp4` are included as the V2 render baseline. Source-level V3 direction and the built-in templates are updated in the editor; regenerate these MP4s after opening the project in a regular local Chromium environment to bake the new motion into the rendered files. The current sandbox prevents Chromium from navigating to local project files, so the MP4 baselines could not be safely regenerated here. The editor's Record video control retains its existing browser capture behavior. For repeatable production rendering install Node.js, FFmpeg and local browser tooling:

```sh
npm install
npx playwright install chromium
npm run render
```

Render one or several built-ins with `npm run render -- 1 2 3`. A saved Phone-format project can be supplied via `--project path/to/project.json` with one template number. `--audio path/to/mix.m4a` overrides the default rendered audio. Custom uploaded audio/SFX need their own rendered mix supplied through this option; the JSON renderer does not read browser IndexedDB. Browser Record uses the currently loaded sounds.

```sh
npm run build:portable
npm run check
npm run check:browser
python3 scripts/verify-exports.py
```

Browser tests exercise all 20 templates, all 22 scenes, caption bounds, five formats, component edits, narration, SFX, upload/save, custom template creation and reload persistence. Verification fully decodes exports and compares their audio to the authored mix. `QA-REPORT.md` records actual validation and limitations.

## Source map

- `src/directed.js`: twenty direction presets for captions, scene transitions and procedural motion graphics, plus scene direction, semantic assets and composition fitting.
- `src/reference-library.js` and `src/reference-library-data.js`: reference browsing, search, category/media filters, poster previews and visual-slot assignment.
- `assets/reference-library/`: script-organized reference media and generated posters.
- `src/templates.js`: twenty-film picker, switching, custom copies and sound loading.
- `src/assets.js`: folder upload, role assignment and persistent files.
- `src/editor.js`: existing component editing and selection.
- `src/workspace.js`: navigation and preview controls.
- `styles/directed.css`: film styling; `styles/workspace.css`: editor layout.
- `src/directed-assets.js`: supplied artwork paths; `assets/directed/manifest.json`: provenance.
- `src/directed-audio-data.js`: normalized embedded SFX and authored cues.
- `third-party/hairline/`: actual upstream source, license and deterministic adapter.
- `timing/master-transcript.json`: original measured word clock.
- `timing/captions.remotion.json`: word timing in Remotion Caption format.

The working editor stays native HTML/CSS/JS. HyperFrames paused-GSAP conventions and Remotion frame/caption guidance inform deterministic animation; this is not a migration of the editor to either framework. Timings retain the prior measured estimates rather than claiming new forced alignment. Artwork is shared deliberately between the twenty directions. This project contains no extracted Thynk video picture track.
"# motion-studio" 
