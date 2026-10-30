# Verification — Thynk director’s cut

**Validation scope:** The original sections below record V2 baseline test evidence carried forward from the source archive. They do not represent a full Chromium test of the new V3 visual treatments. See “V3 changes and validation” below for the additional checks performed after the V3 modifications.

## Editor and templates

- Twenty built-in templates, each with twenty-two script-specific scenes, duration 54.186s. Legacy templates are absent from the picker.
- Real Chromium checked all 440 template/scene combinations for visible content and valid asset paths.
- Checked all 145 spoken word midpoints across five formats (725 samples) for caption safe margins. Phone, tablet, desktop, square and original use uniform x/y scale.
- Exact authored prompt-field dimensions verified: 400×150, 35px radius. All three preview UI surfaces have 0px borders and 35px radius.
- Viewports 1440×1000, 1361×634, 1024×768 and 390×844 fit the first fold. Navbar height and sidebar width are 48px, preview/sidebar heights match, no document overflow, old upper header is hidden.
- Component radius/position edits and state restoration passed; SVG animation remains present after editing.
- Actual asset input → Save → visible film replacement passed. Save as new template creates a twenty-first explicit user copy, with all assets and selection restored after reload and template switching.
- Uploaded SFX test: 120ms leading silence removed, 2ms preroll retained, normalized peak 0.9; original narration unchanged. Recursive directory traversal tested across two 100-entry directory batches.
- Portable HTML tested with all external requests blocked: embedded artwork, fonts, narration and four sounds load; playback advances without page errors.
- Existing editor regression contracts and JavaScript syntax checks pass.

## Animation and visual review

- Actual vendored Hairline figures pass deterministic forward/backward seek, motion, valid geometry and cleanup checks in Chromium.
- Independent critic sampled twenty-two actual encoded hero frames each for films 01 and 02, plus opening frames of 03 and 04. It found an unclear AR causal sequence; that scene was revised and rendered again.
- FoodSnap wordmark contrast corrected to white on the five violet-background title variants, with a browser assertion for all twenty directions.
- Revised AR segment sampled at four times: consistent meal in frameless camera view, reticle, camera icon, projected landing target, grid table plane, then raised dish. No sampled caption clipping, palette or bezel issue.
- See `qa/directed-critic.md`, `qa/directed-ar-review.md` and the current JSON reports. Internal review screenshots are excluded from the delivery.

## Sound

- Original narration decoded PCM SHA256 remains `542eba3d1ea08e9ea28dea4f770a300b7adf3ec863bfdad64e74560af5e47284`.
- New delivery mix: 46 caption-pop cues and 22 authored graphics cues, all from the four supplied effects. Source effects are trimmed to measured onsets and gain-controlled.
- Original stereo narration: −15.9 LUFS, −0.6 dBTP. Delivery mix: −16.6 LUFS, −1.4 dBTP. One static −0.757dB safety gain; no narration cuts or time stretching. These are measured levels, not a claim of listening on physical speakers.
- Native browser preview loads normalized buffers; user-uploaded SFX get the same onset/peak preparation. Rendered MP4s use the authored mix.

## Exports

- Twenty H.264/AAC exports at 1080×1920, 30fps, 1626 frames (54.2s picture; 54.186s audio).
- The AR correction was rendered as a deterministic scene segment and assembled with a high-quality video re-encode; soundtrack stream copied. Future full renders use the current source directly.
- Final verification fully decodes all 32520 frames, checks dimensions/frame counts and compares each audio stream’s decoded PCM hash to the authored mix. Short still holds on centered titles are intentional.
- Export/source parity checks sample the corrected AR scene in all twenty films. Minimum sampled source/export AR PSNR exceeds **38dB**, confirming the repaired scene matches current source. All twenty MP4s also seek successfully to 53.5s in Chromium. Full details are in `qa/directed-export-parity.json` and `qa/export-verification.json`.

## Limits

The twenty templates intentionally share product artwork and the same narration sequence; layouts, entrance direction, background inversions and shipping figures differ. The supplied original audio is a finished track, not an isolated dialogue stem. Word timings retain prior measured estimates, not a newly certified forced alignment. Visual review samples do not certify every frame manually. Existing browser capture permission dialogs were not automated. The editor remains native HTML/CSS/JS, with paused GSAP conventions and Remotion-compatible caption timing; it was not migrated into a React or HyperFrames CLI application. Custom audio used by the offline renderer needs an explicit audio mix; browser Record uses currently loaded sounds.


## V3 changes and validation

- Added 79 indexed reference items from the renamed Thynk asset pack: 61 images, 16 videos and 2 animated GIFs, grouped into eight script chapters. Generated poster previews are separate from the unchanged source media.
- Added reference-library search, category and media-type filters, assign-to-slot controls, and persistent relative asset assignments.
- Added 20 named direction treatments with unique caption, transition and motion modes (mode IDs 0–19) while keeping a shared violet/white/pink palette. CSS adds per-direction framing, texture, caption and icon variants.
- `npm run check` passes for the source syntax and existing editor-regression contracts. A dedicated V3 direction test checks catalog count, uniqueness, library mappings and portable-build integration.
- Chromium smoke tests loaded the generated portable editor in an in-memory page: all 20 templates and 22 scenes initialized, their visible image sources decoded, and refreshed 360×640 previews were generated for all 20 directions with no page errors. The Reference Library opened with 79 catalog items (36 initially shown); searching `wireframer` returned 23 matches with no page errors. This was a visual/UI smoke test, not a complete interaction or persistence test; the sandbox denies IndexedDB in opaque in-memory page contexts.
- The production renderer cannot navigate to the local `file://` project URL in this sandbox (`ERR_BLOCKED_BY_ADMINISTRATOR`). A five-frame diagnostic render succeeded via the portable HTML, but a full 1626-frame render exceeded the available execution window. Thus the 20 MP4 exports remain the V2 baseline and the new V3 treatments are implemented in the editor/source and refreshed preview JPGs, but are not yet baked into those MP4s. Run `npm run render` in a regular local Chromium environment to regenerate them. See `qa/v3-preview-check.json`.
