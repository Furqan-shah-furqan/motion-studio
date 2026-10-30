// Build with Node 24: node third-party/hairline/build-motion.cjs
// No third-party build dependency; original sources are retained unchanged.
const fs=require('node:fs'),path=require('node:path');
const {stripTypeScriptTypes}=require('node:module');
const root=path.join(__dirname,'packages/hairline/src');
const out=process.argv[2]||path.resolve(__dirname,'../../assets/lib/hairline-motion.js');
const clock='__hairClock';
let mods=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.ts'))compile(p);}}
function compile(file){
 const id=path.relative(root,file).replaceAll(path.sep,'/').replace(/\.ts$/,'');
 let source=fs.readFileSync(file,'utf8');
 if(id==='core/stage'){
  const a=source.indexOf('/* ---------- one loop, asleep offscreen ---------- */');
  const b=source.indexOf('/* ---------- pointer ---------- */');
  source=source.slice(0,a)+`
export type Tick=(dt:number,now:number)=>boolean|void;
export type Loop={wake():void;unregister():void};
const manualBoards=new Map<Element,Set<Tick>>();
export function register(stage:Element,tick:Tick):Loop{
 let set=manualBoards.get(stage);
 if(!set){set=new Set();manualBoards.set(stage,set);}
 set.add(tick);tick(0,__hairClock.now);
 return {wake(){},unregister(){set!.delete(tick);if(!set!.size)manualBoards.delete(stage);}};
}
export function advance(stage:Element,dt:number,now:number){
 const b=manualBoards.get(stage);if(b)for(const tick of Array.from(b))tick(dt,now);
}
export function drive(stage:Element,p:Vec2|null){
 const h=handlers.get(stage);if(!h)return;
 if(p)h.move(p,{pointerType:'ghost'} as PointerEvent);else h.leave({pointerType:'ghost'} as PointerEvent);
}
`+source.slice(b);
 }
 source=source.replaceAll('performance.now()',clock+'.now');
 let js=stripTypeScriptTypes(source,{mode:'strip'});
 js=js.replace(/import\s*\{([\s\S]*?)\}\s*from\s*["'](.+?)["'];?/g,(_,names,rel)=>{
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(id),rel));
  const fields=names.split(',').map(s=>s.trim()).filter(Boolean).map(s=>s.replace(/\s+as\s+/,': '));
  return 'const {'+fields.join(',')+'}=__require('+JSON.stringify(resolved)+');';
 });
 const exports=[];
 // The upstream geometry uses `export const N=8,W=84,...`. Preserve every
 // top-level declarator, without mistaking commas in arrow arguments/arrays
 // for exported bindings. The pinned upstream has no multiline declarators.
 for(const match of js.matchAll(/^export\s+(?:const|let)\s+([^\n]+)/gm)){
  const line=match[1];let depth=0,quote='',escaped=false;
  for(let i=0;i<line.length;i++){
   const c=line[i];
   if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue;}
   if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
   if('([{'.includes(c)){depth++;continue;}
   if(')]}'.includes(c)){depth--;continue;}
   if(c===','&&depth===0){const binding=line.slice(i+1).match(/^\s*([A-Za-z_$][\w$]*)\s*=/);if(binding)exports.push(binding[1]);}
  }
 }
 js=js.replace(/export\s+(function|const|let|class)\s+([A-Za-z_$][\w$]*)/g,(_,kind,n)=>{exports.push(n);return kind+' '+n;});
 if(/\b(?:import|export)\s+\{/.test(js))throw Error('unsupported module form '+id);
 mods.push(JSON.stringify(id)+':function(__require,module){\n'+js+'\nmodule.exports={'+exports.join(',')+'};\n}');
}
walk(root);
const adapter=fs.readFileSync(path.join(__dirname,'motion-adapter.js'),'utf8');
const license=fs.readFileSync(path.join(__dirname,'LICENSE'),'utf8');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,'/*! Hairline by Lucas Markes — MIT. Upstream 37d2e78dcb333ab30c3338e28ed4a690364ea014\n'+license+'\n*/\n(function(){\n"use strict";const __hairClock={now:0};\nconst __modules={'+mods.join(',\n')+'};\nconst __cache={};function __require(id){if(__cache[id])return __cache[id].exports;const module=__cache[id]={exports:{}};if(!__modules[id])throw Error("Hairline module missing: "+id);__modules[id](__require,module);return module.exports;}\n'+adapter+'\n})();\n');
console.log(out,fs.statSync(out).size+' bytes');

