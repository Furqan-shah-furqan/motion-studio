// Run with PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/hairline-motion.cjs
// Optional CHROMIUM_EXECUTABLE points at an already installed Chromium.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
let playwright;
if (process.env.PLAYWRIGHT_MODULE) playwright = require(process.env.PLAYWRIGHT_MODULE);
else if (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) playwright = createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'package.json'))('playwright');
else playwright = require('playwright');
(async () => {
  const browser = await playwright.chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setContent('<div id="h" style="width:600px;height:480px"></div>');
    await page.addScriptTag({ path: path.resolve(__dirname, '../assets/lib/hairline-motion.js') });
    const results = await page.evaluate(() => {
      const out = [];
      for (const name of HairlineMotion.figures) {
        const host = document.querySelector('#h');
        const figure = HairlineMotion.create(host, name, { highlight: '#bfa3ff', stroke: 1.3 });
        const snapshot = () => [...host.querySelectorAll('svg,svg *')].map(el => [el.tagName, [...el.attributes].filter(a => a.name !== 'id').map(a => [a.name, a.value.replace(/hl-fd\d+/g, 'hl-fdSTABLE')]).sort((a,b)=>a[0].localeCompare(b[0]))]);
        const signature = () => JSON.stringify(snapshot());
        const start = performance.now();
        figure.seek(.5);
        const early = signature();
        figure.seek(1.5);
        const a = signature();
        figure.seek(3);
        const moving = signature() !== a || early !== a;
        figure.seek(.5);
        figure.seek(1.5);
        const b = signature();
        out.push({ name, paths: host.querySelectorAll('path').length, svgElements: host.querySelectorAll('svg *').length, deterministic: a === b, moving, invalid: /NaN|Infinity/.test(b), ms: Math.round(performance.now() - start) });
        figure.destroy();
        if (host.querySelector('svg')) throw Error(name + ' failed cleanup');
      }
      return out;
    });
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.equal(results.length, 33);
    for (const r of results) {
      assert(r.paths > 0, r.name + ' missing drawing');
      assert(r.deterministic, r.name + ' seek drift');
      assert(r.moving, r.name + ' no changing SVG attributes at .5 / 1.5 / 3 seconds');
      assert(!r.invalid, r.name + ' invalid geometry');
    }
    const report = { passed: true, method: 'Headless Chromium: all SVG geometry, transform, class, opacity and style attributes; independent backward seek replay; no page errors; destroy cleanup. Gradient ID counters normalized. This is a geometry/motion check, not a manual aesthetic review.', times: [.5,1.5,3], figures: results };
    fs.mkdirSync(path.resolve(__dirname, '../qa'), {recursive:true});
    fs.writeFileSync(path.resolve(__dirname, '../qa/hairline-verification.json'), JSON.stringify(report, null, 2)+'\n');
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
