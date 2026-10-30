/* Shared measured speech clock. Native scene and object editing stays intact. */
function createMasterCaption(parent,d,sceneIndex){
 const scene=MASTER_TIMING.scenes[sceneIndex],root=el('div','master-caption',parent);
 const groups=MASTER_TIMING.groups.filter(g=>g.end>scene.start&&g.start<scene.end).map(g=>{
  const box=el('div','master-caption-group',root);box.dataset.componentStart=Math.max(scene.start,g.start);box.dataset.componentEnd=Math.min(scene.end,g.end);
  const spans=g.words.map(w=>{const span=el('span','master-word',box);span.textContent=w.text+' ';span.dataset.componentStart=box.dataset.componentStart;span.dataset.componentEnd=box.dataset.componentEnd;return span});return{g,box,spans};
 });
 return time=>{
  let active=false;
  for(const {g,box,spans} of groups){const on=time>=g.start&&time<g.end;box.style.display=on?'contents':'none';if(!on)continue;active=true;
   const treatment=(g.treatment+d.concept)%6;root.dataset.treatment=treatment;
   const length=g.words.reduce((n,w)=>n+w.text.length+1,0),base=[5.6,6.8,7.6,5,4.5,6.2][treatment];
   root.style.fontSize=Math.max(4.4,base*(length>32?.72:length>20?.82:1))+'cqmin';
   root.style.color=treatment===3?'var(--th-bg)':'var(--th-ink)';root.style.background=treatment===3?d.ink:'';
   spans.forEach((span,i)=>{const w=g.words[i],entered=time>=w.start,current=entered&&time<w.end,q=clamp((time-w.start)/.14);
    span.style.opacity=entered?1:.5;span.style.color=current?(treatment===3?'var(--th-bg)':'var(--th-accent)'):'inherit';
    span.style.textDecoration=current?'underline':'none';span.style.textUnderlineOffset='.12em';span.style.fontWeight=current?'900':'500';
    span.style.transform=`translateY(${entered?(1-eo(q))*.12:0}em) scale(${current?1.05:1}) rotate(${treatment===2&&current?-2:0}deg)`;
   });
  }
  root.style.opacity=active?1:0;
 };
}
function productionCamera(board,n,p,scene){const q=eo(clamp(p/.7)),w=Math.sin(p*.7+scene);let transform='';
 switch(n){
 case 1:transform=`translateY(${(1-q)*7}%) scale(${.96+.04*q+p*.002})`;break;
 case 2:transform=`translateX(${(1-q)*(scene%2?25:-25)}%) rotate(${w*2}deg)`;break;
 case 3:transform=`scale(${.95+.05*q}) translateY(${Math.sin(p*1.3)*.4}%)`;break;
 case 4:transform=`translateX(${(1-q)*18}%)`;break;
 case 5:transform=`scale(${1+w*.025}) rotate(${w*1.5}deg)`;break;
 case 6:transform=`perspective(900px) rotateY(${w*12}deg) rotateX(${Math.cos(p*.5)*5}deg)`;break;
 case 7:transform=`scale(${1+Math.sin(p*1.8)*.015})`;break;
 case 8:transform=`translateY(${(1-q)*5}%) scale(${1+p*.002})`;break;
 case 9:transform=`translateX(${Math.sin(p*.6)}%)`;break;
 case 10:transform=`skewX(${w*2}deg) scale(${1+Math.sin(p*.8)*.02})`;break;
 case 11:transform=`rotate(${scene%2?1:-1}deg) translateY(${(1-q)*12}%)`;break;
 case 12:transform=`translateY(${Math.sin(p*2)*1.5}%) rotate(${w*2}deg)`;break;
 case 13:transform=`perspective(1000px) rotateY(${w*5}deg) scale(${.96+p*.007})`;break;
 case 14:transform=`rotate(${Math.sin(p*.4)*2}deg)`;break;
 case 15:transform=`translate(${Math.sin(p*.5)*1.5}%,${Math.cos(p*.7)}%)`;break;
 case 16:transform=`scale(${.98+.02*q})`;break;
 case 17:transform=`translateX(${Math.round(Math.sin(p*2))*.4}%)`;break;
 case 18:transform=`rotate(${Math.sin(p*.5)*3}deg)`;break;
 case 19:transform=`perspective(1200px) rotateY(${Math.sin(p*.5)*-10}deg) rotateX(4deg)`;break;
 case 20:transform=`perspective(1000px) rotateY(${Math.sin(p*.6)*5}deg) translateY(${Math.sin(p)}%)`;break;
 }board.style.transform=transform;
}
function registerProductionTimeline(d){
 if(typeof gsap==='undefined')return;
 window.__timelines=window.__timelines||{};Object.values(window.__timelines).forEach(tl=>tl.kill());window.__timelines={};
 const tl=gsap.timeline({paused:true});
 const roots=card.querySelectorAll('.thynk-scene');roots.forEach((root,i)=>{const start=MASTER_TIMING.scenes[i].start;
  tl.from(root.querySelector('.th-art'),{scale:.92,opacity:0,duration:.65,ease:'sine.out'},start+.12);
  tl.from(root.querySelector('.th-product-viewport'),{x:i%2?24:-24,opacity:0,duration:.55,ease:'power3.out'},start+.2);
  tl.from(root.querySelector('.th-eyebrow'),{y:12,opacity:0,duration:.4,ease:'expo.out'},start+.1);
 });window.__timelines[d.id]=tl;window.__productionTimeline=tl;
}
function ensureMasterNarration(){
 if(MEDIA.vo.file||MEDIA.vo.originalMaster&&MEDIA.vo.el)return;
 const m=MEDIA.vo;if(m.el)m.el.pause();if(m.url)URL.revokeObjectURL(m.url);
 m.url=null;m.el=new Audio(MASTER_TIMING.audio);m.el.preload='auto';m.el.volume=m.vol;m.el.loop=false;m.offset=0;m.name='Original Thynk narration';m.originalMaster=true;TTS.on=false;
 m.el.addEventListener('error',()=>toast('Original narration could not load. Keep assets/audio beside index.html, or use the portable HTML.'));
}
/* Template 16 plots the measured source-audio envelope, not invented metrics. */
function createNarrationGraph(canvas,start,end){
 canvas.width=600;canvas.height=600;const ctx=canvas.getContext('2d'),values=MASTER_TIMING.energy;
 const energy=time=>{const i=clamp(time/MASTER_TIMING.energyInterval,0,values.length-1),a=Math.floor(i);return values[a]+((values[a+1]??values[a])-values[a])*(i-a)};
 return local=>{const time=start+local,lo=Math.max(0,time-4),span=8;ctx.clearRect(0,0,600,600);ctx.fillStyle='#091e28';ctx.fillRect(0,0,600,600);
  ctx.strokeStyle='#50e2b433';ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(55,100+i*75);ctx.lineTo(565,100+i*75);ctx.stroke()}
  ctx.fillStyle='#f2fff9';ctx.font='500 27px StudioMono,monospace';ctx.fillText('SOURCE ENERGY',55,55);ctx.fillStyle='#50e2b4';ctx.font='500 21px StudioMono,monospace';ctx.fillText(time.toFixed(2)+' s',55,560);
  ctx.beginPath();for(let i=0;i<=255;i++){const x=55+i*2,y=470-energy(lo+i/255*span)*330;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle='#50e2b4';ctx.lineWidth=4;ctx.stroke();
  const x=55+(time-lo)/span*510,y=470-energy(time)*330;ctx.beginPath();ctx.moveTo(x,100);ctx.lineTo(x,490);ctx.strokeStyle='#f2fff977';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fillStyle='#f2fff9';ctx.fill();
 };
}
