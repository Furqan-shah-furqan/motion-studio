const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
function arrayDeclaration(source, name) {
  const begin = source.indexOf(`const ${name}=`);
  assert.notEqual(begin, -1, `missing ${name}`);
  const open = source.indexOf('[', begin);
  const end = source.indexOf('\n];', open);
  assert.notEqual(end, -1, `unterminated ${name}`);
  return vm.runInNewContext('(' + source.slice(open, end + 2) + ')');
}

const directed = read('src/directed.js');
const directions = arrayDeclaration(directed, 'DIRECTED_DIRECTIONS');
const treatments = arrayDeclaration(directed, 'DIRECTED_TREATMENTS');
assert.equal(directions.length, 20, 'exactly twenty composition directions');
assert.equal(treatments.length, 20, 'exactly twenty motion treatments');
for (const [field, label] of [['captionMode','caption'],['transitionMode','transition'],['motionMode','motion']]) {
  const values = treatments.map(item => item[field]);
  assert.deepEqual([...values].sort((a,b)=>a-b), Array.from({length:20},(_,i)=>i), `${label} modes should cover unique values 0–19`);
}
for (const field of ['captionLabel','transitionLabel','motionLabel']) {
  assert.equal(new Set(treatments.map(item => item[field])).size, 20, `${field} should be unique per template`);
  assert(treatments.every(item => typeof item[field] === 'string' && item[field].length > 5));
}
assert.equal(new Set(directions.map(item => item[0])).size, 20, 'template direction names should be unique');
assert(directed.includes("theme:'violet-pink'"));
assert(directed.includes("pink:'#f3a4e8'"));

const dataSource = read('src/reference-library-data.js');
const start = dataSource.indexOf('=') + 1;
const lib = JSON.parse(dataSource.slice(start).trim().replace(/;\s*$/, ''));
assert.equal(lib.length, 79, 'reference library should contain all indexed source assets');
assert.equal(new Set(lib.map(x => x.id)).size, lib.length, 'reference item IDs should be unique');
assert.deepEqual([...new Set(lib.map(x => x.category))].sort(), [
  '01_Intro','02_ClipFlow','03_Wireframer','04_FoodSnap','05_AR_Menu','06_Tech_Stack','07_Call_To_Action','08_Transitions_And_BRoll'
]);
for (const item of lib) {
  assert(fs.existsSync(path.join(root, item.path)), `missing source media: ${item.path}`);
  assert(fs.existsSync(path.join(root, item.thumbnail)), `missing poster/thumbnail: ${item.thumbnail}`);
}
assert.equal(lib.filter(x => x.kind === 'image').length, 61);
assert.equal(lib.filter(x => x.kind === 'video').length, 16);
assert.equal(lib.filter(x => x.kind === 'animation').length, 2);


const assetSource = read('src/directed-assets.js');
const assetMatch = assetSource.match(/const DIRECTED_ASSETS=(\{.*\});/);
assert(assetMatch, 'directed asset map should parse');
const directAssets = JSON.parse(assetMatch[1]);
for (const [key, assetPath] of Object.entries(directAssets)) {
  assert(fs.existsSync(path.join(root, assetPath)), `missing directed asset mapping ${key}: ${assetPath}`);
}
const previews = Array.from({length:20},(_,i)=>path.join(root,'previews',`video-${String(i+1).padStart(2,'0')}.jpg`));
assert(previews.every(file=>fs.existsSync(file)&&fs.statSync(file).size>1000),'all twenty refreshed V3 thumbnails must exist');
assert.equal(new Set(previews.map(file=>fs.readFileSync(file).toString('base64'))).size,20,'preview thumbnails should be distinct');

const css = read('styles/directed.css');
for (let i=0;i<20;i++) {
  assert(css.includes(`.dm-canvas[data-motion-mode="${i}"]::before`), `missing motion texture ${i}`);
  assert(css.includes(`.dm-canvas[data-caption-mode="${i}"] .dm-caption`), `missing caption treatment ${i}`);
  assert(css.includes(`.dm-canvas[data-motion-mode="${i}"] .dm-icon`), `missing icon treatment ${i}`);
}
const html = read('index.html');
assert(html.indexOf('src/reference-library-data.js') < html.indexOf('src/reference-library.js'));
assert(html.includes('styles/reference-library.css'));
assert(read('src/workspace.js').includes("['references','Reference Library']"));
assert(read('src/core.js').includes("mkReferenceLibrary(addTab('Reference Library'))"));
assert(read('scripts/build-portable.py').includes('assets/reference-library'));
assert(read('package.json').includes('motion-studio-v3'));
console.log('PASS: 20 unique V3 directions; unique caption/transition/motion modes; violet/white/pink palette; 79 references and all source/poster paths; library UI and portable integration.');
