// Motion Studio adapter. The clock and pointer are driven by the playhead.
// No RAF, Date.now, implicit tour, media query, or CSS transition affects export.
const figures=__require('index');
const stageClock=__require('core/stage');
const motion=__require('core/motion');
const figureNames=Object.keys(figures).filter(n=>typeof figures[n]==='function');
function defaultPointer(name,seed){
 if(name==='riffle'){
  const g=__require('figures/riffle-geometry'),P=g.scene().P;
  const a=g.REST*Math.PI/180;
  return t=>{const i=3.5+3.3*Math.sin(t*1.6+seed),q=P(g.W/2,i*g.G+g.H*Math.sin(a),g.H*Math.cos(a));return[q[0]/400,q[1]/320];};
 }
 return t=>[.5+.26*Math.sin(t*1.7+seed),.5+.33*Math.cos(t*1.3+seed*.7)];
}
let styleAdded=false;
function ensureStyle(){
 if(styleAdded)return;styleAdded=true;
 const s=document.createElement('style');s.dataset.hairlineMotionStyle='';
 s.textContent='[data-hairline]>svg :is(path,polygon,ellipse,line,circle){transition:none!important} [data-hairline]>[data-hairline-live]{display:none}';
 document.head.append(s);
}
function create(host,name='exploded',options={}){
 if(!figures[name])throw new Error('Unknown Hairline figure '+name);
 ensureStyle();
 const STEP=1/60;
 const seed=Number(options.seed)||0;
 let engine=null,frame=0,dead=false;
 const pointer=typeof options.pointer==='function'?options.pointer:defaultPointer(name,seed);
 const reset=()=>{
  if(engine)engine.destroy();
  frame=0;__hairClock.now=0;motion.setReducedMotion(false);
  engine=figures[name](host,{intensity:options.intensity??.8,theme:options.theme||'dark',play:false,label:options.label||name});
  host.style.setProperty('--hairline-plate',options.plate||'#08080b');
  host.style.setProperty('--hairline-hi',options.highlight||'#ffffff');
  host.style.setProperty('--hairline-edge',options.edge||'#c3c2ce');
  host.style.setProperty('--hairline-mid',options.mid||'#777582');
  host.style.setProperty('--hairline-lo',options.low||'#37343e');
  host.style.setProperty('--hairline-stroke',String(options.stroke??1.1));
 };
 reset();
 return {
  seek(time,x,y){
   if(dead)return;
   const target=Math.max(0,Math.round((Number(time)||0)*60));
   if(target<frame)reset();
   while(frame<target){
    frame++;
    const t=frame*STEP;__hairClock.now=t*1000;
    const p=pointer(t);
    stageClock.drive(host,p?[Math.max(0,Math.min(1,p[0]))*400,Math.max(0,Math.min(1,p[1]))*320]:null);
    stageClock.advance(host,STEP,__hairClock.now);
   }
   // Optional explicit pointer is a pose override. For deterministic animated
   // pointer motion across seeks, supply options.pointer(t) instead.
   if(Number.isFinite(x)&&Number.isFinite(y)){
    __hairClock.now=target*STEP*1000;
    stageClock.drive(host,[x*400,y*320]);stageClock.advance(host,0,__hairClock.now);
   }
  },
  destroy(){if(dead)return;dead=true;engine?.destroy();engine=null;},
  get figure(){return name;}
 };
}
window.HairlineMotion=Object.freeze({create,figures:Object.freeze(figureNames),upstream:'37d2e78dcb333ab30c3338e28ed4a690364ea014'});

