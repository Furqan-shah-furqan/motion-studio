/* Procedural graphics. The user's references guide composition; they are not pasted into the film. */
function v5Clipflow(board, scene, add, text, updates) {
  if (scene.kind === 'captions') {
    const gallery = add(el('div', 'v5-short-gallery', board), scene.start + .02);
    const colors = ['#aaff35', '#242429', '#ff5a99', '#b788fc'];
    ['VIRAL', 'FIND THE', 'BEST', 'MOMENTS'].forEach((phrase, i) => {
      const short = el('div', 'v5-short-preview', gallery);
      short.style.background = colors[i];
      short.style.setProperty('--short-delay', i);
      const subject = el('div', 'v5-short-subject', short);
      el('div', 'v5-short-face', subject);
      el('div', 'v5-short-shirt', subject);
      text(short, phrase, 'v5-short-caption');
      text(short, String(i + 1).padStart(2, '0') + ' / 04', 'v5-short-index');
      updates.push((local, time) => {
        const progress = clamp((time - scene.start - i * .1) / .58);
        short.style.transform = `translateY(${(1 - eo(progress)) * 95 + Math.sin(local * 1.2 + i) * 5}px) rotate(${(1 - eo(progress)) * (i % 2 ? 8 : -8)}deg)`;
        short.style.opacity = progress;
      });
    });
    return gallery;
  }
  const editor = add(directedCard(board, 'v5-video-editor'), scene.start + .08);
  const canvas = el('div', 'v5-editor-canvas', editor);
  const picture = el('div', 'v5-vector-picture', canvas);
  el('div', 'v5-vector-orbit', picture);
  el('div', 'v5-vector-face', picture);
  el('div', 'v5-vector-jacket', picture);
  const grid = el('div', 'v5-crop-grid', canvas);
  const crop = el('div', 'v5-crop-box', canvas);
  for (let i = 0; i < 8; i++) el('i', 'v5-crop-handle v5-handle-' + i, crop);
  const sidebar = el('div', 'v5-editor-tools', editor);
  ['↗', '✂', '▣', '✦'].forEach(glyph => text(sidebar, glyph, 'v5-tool'));
  const badge = el('div', 'v5-effect-label', editor);
  text(badge, '✦', '');
  text(badge, scene.kind === 'captions' ? 'Animated captions' : 'AI Video Effects', '');
  const player = el('div', 'v5-editor-player', editor);
  text(player, '00:34.587', 'v5-time');
  text(player, '◀    ▶    ↻', 'v5-player-icons');
  const track = el('div', 'v5-video-track', editor);
  text(track, '▣  Video Footage', 'v5-track-title');
  const clips = el('div', 'v5-track-clips', track);
  for (let i = 0; i < 6; i++) {
    const clip = el('div', 'v5-track-clip', clips);
    clip.style.setProperty('--tile-index', i);
    text(clip, String(i + 1).padStart(2, '0'), 'v5-tile-index');
  }
  const playhead = el('div', 'v5-playhead', track);
  const audio = el('div', 'v5-audio-track', editor);
  for (let i = 0; i < 40; i++) {
    const bar = el('i', '', audio);
    bar.style.height = (19 + Math.round(Math.abs(Math.sin(i * 2.41)) * 75)) + '%';
  }
  updates.push((local, time) => {
    const progress = clamp((time - scene.start) / (scene.end - scene.start));
    const scan = (2 + progress * 94) + '%';
    playhead.style.left = scan;
    grid.style.opacity = .16 + .2 * Math.sin(local * 3) ** 2;
    crop.style.transform = `scale(${.95 + .035 * Math.sin(local * 1.2)})`;
    picture.style.transform = `translateY(${Math.sin(local * .9) * -4}px)`;
    clips.querySelectorAll('.v5-track-clip').forEach((clip, i) => clip.classList.toggle('v5-selected', Math.floor(progress * 6) === i));
  });
  return editor;
}

/* One contextual signal path, never a random stock-image collage. */
function v5SemanticMotif(board, scene, add, updates) {
  const paths = {
    smarter: ['INPUT', 'AI', 'SHIP'],
    social: ['CLIP', 'INSTAGRAM', 'YOUTUBE'],
    screens: ['PHONE', 'TABLET', 'DESKTOP'],
    code: ['HTML', 'CSS', 'JS'],
    tracking: ['SCAN', 'DIARY', 'PROGRESS'],
    ar: ['CAMERA', 'ANCHOR', '3D DISH'],
    stack: ['FLUTTER', 'NEXT', 'NODE'],
    guide: ['LAYOUT', 'MOTION', 'CAPTIONS']
  };
  const labels = paths[scene.kind];
  if (!labels) return;
  const motif = add(el('div', 'v5-signal', board), scene.start + .12);
  motif.setAttribute('aria-hidden', 'true');
  for (const label of labels) {
    const dot = el('span', 'v5-signal-dot', motif);
    dot.textContent = label;
  }
  updates.push((local, time) => {
    motif.style.setProperty('--signal', Math.round(clamp((time - scene.start) / .85) * 100) + '%');
    motif.style.setProperty('--signal-bob', (Math.sin(local * .95) * 3).toFixed(2) + 'px');
  });
}
