# Motion Studio V3 — update notes

- Added a script-organized reference library from the supplied Thynk asset pack: intro, ClipFlow, Wireframer, FoodSnap, AR Menu, technology stack, call to action, and transition/B-roll folders. Original image/video/GIF media is preserved; generated still posters provide fast previews of video and GIF assets.
- Added in-editor search, category/media filters, visual-slot selection, suggested slot mapping, and one-click application of a reference to the selected film. Relative reference assignments persist in saved projects.
- Added twenty distinct direction treatments with separate caption entrance mechanics, transition masks, graphic motion patterns, line/halo/grid textures, and card/icon treatments. The shared violet, white and pink palette remains consistent across all twenty templates.
- Added a pink brand accent and template-specific direction metadata to the scene details panel. The existing scene sequence, narration clock, assets, SFX, editor, custom-template flow, file uploads, persistence, responsive formats and project controls are retained.
- Added a portable build step that embeds image-based references and posters as data URLs while leaving original source media in the organized project folder.
- Updated npm metadata and project documentation for V3. Existing `exports/video-01.mp4` through `video-20.mp4` remain the V2 render baseline because the current Chromium sandbox blocks local-file navigation; the updated V3 editor source is ready for full rendering in a normal local Chromium environment.
