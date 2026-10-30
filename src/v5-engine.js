/* V5: a deterministic director for repeatable previews and fresh generated cuts. */
let V5_VARIATION = 0;

function v5Mix(value) {
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

function v5SceneDirection(base, sceneIndex) {
  if (!V5_VARIATION) return base;
  const seed = v5Mix(Math.imul(V5_VARIATION, 0x9e3779b1) ^ Math.imul(base.index + 1, 0x45d9f3b) ^ Math.imul(sceneIndex + 1, 0x27d4eb2d));
  const captionIndex = seed % DIRECTED_TREATMENTS.length;
  const motionIndex = (seed >>> 9) % DIRECTED_TREATMENTS.length;
  const transitionIndex = (seed >>> 17) % DIRECTED_TREATMENTS.length;
  const layoutIndex = (seed >>> 23) % DIRECTED_DIRECTIONS.length;
  return {
    ...base,
    ...DIRECTED_TREATMENTS[motionIndex],
    captionMode: captionIndex,
    captionLabel: DIRECTED_TREATMENTS[captionIndex].captionLabel,
    transitionMode: transitionIndex,
    transitionLabel: DIRECTED_TREATMENTS[transitionIndex].transitionLabel,
    layout: DIRECTED_DIRECTIONS[layoutIndex][2],
    motionLabel: DIRECTED_TREATMENTS[motionIndex].motionLabel,
    index: base.index
  };
}

async function generateV5() {
  if (templateSwitchBusy) return;
  const button = document.getElementById('generate-btn');
  button.disabled = true;
  try {
    if (assetDraft.length) {
      await saveAssetDraft(false);
      if (assetDraft.length) throw new Error('Please save or review the queued assets first.');
    }
    pause();
    V5_VARIATION = (V5_VARIATION + 1) >>> 0;
    t = 0;
    configureTemplate(ACTIVE_TEMPLATE);
    build();
    refreshSceneControls();
    seek(0);
    touch();
    toast('New motion direction #' + V5_VARIATION + ' · same saved assets and narration');
  } catch (error) {
    toast('Generation stopped: ' + error.message);
  } finally {
    button.disabled = false;
  }
}
