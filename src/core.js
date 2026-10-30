
/* ============ helpers ============ */
const $=s=>document.querySelector(s);
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const P=(t,a,b)=>clamp((t-a)/(b-a));
const eo=p=>1-Math.pow(1-p,3);
const eio=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
const eb=p=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2)};
const rng=seed=>{let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647)/2147483647};
function el(tag,cls,parent,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e}
let T=44.33; const SEC=[0,2.5,13.5,38.5,T];

/* ============ canvas formats ============
   The format changes the composition only, never the app layout or the
   playhead. fitStage() letterboxes the whole composition into the media well. */
const FORMATS={
 original:{label:'Original · 4:3',w:1440,h:1080},
 phone:{label:'Phone · 9:16',w:1080,h:1920},
 square:{label:'Instagram Post · Square',w:1080,h:1080},
 desktop:{label:'Desktop · 16:9',w:1920,h:1080},
 tablet:{label:'Tablet · Portrait',w:1536,h:2048}};
let FMT='original';
function paintFormatUI(){const F=FORMATS[FMT]||FORMATS.original;const v=$('#fmt-value'),s=$('#fmt-size');
  if(v)v.textContent=F.label;if(s)s.textContent=F.w+' × '+F.h;
  document.querySelectorAll('#fmt-menu [role="option"]').forEach(o=>{const on=o.dataset.v===FMT;o.setAttribute('aria-selected',on?'true':'false');o.classList.toggle('on',on)});
  fitStage()}
function setFormat(f){if(!FORMATS[f]||f===FMT)return;const was=playing;if(playing)pause();FMT=f;touch();paintFormatUI();build();render();if(was)play()}
function fitStage(){const F=FORMATS[FMT]||FORMATS.original;const tgt=document.fullscreenElement||$('#well');if(!tgt)return;const r=tgt.getBoundingClientRect();if(r.width<2||r.height<2)return;
  const cs=getComputedStyle(tgt);const px=v=>parseFloat(v)||0;
  const aw=Math.max(2,r.width-px(cs.paddingLeft)-px(cs.paddingRight)-px(cs.borderLeftWidth)-px(cs.borderRightWidth));
  const ah=Math.max(2,r.height-px(cs.paddingTop)-px(cs.paddingBottom)-px(cs.borderTopWidth)-px(cs.borderBottomWidth));
  // One scale for both axes. Pixel additions after fitting distorted every format.
  const sc=Math.min(aw/F.w,ah/F.h),width=F.w*sc,height=F.h*sc;
  stage.style.width=width+'px';stage.style.height=height+'px';
  stage.dataset.fitWidth=String(width);stage.dataset.middleExtraX='0';stage.dataset.middleExtraY='0';
  applyFrameSizing();fitTemplateBoards();applyComponentEdits()}


/* ============ config (editable) ============ */
const DEF={brand:'YourBrand',studio:'Your Studio',nav:['Intro','Problem','Use Case','Call to Action'],
 c:{a:"Every day, there's something",a2:"there's",b:"exciting to figure out.",c:"You just want solution?",d:"but find the solution",e:"Simple",f1:"Whatever you",f2:"are doing",g:"can guide you",h1:"New",h2:"product",i1:"Learn it",i2:"Do it",i3:"Make it Do",chat:"Hello! How do I make a pizza?",big:"Want pizza?",qr:"YOUR BUSINESS NAME OR WEBSITE · ADD YOUR CUSTOM TEXT HERE · "}};
let CFG=JSON.parse(JSON.stringify(DEF));
const ASSET={logo:null,bgland:null,product:null,photos:[]};
const MOT_DEF={style:'orig',stagger:1,blur:10,travel:1.2,size:1,ease:'cubic',float:1,orbit:1,shake:1,orbs:16};
const MOT=Object.assign({},MOT_DEF);
let MASTER=.7,PADVOL=1,AUTO_ON=true;

/* ============ spec data (single source for table, readout, prompt) ============ */
const SCENES=[
 {t0:0,t1:2.5,sec:'Intro',name:'Hero reveal',mot:'Purple-to-magenta gradient plate. Phone held in two hands, tilted about 6 degrees. 16 glossy 3D-style objects (spheres, petals, pills) burst outward from the phone, then drift with a slow sine bob.',cap:'Brand title drops in letter by letter from above, 40 ms stagger, small rotation jitter, soft glow.',tr:'Hard cut to the white card at 2.5 s while the nav pill switches to Problem.'},
 {t0:2.5,t1:5,sec:'Problem',name:'Every day, there’s something',mot:'White card with lavender fog waves sliding along the bottom edge.',cap:'Word-by-word blur-in (10 px blur to 0, rise 1.2% of width, 450 ms, stagger 350 ms). Two words tinted lilac.',tr:'Words blur out together.'},
 {t0:5,t1:7.3,sec:'Problem',name:'Glyph swarm',mot:'One word held in the centre while 16 small line-icon glyphs fly outward, orbit, and return, fading in and out over 2.2 s.',cap:'Static word, glyphs carry the motion.',tr:'Swarm collapses into the next line.'},
 {t0:7.2,t1:9.5,sec:'Problem',name:'Exciting to figure out',mot:'Same fog plate. Text is larger (4.6% of width).',cap:'New words overwrite the held word with a cross-dissolve and a small slide. Blur-in, 250 ms stagger.',tr:'Fade to the media cards.'},
 {t0:9.5,t1:11,sec:'Problem',name:'You just want solution?',mot:'7 media cards (portraits, UI shots, hands with phone) fly in from the edges with 6 to 12 degree rotation, soft shadows, spring overshoot.',cap:'Small caption, centred, blur-in.',tr:'Cards keep moving into the ring.'},
 {t0:11,t1:13.4,sec:'Problem',name:'But find the solution',mot:'10 cards form an ellipse around the caption and rotate clockwise about 8 degrees per second, with depth scaling.',cap:'Small centred caption stays fixed while the ring turns.',tr:'Ring and caption fade out.'},
 {t0:13.4,t1:14.3,sec:'Use Case',name:'Simple',mot:'Thin vertical guide lines and tick marks draw in (scaleY 0 to 1) behind the word, then fade.',cap:'Large word, letter-spacing collapses from +1.2em to 0 in 700 ms.',tr:'Word dissolves into the logo ring.'},
 {t0:14.2,t1:15.6,sec:'Use Case',name:'Logo morph',mot:'Gradient ring scales from 3x to 1x at centre, then slides left. Soft peach, lilac and sky blobs behind.',cap:'Brand name reveals to the right of the ring, letter by letter with blur.',tr:'Crossfade to the landscape plate.'},
 {t0:15.5,t1:16.9,sec:'Use Case',name:'Landscape plate',mot:'Full-bleed nature image with a glass logo lockup at the centre.',cap:'None.',tr:'Lockup fades as the monitor scales in.'},
 {t0:16.6,t1:21.2,sec:'Use Case',name:'Monitor mockup',mot:'Beige studio backdrop. Monitor scales 0.6x to 1x with ease-out-back. At 19.2 s it slides right while a person card slides in from the left.',cap:'None.',tr:'Push-in into the screen.'},
 {t0:20.9,t1:24.2,sec:'Use Case',name:'Zoom into the UI',mot:'Landscape blurs (10 px). A glass chat panel types a question, a cursor glides to the button and clicks with a ring ripple at 23.0 s.',cap:'Typewriter at 60 ms per character. Headline blurs in top-left after the click.',tr:'Cut to the phone-in-hands shot.'},
 {t0:24,t1:26.6,sec:'Use Case',name:'Phone in hands',mot:'Hands hold a landscape phone. Screen plays a how-to clip with a step panel at the right. Handheld shake of 0.4 degrees.',cap:'None.',tr:'Fade to white caption plate.'},
 {t0:26.5,t1:28,sec:'Use Case',name:'Whatever you are doing',mot:'White fog plate again.',cap:'Scatter-in: each word flies from a random offset (up to 15% of width) and settles into a staggered two-line layout.',tr:'Quick swap.'},
 {t0:28,t1:28.7,sec:'Use Case',name:'Can guide you',mot:'None.',cap:'Short blur-in, 3.6% of width.',tr:'Swap into the product line.'},
 {t0:28.6,t1:31.1,sec:'Use Case',name:'New [object] product',mot:'An inline object slot cycles headphones, laptop, alarm clock. Each swap is a 120 ms scale pop while a cursor taps the slot.',cap:'Words stay put, the line re-centres as the slot changes width.',tr:'Cut to the QR box.'},
 {t0:31,t1:33.8,sec:'Use Case',name:'QR on the box',mot:'Macro shot of a kraft box. Circular text rotates slowly around a glassy QR. A scan beam sweeps down in 1.2 s, then a push-in.',cap:'Circular text path.',tr:'Zoom through into the phone.'},
 {t0:33.4,t1:36,sec:'Use Case',name:'Scan to product page',mot:'Lavender and peach plate. Portrait phone shows the camera view of the QR, then slides to a product page (image, spec lines, button).',cap:'None.',tr:'Screen turns into the video list.'},
 {t0:36,t1:38.5,sec:'Use Case',name:'Ecosystem pop-ins',mot:'8 floating chat bubbles and icon orbs spring in around the phone (0.3 s stagger) then bob 0.6% of width. Phone screen scrolls a video list.',cap:'Bubble lines only.',tr:'White plate for the call to action.'},
 {t0:38.5,t1:40.8,sec:'Call to Action',name:'Learn it, Do it, Make it',mot:'Fog plate.',cap:'Three beats of 0.8 s. Blur-in for the first two, typewriter with blinking caret for the last.',tr:'Dissolve into the sky.'},
 {t0:40.5,t1:44.33,sec:'Call to Action',name:'Sky outro',mot:'Cloud plate with drifting blurred blobs. Ring draws on with a stroke animation, brand name reveals beside it, hold, fade to black over the last 1.1 s.',cap:'Brand name blur-reveal.',tr:'Fade to black.'}
];
const CUES=[
 {t:0.0,type:'swell',w:'Intro riser under the title'},{t:0.5,type:'chime',w:'Title letters land'},
 {t:2.5,type:'whoosh',w:'Cut to the white card'},{t:3.75,type:'pop',w:'Word 2 highlight'},{t:4.2,type:'pop',w:'Word 4 highlight'},
 {t:5.2,type:'whoosh',w:'Glyph swarm burst'},{t:6.5,type:'chime',w:'Swarm shimmer'},{t:7.2,type:'whoosh',w:'Words overwrite'},
 {t:9.6,type:'whoosh',w:'Cards fly in'},{t:10.2,type:'pop',w:'Card lands'},{t:11.0,type:'whoosh',w:'Ring forms'},{t:12.25,type:'pop',w:'Ring tick'},
 {t:13.4,type:'hit',w:'Simple hit'},{t:14.1,type:'whoosh',w:'Ring morph'},{t:14.4,type:'hit',w:'Logo lands'},
 {t:15.5,type:'swell',w:'Landscape reveal'},{t:16.15,type:'whoosh',w:'Monitor in'},{t:16.75,type:'pop',w:'Monitor settles'},{t:18.1,type:'pop',w:'UI blip'},
 {t:19.2,type:'whoosh',w:'Monitor slides, person enters'},{t:20.8,type:'whoosh',w:'Push-in'},
 {t:23.0,type:'click',w:'Cursor click'},{t:23.7,type:'pop',w:'Headline pop'},{t:24.6,type:'whoosh',w:'Phone shot in'},
 {t:26.0,type:'pop',w:'Step tick'},{t:26.7,type:'whoosh',w:'Words scatter in'},{t:27.65,type:'pop',w:'Words settle'},
 {t:28.9,type:'pop',w:'Object swap 1'},{t:29.35,type:'pop',w:'Object swap 2'},{t:30.2,type:'click',w:'Cursor tap'},
 {t:31.25,type:'whoosh',w:'QR shot in'},{t:32.3,type:'beep',w:'Scan beam'},{t:33.4,type:'whoosh',w:'Zoom into phone'},{t:34.6,type:'chime',w:'Product page'},
 {t:36.1,type:'pop',w:'Bubble pop 1'},{t:36.4,type:'pop',w:'Bubble pop 2'},{t:36.7,type:'pop',w:'Bubble pop 3'},{t:37.0,type:'pop',w:'Bubble pop 4'},{t:37.3,type:'pop',w:'Bubble pop 5'},
 {t:38.5,type:'whoosh',w:'Call to action plate'},{t:40.55,type:'hit',w:'Make it hit'},{t:41.25,type:'swell',w:'Ring draw swell'},{t:42.1,type:'chime',w:'Brand lands'}
];
const SYNTH={whoosh:'Bandpass noise sweep 400 to 2800 Hz, 0.55 s, soft attack',pop:'Sine 620 to 240 Hz pitch drop, 0.14 s',tick:'Highpassed noise burst, 30 ms',click:'1.6 kHz blip plus 25 ms noise',hit:'Sine 120 to 42 Hz thump plus low noise, 0.4 s',swell:'Lowpass noise rise 200 to 3500 Hz, 1.3 s',chime:'Sines at 988, 1480, 1976 Hz, 1.2 s decay',beep:'Two 1.5 kHz pulses, 70 ms each'};
const REAL={whoosh:'"soft whoosh transition"',pop:'"UI pop bubble"',tick:'"keyboard tick"',click:'"mouse click UI"',hit:'"cinematic logo hit short"',swell:'"riser swell short"',chime:'"glass chime shimmer"',beep:'"scanner beep"'};

/* ============ audio ============ */
let AC=null,master=null,noiseBuf=null,padNodes=null,muted=false;
function ac(){if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();master=AC.createGain();master.gain.value=muted?0:MASTER;master.connect(AC.destination);
  noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  if(AC.state==='suspended')AC.resume();return AC}
function envG(g,n,a,d,v){g.gain.cancelScheduledValues(n);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(v,n+a);g.gain.exponentialRampToValueAtTime(.0001,n+a+d)}
function nz(n,dur,ftype,f0,f1,q,v,a){const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;const f=AC.createBiquadFilter();f.type=ftype;f.Q.value=q;f.frequency.setValueAtTime(f0,n);f.frequency.exponentialRampToValueAtTime(f1,n+dur);const g=AC.createGain();envG(g,n,a,dur-a,v);s.connect(f).connect(g).connect(master);s.start(n);s.stop(n+dur+.05)}
function osc(n,type,f0,f1,dur,v,a){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,n);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,n+dur);envG(g,n,a,dur-a,v);o.connect(g).connect(master);o.start(n);o.stop(n+dur+.05)}
const S={
 whoosh(v=1){const n=AC.currentTime;nz(n,.6,'bandpass',400,2800,1.1,.22*v,.18)},
 pop(v=1){const n=AC.currentTime;osc(n,'sine',620,240,.16,.26*v,.005)},
 tick(v=1){const n=AC.currentTime;nz(n,.04,'highpass',4000,4200,.7,.07*v,.002)},
 click(v=1){const n=AC.currentTime;osc(n,'sine',1600,1500,.04,.2*v,.002);nz(n,.04,'bandpass',2500,2600,1,.15*v,.002)},
 hit(v=1){const n=AC.currentTime;osc(n,'sine',120,42,.45,.55*v,.005);nz(n,.3,'lowpass',900,120,.7,.2*v,.005)},
 swell(v=1){const n=AC.currentTime;nz(n,1.4,'lowpass',200,3500,1,.2*v,1.1)},
 chime(v=1){const n=AC.currentTime;[988,1480,1976].forEach((f,i)=>osc(n+i*.02,'sine',f,f,1.3,.11*v/(i+1),.01))},
 beep(v=1){const n=AC.currentTime;osc(n,'sine',1500,1500,.08,.12*v,.004);osc(n+.12,'sine',1500,1500,.08,.12*v,.004)}
};
function padOn(){if(!ac()||padNodes||MEDIA.music.el||PADVOL<=0)return;const g=AC.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(.05*PADVOL,AC.currentTime+1.5);const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=520;
  const os=[110,164.81,220.5].map(fr=>{const o=AC.createOscillator();o.type='sine';o.frequency.value=fr;o.connect(f);o.start();return o});f.connect(g).connect(master);padNodes={g,os}}
function padOff(){if(!padNodes)return;const {g,os}=padNodes;g.gain.cancelScheduledValues(AC.currentTime);g.gain.linearRampToValueAtTime(0,AC.currentTime+.4);setTimeout(()=>os.forEach(o=>{try{o.stop()}catch(e){}}),500);padNodes=null}

/* ============ timeline engine ============ */
const stage=$('#stage'),card=$('#card');
let layers=[],autoCues=[],allCues=[],t=0,playing=false,lastNow=0,loopOn=true;

function layer(a,b,opt,fn){opt=opt||{};const e=el('div','L '+(opt.cls||''),card);e.style.display='none';const o={a,b,e,fn,fi:opt.fi==null?.25:opt.fi,fo:opt.fo==null?.25:opt.fo,on:false};layers.push(o);return o}
function updateLayers(tt){for(const o of layers){
  if(tt<o.a||tt>=o.b){if(o.on){o.e.style.display='none';o.on=false}continue}
  if(!o.on){o.e.style.display='';o.on=true}
  const p=tt-o.a,d=o.b-o.a;let op=1;if(o.fi>0)op=Math.min(op,p/o.fi);if(o.fo>0)op=Math.min(op,(d-p)/o.fo);
  o.e.style.opacity=clamp(op);if(o.fn)o.fn(p,tt,o.e,d)}}

const ringSVG=()=>`<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="33" fill="none" stroke="url(#rg)" stroke-width="15" pathLength="1"/></svg>`;
const logoMark=(parent,cls)=>{const w=el('span','lm '+(cls||''),parent,ringSVG());const i=el('img','',w);if(ASSET.logo)i.src=ASSET.logo;i.alt='';return w};
const CUR='<svg class="cur" viewBox="0 0 24 24"><path d="M3 2l16 9-7 2-3 7z" fill="#fff" stroke="#14101f" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const PAL=[['#7c5cff','#e0b3ff'],['#ff9ec7','#ffd7b5'],['#3b2a6e','#9a7dff'],['#f2e6ff','#c7a8ff'],['#1a1030','#5a3bbf'],['#ffb88c','#ff6fa8'],['#9ad7ff','#7c5cff']];
function mkCard(parent,i){const c=el('div','mc',parent);const pal=PAL[i%PAL.length];c.style.background=`linear-gradient(145deg,${pal[0]},${pal[1]})`;
  if(ASSET.photos.length){c.style.backgroundImage=`url(${ASSET.photos[i%ASSET.photos.length]})`}else{el('i','face',c);el('i','body',c)}return c}
function qrSVG(seed){const R=rng(seed),n=21;let s='';for(let y=0;y<n;y++)for(let x=0;x<n;x++){const f=(x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12);if(!f&&R()>.5)s+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
  const fp=(x,y)=>`<rect x="${x+.5}" y="${y+.5}" width="6" height="6" fill="none" stroke="#111" stroke-width="1"/><rect x="${x+2}" y="${y+2}" width="3" height="3"/>`;
  return `<svg viewBox="0 0 21 21" fill="#111" shape-rendering="crispEdges" style="width:100%;height:100%">${s}${fp(0,0)}${fp(14,0)}${fp(0,14)}</svg>`}
const ICONS={
 head:'<svg viewBox="0 0 48 48"><path d="M8 28v-4a16 16 0 0132 0v4" fill="none" stroke="#2a1250" stroke-width="3"/><rect x="5" y="26" width="9" height="15" rx="4" fill="#6a2fe0"/><rect x="34" y="26" width="9" height="15" rx="4" fill="#6a2fe0"/></svg>',
 lap:'<svg viewBox="0 0 48 48"><rect x="9" y="11" width="30" height="21" rx="2.5" fill="#2a1250"/><rect x="12" y="14" width="24" height="15" rx="1" fill="#b79cf5"/><path d="M4 35h40l-3 4H7z" fill="#6a2fe0"/></svg>',
 clock:'<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="15" fill="#7ab4ff"/><circle cx="24" cy="26" r="11" fill="#e8f2ff"/><path d="M24 19v8l5 3" stroke="#2a1250" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="10" cy="10" r="5" fill="#2a1250"/><circle cx="38" cy="10" r="5" fill="#2a1250"/></svg>'};

function beat(a,b,text,o){o=Object.assign({size:3.2,stagger:.3,hl:[],weight:500,color:null,fo:.3,scatter:false,auto:true},o||{});
  const sty=MOT.style==='orig'?(o.scatter?'scatter':'blur'):MOT.style;const stg=o.stagger*MOT.stagger;
  const words=text.split(' ').filter(Boolean);const L=layer(a,b,{fi:0,fo:o.fo});
  const row=el('div','beat',L.e);row.style.fontSize=(o.size*MOT.size).toFixed(2)+'cqw';row.style.fontWeight=o.weight;if(o.color)row.style.color=o.color;
  const ws=words.map((w,i)=>{const s=el('span','w',row);s.textContent=w;if(o.hl.includes(i))s.classList.add('hl');return s});
  const R=rng(Math.floor(a*100)+7);const offs=words.map(()=>[(R()-.5)*30,(R()-.5)*20]);
  L.fn=p=>{ws.forEach((s,i)=>{const q=EASE(P(p,i*stg,i*stg+.45));const k=Math.max(0,1-q);let dx=0,dy=0,sc=1,bl=MOT.blur;
    if(sty==='blur'){dy=k*MOT.travel;sc=.96+.04*q}else if(sty==='rise'){dy=k*MOT.travel*2.5;bl=MOT.blur*.3}else if(sty==='drop'){dy=-k*MOT.travel*3;bl=MOT.blur*.3}
    else if(sty==='pop'){sc=.5+.5*q;bl=0}else if(sty==='fade'){bl=0}else if(sty==='scatter'){dx=offs[i][0]*k;dy=offs[i][1]*k;sc=.96+.04*q}
    s.style.opacity=clamp(q);s.style.filter=bl>0?`blur(${(k*bl).toFixed(2)}px)`:'none';s.style.transform=`translate(${dx.toFixed(2)}cqw,${dy.toFixed(2)}cqw) scale(${sc.toFixed(3)})`})};
  if(o.auto)words.forEach((w,i)=>autoCues.push({t:a+i*stg+.08,type:'tick',v:.9}));
  return L}

function build(){
  restoreObjectPresentation();card.innerHTML='';layers=[];autoCues=[];const C=CFG.c,B=CFG.brand;
  $('#studio').textContent=CFG.studio;
  const F=FORMATS[FMT]||FORMATS.original;
  stage.style.setProperty('--brand-title-size',Math.min(10,144/Math.max(1,[...B].length))+'cqw');
  stage.style.setProperty('--brand-lockup-size',Math.min(6,85/Math.max(1,[...B].length))+'cqw');
  stage.style.setProperty('--brand-outro-size',Math.min(8,92/Math.max(1,[...B].length))+'cqw');
  stage.dataset.format=FMT;const narrow=(FMT==='phone'||FMT==='tablet');stage.dataset.narrow=narrow?'1':'0';
  stage.toggleAttribute('data-logo',!!ASSET.logo);stage.toggleAttribute('data-bgland',!!ASSET.bgland);stage.toggleAttribute('data-product',!!ASSET.product);
  if(ASSET.bgland)stage.style.setProperty('--a-bgland',`url(${ASSET.bgland})`);if(ASSET.product)stage.style.setProperty('--a-product',`url(${ASSET.product})`);
  const fog=(a,b)=>{const o=layer(a,b,{fi:.01,fo:.01,cls:'fog'});o.fn=(p,tt)=>o.e.style.setProperty('--sway',(Math.sin(tt*1.2)*3*MOT.float).toFixed(2)+'cqw')};

  if(ACTIVE_TEMPLATE!=='original'){buildTemplateVideo();rebuildCues();registerEditableComponents();attachAssetVideos();return}

  /* --- Intro --- */
  {const o=layer(0,2.6,{fi:0,fo:.4,cls:'intro'});el('div','hands',o.e,'<i></i><i></i>');
   const ph=el('div','phone',o.e,'<div class="scr"><b>9:41</b><small>Friday, 17 October</small></div>');
   const OC=['#ff8fc0','#ffb454','#6ab7ff','#7cf0a8','#c79bff','#ffd84d'];const R=rng(11);
   const orbs=Array.from({length:MOT.orbs},(_,i)=>{const s=el('i','orb',o.e);const sz=2+R()*3.4;s.style.width=s.style.height=sz+'cqw';s.style.margin=(-sz/2)+'cqw 0 0 '+(-sz/2)+'cqw';
     s.style.background=`radial-gradient(circle at 30% 28%,#fff 0,${OC[i%6]} 38%,color-mix(in srgb,${OC[i%6]} 55%,#2a0a6a) 100%)`;return{s,tx:(R()-.5)*78,ty:(R()-.5)*48,ph:R()*6,d:R()*.4}});
   const title=el('div','ititle',o.e);const letters=[...B].map(ch=>{const s=el('span','',title);s.textContent=ch;return s});
   o.fn=(p,tt)=>{ph.style.transform=`translate(-50%,-50%) rotate(${-6+Math.sin(tt)*.8}deg) scale(${1+.03*P(p,0,2.5)})`;
     orbs.forEach(ob=>{const q=eo(P(p,.2+ob.d,1.3));const bx=Math.sin(tt*1.4+ob.ph)*.7*MOT.float,by=Math.cos(tt*1.1+ob.ph)*.8*MOT.float;ob.s.style.opacity=q;ob.s.style.transform=`translate(${(ob.tx*q+bx).toFixed(2)}cqw,${(ob.ty*q+by).toFixed(2)}cqw) scale(${(.4+.6*q).toFixed(2)})`});
     letters.forEach((s,i)=>{const q=eb(P(p,.35+i*.07,.95+i*.07));const oq=clamp(P(p,.35+i*.07,.7+i*.07));s.style.opacity=oq;s.style.transform=`translateY(${((1-q)*-7).toFixed(2)}cqw) rotate(${((1-q)*(i%2?9:-9)).toFixed(1)}deg)`})}}

  /* --- Problem --- */
  fog(2.4,15.6);
  beat(2.5,5.2,C.a,{size:3.4,stagger:.35,hl:[1,3]});
  {const w=C.a2.split(' ').filter(Boolean);beat(5,7.5,C.a2,{size:3.4,stagger:.2,auto:false});
   const o=layer(5.1,7.5,{fi:0,fo:.3});const G=['✦','◉','❖','✿','☁','♪','⌘','✎','⚙','☺','♥','☆','◐','❀','✶','❂'];
   const R=rng(23);const gs=G.map((g,i)=>{const s=el('i','gl',o.e);s.textContent=g;return{s,ang:R()*6.28,rad:8+R()*15,spd:(R()-.5)*1.6,d:R()*.5}});
   o.fn=p=>gs.forEach(g=>{const q=P(p,g.d,g.d+1.6),bell=Math.sin(Math.PI*clamp(q));const r=g.rad*bell,a=g.ang+g.spd*p;g.s.style.opacity=bell;g.s.style.transform=`translate(${(Math.cos(a)*r*1.5).toFixed(2)}cqw,${(Math.sin(a)*r*.8).toFixed(2)}cqw) rotate(${(a*30).toFixed(0)}deg)`})}
  beat(7.2,9.6,C.b,{size:4.6,stagger:.26});
  {const o=layer(9.5,11.2,{fi:0,fo:.25});const F=[[-33,-17,-8],[32,-16,7],[-35,13,6],[34,14,-9],[-13,-21,4],[15,21,-5],[0,23,3]];
   const cs=F.map((f,i)=>({c:mkCard(o.e,i),f}));o.fn=p=>cs.forEach((x,i)=>{const q=eb(P(p,i*.07,.7+i*.07));const k=2.4-1.4*q;x.c.style.transform=`translate(${(x.f[0]*k).toFixed(2)}cqw,${(x.f[1]*k).toFixed(2)}cqw) rotate(${(x.f[2]*(2-q)).toFixed(1)}deg)`})}
  beat(9.5,11.1,C.c,{size:2.4,stagger:.22,color:'var(--p-ink)'});
  {const o=layer(11,13.6,{fi:0,fo:.3});const cs=Array.from({length:10},(_,i)=>mkCard(o.e,i+2));
   o.fn=(p,tt)=>cs.forEach((c,i)=>{const a=(i/10)*6.283+p*.14*MOT.orbit;const q=eo(P(p,i*.03,.7));const x=Math.cos(a)*31*q,y=Math.sin(a)*19*q,z=(Math.sin(a)+1.4)/2.4;
     c.style.zIndex=Math.round(z*10);c.style.opacity=q;c.style.transform=`translate(${x.toFixed(2)}cqw,${y.toFixed(2)}cqw) scale(${(.7+.45*z).toFixed(2)}) rotate(${(Math.sin(a*2)*9).toFixed(1)}deg)`})}
  beat(11,13.6,C.d,{size:2.3,stagger:.2});

  /* --- Use Case: Simple + logo --- */
  {const o=layer(13.4,14.5,{fi:0,fo:.25});const gl=[];for(let i=0;i<9;i++){const g=el('i','guide',o.e);g.style.left=(6+i*11.2)+'%';gl.push(g)}
   const row=el('div','beat',o.e);row.style.fontSize='7.6cqw';row.style.fontWeight=600;const sp=el('span','w',row);sp.textContent=C.e;
   o.fn=p=>{const q=eo(P(p,0,.7));sp.style.letterSpacing=((1-q)*1.2).toFixed(3)+'em';sp.style.opacity=clamp(P(p,0,.25));gl.forEach((g,i)=>{g.style.transform=`scaleY(${eo(P(p,i*.03,.5)).toFixed(3)})`;g.style.opacity=.7*(1-P(p,.6,1.1))})}}
  {const o=layer(14.2,15.7,{fi:.2,fo:.3,cls:'blobs'});const lk=el('div','lockup',o.e);const mk=logoMark(lk);const nm=el('span','nm',lk);nm.textContent=B;
   o.fn=p=>{const q=eio(P(p,0,.7)),s=eo(P(p,.7,1.1));mk.style.transform=`scale(${(3-2*q).toFixed(2)})`;nm.style.opacity=s;nm.style.filter=`blur(${((1-s)*6).toFixed(1)}px)`;lk.style.transform=`translate(-50%,-50%) translateX(${(s*0).toFixed(1)}cqw)`;
     mk.style.marginRight=(-2.5*(1-s)).toFixed(2)+'cqw'}}
  {const o=layer(15.5,16.9,{fi:.25,fo:.3});el('div','L land',o.e);const lk=el('div','lockup',o.e);lk.style.color='#fff';logoMark(lk);const nm=el('span','nm',lk);nm.textContent=B;o.fn=p=>{lk.style.transform=`translate(-50%,-50%) scale(${(.96+.04*P(p,0,1.2)).toFixed(3)})`}}
  {const o=layer(16.6,21.3,{fi:.3,fo:.3});el('div','L beige',o.e);const st=el('div','stand',o.e);const m=el('div','monitor',o.e);el('div','L land',m);el('div','msearch',m);
   const mk=el('div','lockup',m);mk.style.transform='translate(-50%,-50%) scale(.45)';mk.style.color='#fff';logoMark(mk);const nm=el('span','nm',mk);nm.textContent=B;
   const pr=el('div','person',o.e,'<i class="hd"></i><i class="sh"></i><i class="lp"></i>');
   o.fn=p=>{const q=eb(P(p,0,.9)),sl=eio(P(p,2.6,3.5));
     if(!narrow){const sx=12*sl,sc=.6+.4*q;
       m.style.transform=`translateX(${sx.toFixed(2)}cqw) scale(${sc.toFixed(3)})`;st.style.transform=`translateX(${sx.toFixed(2)}cqw) scale(${sc.toFixed(3)})`;
       pr.style.transform=`translateX(${((1-eo(P(p,2.6,3.6)))*-40).toFixed(2)}cqw)`;pr.style.opacity=P(p,2.6,3)}
     else{const sc=.5+.35*q;
       m.style.transform=`translateY(-8cqw) scale(${sc.toFixed(3)})`;st.style.transform=`translateY(-8cqw) scale(${sc.toFixed(3)})`;
       pr.style.transform=`translateY(${((1-eo(P(p,2.6,3.6)))*46).toFixed(2)}cqw)`;pr.style.opacity=P(p,2.6,3)}}}
  {const o=layer(20.9,24.3,{fi:.35,fo:.25});const bg=el('div','L land',o.e);const gp=el('div','glass',o.e);const tx=el('span','',gp);const caret=el('i','caret',gp);el('br','',gp);const go=el('span','go',gp,'Show tutorial');
   const big=el('div','bigq',o.e);big.textContent=C.big;const cur=el('div','',o.e,CUR);const cu=cur.firstChild;const rp=el('i','rip',o.e);
   const txt=C.chat;for(let i=0;i<txt.length;i++)autoCues.push({t:21.25+i*.055,type:'tick',v:.8});
   o.fn=p=>{bg.style.filter=`blur(${(10*eo(P(p,0,.5))).toFixed(1)}px)`;bg.style.transform=`scale(${1.08+.05*P(p,0,3)})`;gp.style.transform=`scale(${(.92+.08*eo(P(p,0,.6))).toFixed(3)})`;
     const n=Math.floor(clamp((p-.4)/(txt.length*.055))*txt.length);tx.textContent=txt.slice(0,n);caret.style.opacity=(Math.floor(p*3)%2)?0:1;
     const q=eio(P(p,1.2,2.1));cu.style.left=(72-27*q)+'cqw';cu.style.top=(46+6*q-0)+'cqw';cu.style.opacity=P(p,1,1.3);
     const r=P(p,2.1,2.7);rp.style.left=(45.5)+'cqw';rp.style.top=(52)+'cqw';rp.style.opacity=r>0&&r<1?1-r:0;rp.style.transform=`scale(${(.3+r*1.4).toFixed(2)})`;
     const bq=eo(P(p,2.2,2.8));big.style.opacity=bq;big.style.filter=`blur(${((1-bq)*10).toFixed(1)}px)`}}
  {const o=layer(24,26.7,{fi:.3,fo:.3});o.e.style.background='linear-gradient(#ece4ff,#fff)';el('i','hhand',o.e).style.left='-8cqw';el('i','hhand',o.e).style.right='-8cqw';
   const ph=el('div','pland',o.e);const vid=el('div','vid',ph);const R=rng(5);const tps=Array.from({length:14},()=>{const t=el('i','tp',vid);const a=R()*6.283,r=R()*6;t.style.left=(50+Math.cos(a)*r*1.3-2)+'%';t.style.top=(54+Math.sin(a)*r*1.5-2)+'%';return t});
   el('div','side',ph,'<s></s><s></s><s></s><s></s><em></em>');
   o.fn=(p,tt)=>{tps.forEach((t,i)=>{t.style.opacity=P(p,.6+i*.1,.9+i*.1)});ph.style.transform=`rotate(${(Math.sin(tt*5)*.4*MOT.shake).toFixed(2)}deg) scale(${(1+.04*P(p,0,2.6)).toFixed(3)})`}}
  fog(26.4,31.2);
  beat(26.5,28.1,C.f1+' '+C.f2,{size:3.2,stagger:.22,scatter:true});
  beat(28,28.75,C.g,{size:3.8,stagger:.15,fo:.15});
  {const o=layer(28.6,31.2,{fi:0,fo:.3});const row=el('div','beat',o.e);row.style.fontSize='4.4cqw';const a1=el('span','w',row);a1.textContent=C.h1;const sl=el('span','slot',row);const a2=el('span','w',row);a2.textContent=C.h2;
   const cu=el('div','',o.e,CUR).firstChild;const keys=['head','lap','clock'],tm=[.4,1.2,1.8];
   o.fn=p=>{const k=p<tm[1]?0:p<tm[2]?1:2;sl.innerHTML=ICONS[keys[k]];const since=p-tm[k];const pp=eb(clamp(since/.25));sl.style.transform=`scale(${(.7+.3*pp).toFixed(3)})`;sl.style.opacity=P(p,0,.3);
     a1.style.opacity=a2.style.opacity=eo(P(p,0,.4));cu.style.left=(52+Math.sin(p*2)*1.4)+'cqw';cu.style.top=(35+p*2)+'cqw';cu.style.opacity=P(p,.5,.9)}}
  {const o=layer(31,33.9,{fi:.25,fo:.3,cls:'kraft'});const qb=el('div','qrbox',o.e);
   const circ=`<svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%"><defs><path id="cpth" d="M50 50m-41 0a41 41 0 1 1 82 0a41 41 0 1 1 -82 0"/></defs><g id="cg"><text font-size="7" font-weight="600" fill="#5a3f22" letter-spacing="1.2" font-family="Instrument Sans,sans-serif"><textPath href="#cpth"></textPath></text></g></svg>`;
   qb.insertAdjacentHTML('beforeend',circ);const tp=qb.querySelector('textPath');tp.textContent=C.qr;const cg=qb.querySelector('#cg');const q=el('div','q',qb,qrSVG(9));const sc=el('i','scan',o.e);
   o.fn=p=>{cg.setAttribute('transform',`rotate(${(p*10).toFixed(1)} 50 50)`);qb.style.transform=`scale(${(1+.35*P(p,1.6,2.9)).toFixed(3)})`;const s=P(p,.8,2);sc.style.opacity=s>0&&s<1?1:0;sc.style.top=(8+s*40)+'cqw'}}
  {const o=layer(33.4,38.6,{fi:.3,fo:.3,cls:'pbg'});const R=rng(31);const ph=el('div','pp',o.e);const sc=el('div','sc',ph);
   const sA=el('div','',sc);sA.style.background='linear-gradient(#b08a60,#8a6a45)';const qa=el('div','',sA,qrSVG(9));qa.style.cssText='position:absolute;left:18%;right:18%;top:30%;height:36%;background:#ffffffd0;padding:6%;border-radius:1cqw';
   const sB=el('div','',sc);el('i','watch',sB);[0,1,2,3].forEach(i=>{const l=el('i','ln',sB);l.style.top=(46+i*6)+'%';l.style.right=(12+(i%2)*14)+'%'});const btn=el('i','ln',sB);btn.style.cssText='left:12%;right:12%;top:80%;height:6%;border-radius:1cqw;background:#5b2ee0';
   const sC=el('div','',sc);sC.style.background='#f7f5fb';[0,1,2].forEach(i=>{const v=el('i','vthumb',sC);v.style.top=(14+i*27)+'%';v.style.opacity=.9-.15*i});const ttl=el('i','ln',sC);ttl.style.cssText='left:12%;right:30%;top:5%;height:3%;background:#2a1250';
   const bubs=[[-30,-14],[30,-18],[-34,8],[33,6],[-26,22],[28,24],[-9,-27],[11,-28]].map((pos,i)=>{const b=el('div','bub '+(i%2?'o':'m'),o.e);
     if(i%2){b.style.background=['#ff8fc0','#ffb454','#6ab7ff','#7cf0a8'][(i>>1)%4];b.style.margin='-2.3cqw 0 0 -2.3cqw';b.textContent=['✦','♪','⌘','☺'][(i>>1)%4]}else{b.style.margin='-3cqw 0 0 -8cqw';b.innerHTML='<s style="width:80%"></s><s></s><s style="width:55%"></s>'}return{b,pos,ph:R()*6}});
   o.fn=(p,tt)=>{sA.style.opacity=p<1?1:0;sB.style.opacity=p>=1&&p<2.6?1:0;sC.style.opacity=p>=2.6?1:0;sA.style.transform=`scale(${(1+.1*P(p,0,1)).toFixed(3)})`;sB.style.transform=`translateX(${((1-eo(P(p,1,1.4)))*20).toFixed(1)}%)`;
     ph.style.transform=`scale(${(.8+.2*eo(P(p,0,.6))).toFixed(3)})`;
     bubs.forEach((x,i)=>{const q=eb(P(p,2.7+i*.28,3.05+i*.28));const by=Math.sin(tt*1.6+x.ph)*.6*MOT.float;const bx=narrow?0.72:1;x.b.style.opacity=clamp(q*2);x.b.style.transform=`translate(${(x.pos[0]*bx).toFixed(2)}cqw,${(x.pos[1]+by).toFixed(2)}cqw) scale(${Math.max(0,q).toFixed(3)})`})}}

  /* --- Call to action --- */
  fog(38.4,40.9);
  beat(38.5,39.4,C.i1,{size:4.6,stagger:.1,color:'#8a3cf0',fo:.15,weight:500});
  beat(39.3,40.1,C.i2,{size:3.6,stagger:.1,fo:.15});
  {const o=layer(40,40.9,{fi:0,fo:.15});const row=el('div','beat',o.e);row.style.fontSize='4.2cqw';const sp=el('span','',row);const cr=el('i','caret',row);const txt=C.i3;
   for(let i=0;i<txt.length;i++)autoCues.push({t:40.05+i*.06,type:'tick',v:.8});
   o.fn=p=>{sp.textContent=txt.slice(0,Math.floor(clamp(p/(txt.length*.06))*txt.length));cr.style.opacity=(Math.floor(p*4)%2)?0:1}}
  {const o=layer(40.5,T+.1,{fi:.4,fo:0,cls:'sky'});const R=rng(77);const cl=Array.from({length:9},(_,i)=>{const c=el('i','cloud',o.e);const w=18+R()*22;c.style.width=w+'cqw';c.style.height=(w*.5)+'cqw';c.style.left=(R()*90-8)+'cqw';c.style.top=(R()*50)+'cqw';return{c,sp:(R()-.5)*3,x0:parseFloat(c.style.left)}});
   const rw=el('div','ringw',o.e,ringSVG());const circle=rw.querySelector('circle');circle.style.stroke='#fff';const lg=el('span','lm',null);
   const nm=el('div','nm',o.e);nm.textContent=B;const black=el('div','L',o.e);black.style.background='#000';black.style.opacity=0;
   if(ASSET.logo){const im=el('img','',rw);im.src=ASSET.logo;im.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;';circle.style.display='none'}
   o.fn=(p,tt)=>{cl.forEach(x=>x.c.style.transform=`translateX(${(x.sp*p).toFixed(2)}cqw)`);circle.style.strokeDasharray='1';circle.style.strokeDashoffset=(1-eo(P(p,.5,1.4))).toFixed(3);rw.style.opacity=P(p,.5,.7);
     const q=eo(P(p,1.3,2));rw.style.transform=`translateX(${(-q*14).toFixed(2)}cqw)`;nm.style.opacity=q;nm.style.filter=`blur(${((1-q)*8).toFixed(1)}px)`;nm.style.transform=`translateX(${((1-q)*3-.5).toFixed(2)}cqw)`;nm.style.left=(50-10)+'cqw';
     black.style.opacity=P(p,2.6,3.75)}}

  addMotionDetails();rebuildCues();registerEditableComponents();attachAssetVideos();
}

/* ============ nav + ruler + readout ============ */
const nav=$('#nav');let pills=[];
function buildNav(){nav.innerHTML='';pills=CFG.nav.map((n,i)=>{const b=el('button','pill',nav);b.type='button';b.textContent=n;const ind=el('i','',b);b.addEventListener('click',()=>seek(SEC[i]+.01));return{b,ind}})}
let curScene=-1;
function readout(tt){let idx=SCENES.length-1;for(let i=0;i<SCENES.length;i++){if(tt>=SCENES[i].t0&&tt<SCENES[i].t1){idx=i;break}}
  if(idx===curScene)return;curScene=idx;const s=SCENES[idx];$('#nsec').textContent=s.sec;$('#nname').textContent=s.name;$('#nmot').textContent=s.mot;$('#ncap').textContent=s.cap;$('#ntr').textContent=s.tr;
  document.querySelectorAll('.row').forEach((r,i)=>r.classList.toggle("hl",i===idx));
  document.querySelectorAll('#scene-strip .sc-chip').forEach((c,i)=>{c.classList.toggle('on',i===idx);c.setAttribute('aria-selected',i===idx?'true':'false')});
  const ss=$('#scene-select');if(ss&&ss.value!==String(idx))ss.value=String(idx)}
const fmt=x=>{const m=Math.floor(x/60),s=x-m*60;return m+':'+(s<10?'0':'')+s.toFixed(1)};
function render(){updateLayers(t);if(ACTIVE_TEMPLATE.startsWith('thynk-')&&window.__productionTimeline)window.__productionTimeline.time(t,false);fitTemplateBoards();syncAssetVideos();
  const sec=t<SEC[1]?0:t<SEC[2]?1:t<SEC[3]?2:3;
  pills.forEach((x,i)=>{x.b.classList.toggle('on',i===sec);if(i===sec)x.ind.style.left=(clamp((t-SEC[i])/(SEC[i+1]-SEC[i]))*(100)).toFixed(1)+'%'});
  $('#head').style.left=(t/T*100).toFixed(2)+'%';$('#scrub').value=t;const sm=$('#scrub-m');if(sm)sm.value=t;$('#clock').textContent=fmt(t)+' / '+fmt(T);const cm=$('#clock-m');if(cm)cm.textContent=fmt(t);readout(t);applyComponentEdits()}
function seek(x){t=clamp(x,0,T);render();if(playing)mediaResync()}

/* ============ playback ============ */
function fire(prev,now){ttsTick(prev,now);if(muted||!AC)return;for(const c of allCues){if(c.t>prev&&c.t<=now)playCue(c)}}
function loop(now){if(!playing)return;const dt=Math.min(.1,(now-lastNow)/1000)*(+$('#speed').value);lastNow=now;const prev=t;t+=dt;if(!recording&&ACTIVE_TEMPLATE.startsWith('thynk-')&&MEDIA.vo.el&&!MEDIA.vo.el.paused&&MEDIA.vo.el.readyState>=2)t=clamp(MEDIA.vo.el.currentTime+MEDIA.vo.offset,0,T);
  if(t>=T){if(loopOn){t=0;mediaResync();fire(-1,0)}else{t=T;pause();render();return}}
  fire(prev<=t?prev:-1,t);mediaTick();render();requestAnimationFrame(loop)}
function play(){if(t>=T-.05)t=0;ac();padOn();playing=true;mediaPlay();lastNow=performance.now();syncPlayUI();requestAnimationFrame(loop)}
function pause(){playing=false;syncAssetVideos();syncPlayUI();padOff();mediaPause();ttsCancel();if(typeof onEnded==='function')onEnded()}
$('#play').addEventListener('click',()=>playing?pause():play());
$('#restart').addEventListener('click',()=>{seek(0);if(!playing)play()});
$('#mute').addEventListener('click',()=>{muted=!muted;syncMuteUI();if(master)master.gain.value=muted?0:MASTER});
$('#scrub').addEventListener('input',e=>seek(+e.target.value));
$('#loopck').addEventListener('change',e=>{loopOn=e.target.checked});
$('#nochrome').addEventListener('change',e=>stage.classList.toggle('nochrome',e.target.checked));
$('#fs').addEventListener('click',()=>{const w=$('#sw');(w.requestFullscreen||w.webkitRequestFullscreen||function(){}).call(w)});
document.addEventListener('keydown',e=>{const tg=e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;if(e.target.closest&&e.target.closest('#tabs,.subtabs,.dd-menu,.dd-trigger,.component-form,#navbar-tools,#selection-box,.template-grid,.vault-row,.overlap-menu'))return;if(e.code==='Space'){e.preventDefault();$('#play').click()}else if(e.key==='ArrowRight')seek(t+1);else if(e.key==='ArrowLeft')seek(t-1);else if(e.key==='f'||e.key==='F')$('#fs').click();else if(e.key==='m'||e.key==='M')$('#mute').click()});

/* ============ tabs ============ */
const TABS=['Scenes','Script','Theme','SFX & music','Your assets','ChatGPT prompt'];
const tabs=$('#tabs'),panes=$('#panes');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function mkPanes(){tabs.innerHTML='';panes.innerHTML='';
  TABS.forEach((n,i)=>{const b=el('button','tab',tabs);b.type='button';b.role='tab';b.id='tab-'+i;b.setAttribute('aria-controls','pane-'+i);b.textContent=n;b.setAttribute('aria-selected',i===0);b.addEventListener('click',()=>selectTab(b));const p=el('div','pane',panes);p.hidden=i!==0;p.id='pane-'+i;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','tab-'+i)})
  const [p0,p1,p2,p3,p4,p5]=panes.children;
  p0.innerHTML=`<div class="tw"><table><thead><tr><th>Time</th><th>Scene</th><th>Motion graphics</th><th>Caption animation</th><th>Transition</th></tr></thead><tbody>${SCENES.map((s,i)=>`<tr class="row" tabindex="0" data-i="${i}"><td class="mono">${s.t0.toFixed(1)}–${s.t1.toFixed(1)}</td><td><b>${esc(s.name)}</b><br><span class="hint">${s.sec}</span></td><td>${esc(s.mot)}</td><td>${esc(s.cap)}</td><td>${esc(s.tr)}</td></tr>`).join('')}</tbody></table></div><p class="hint" style="margin-top:8px">Click a row to jump the preview to that scene.</p>`;
  p0.querySelectorAll('.row').forEach(r=>{const go=()=>seek(SCENES[+r.dataset.i].t0+.05);r.addEventListener('click',go);r.addEventListener('keydown',e=>{if(e.key==='Enter')go()})});
  p1.innerHTML=`<div class="grid2">
   <div class="box"><h3>Word blur-in</h3><ul><li>Start: opacity 0, blur 10 px, 1.2% of width below its slot, scale 0.96</li><li>End: opacity 1, blur 0, scale 1, ease-out cubic, 450 ms</li><li>Stagger 250 to 350 ms per word</li><li>Exit: whole line fades and blurs together in 300 ms</li></ul></div>
   <div class="box"><h3>Scatter-in</h3><ul><li>Each word starts at a random offset (up to 15% of width, 10% of height)</li><li>Settles to a staggered two-line layout with the same blur-in</li><li>Used for "Whatever you are doing"</li></ul></div>
   <div class="box"><h3>Tracking collapse</h3><ul><li>Large word, letter-spacing +1.2em to 0 in 700 ms</li><li>Thin vertical guides draw behind it</li><li>Used for "Simple"</li></ul></div>
   <div class="box"><h3>Typewriter</h3><ul><li>55 to 60 ms per character, blinking caret at 4 Hz</li><li>Used for the chat question and the closing line</li></ul></div>
   <div class="box"><h3>Letter drop</h3><ul><li>Intro title: letters fall 7% of width, rotate ±9°, settle with ease-out-back</li><li>40 to 70 ms stagger</li></ul></div>
   <div class="box"><h3>Inline object slot</h3><ul><li>An icon sits inline in the sentence and swaps through three objects</li><li>Each swap: scale 0.7 to 1 with overshoot in 250 ms</li></ul></div></div>
   <h2 style="margin-top:22px">Edit the words</h2><div class="grid2" id="capforms"></div>`;
  const cf=p1.querySelector('#capforms');const fields=[['brand','Brand name'],['studio','Studio label (top of frame)'],['c.a','Problem line 1'],['c.a2','Held word'],['c.b','Problem line 2'],['c.c','Cards caption'],['c.d','Ring caption'],['c.e','Single word'],['c.f1','Scatter line 1'],['c.f2','Scatter line 2'],['c.g','Guide line'],['c.h1','Object line, before'],['c.h2','Object line, after'],['c.i1','CTA 1'],['c.i2','CTA 2'],['c.i3','CTA 3 (typed)'],['c.chat','Chat question'],['c.big','Headline after click'],['c.qr','QR circular text']];
  fields.forEach(([k,lab])=>{const l=el('label','f',cf);l.append(lab);const i=el('input','',l);i.type='text';i.id='cf-'+k;i.value=k.startsWith('c.')?CFG.c[k.slice(2)]:CFG[k];
    i.addEventListener('input',()=>{if(k.startsWith('c.'))CFG.c[k.slice(2)]=i.value;else CFG[k]=i.value;touch();clearTimeout(i._t);i._t=setTimeout(()=>{build();render()},250)})});
  p2.innerHTML=`<div class="grid2"><div class="box"><h3>Colour tokens</h3><div id="swlist"></div></div>
   <div class="box"><h3>Type</h3><ul><li>Captions: clean neo-grotesk, weight 500, tracking −0.012em, colour deep violet (Instrument Sans here; Satoshi or Inter Display work too)</li><li>Intro title: heavy rounded display (Bricolage Grotesque here)</li><li>Sizes in container units: 2.3 to 4.6% of frame width for captions, 7.6% for the single big word</li></ul></div>
   <div class="box"><h3>Frame anatomy</h3><ul><li>4:3 (1440 × 1080), deep navy to violet to magenta vertical gradient</li><li>White rounded card, 2.2% radius, inset 2.2% sides</li><li>Four nav pills under the card, active pill near-black with a glowing purple edge that tracks progress</li><li>Tick ruler under the pills with a white playhead</li></ul></div>
   <div class="box"><h3>Motion rules</h3><ul><li>Ease-out cubic for entrances, ease-in-out cubic for moves, ease-out-back for pop-ins</li><li>Nothing hard-stops: float, sway and rotate continue under every hold</li><li>Section changes cut hard, content inside crossfades 250 to 400 ms</li><li>Shadows soft and tinted violet</li></ul></div></div>`;
  const sw=p2.querySelector('#swlist');[['--p-void','Frame top','#07031a'],['--p-mid','Frame middle','#6a1fd0'],['--p-hot','Frame bottom glow','#e04df0'],['--p-ink','Caption ink','#2a1250'],['--p-accent','Accent','#8a5cf6'],['--p-lilac','Highlight lilac','#b79cf5'],['--p-deep','Active pill','#0a0a0f']].forEach(([v,n,d])=>{
    const r=el('div','sw',sw);const i=el('input','',r);i.type='color';i.id='sw'+v;i.value=d;i.addEventListener('input',()=>stage.style.setProperty(v,i.value));el('span','',r).textContent=n;el('code','',r).textContent=v+' '+d});
  const rowsFx=CUES.map(c=>`<tr><td class="mono">${c.t.toFixed(2)}</td><td>${esc(c.w)}</td><td><b>${c.type}</b></td><td>${esc(SYNTH[c.type])}</td><td><button class="btn" type="button" data-type="${c.type}">Play</button></td></tr>`).join('');
  p3.innerHTML=`<p class="hint" style="margin-bottom:10px">Cue times come from loudness spikes in the reference audio. The preview synthesises each cue in the browser so it works with no files. Typing and word ticks are added automatically.</p><div class="tw"><table><thead><tr><th>Time (s)</th><th>Moment</th><th>Cue</th><th>Synth recipe</th><th></th></tr></thead><tbody>${rowsFx}</tbody></table></div>
   <div class="grid2" style="margin-top:14px"><div class="box"><h3>Bed</h3><ul><li>Soft sine pad (110, 164.8, 220 Hz) through a 520 Hz lowpass, very quiet, runs the whole 44 s</li><li>Reference track also carries music at a steady level; swap in any calm ambient loop</li></ul></div>
   <div class="box"><h3>Real sound search terms</h3><ul>${Object.keys(REAL).map(k=>`<li>${k}: ${REAL[k]}</li>`).join('')}</ul></div></div>`;
  p3.querySelectorAll('button[data-type]').forEach(b=>b.addEventListener('click',()=>{if(ac())S[b.dataset.type](1)}));
  mkAssets(p4);
  p5.innerHTML=`<p class="hint" style="margin-bottom:10px">Paste into ChatGPT. It is generated from the scenes, captions, theme and SFX above, so edits in the other tabs carry over.</p><div class="ctrl" style="margin:0 0 10px"><button class="btn pri" type="button" id="cp">Copy prompt</button><span class="hint" id="cpmsg"></span></div><textarea class="big" id="prompt" readonly></textarea>`;
  p5.querySelector('#cp').addEventListener('click',async()=>{const ta=p5.querySelector('#prompt');try{await navigator.clipboard.writeText(ta.value);p5.querySelector('#cpmsg').textContent='Copied.'}catch(e){ta.select();p5.querySelector('#cpmsg').textContent='Press Ctrl+C to copy the selected text.'}})
}
function refreshPrompt(){const F=FORMATS[FMT]||FORMATS.original;const th=['--p-void','--p-mid','--p-hot','--p-ink','--p-accent','--p-lilac','--p-deep'].map(v=>`${v}: ${getComputedStyle(stage).getPropertyValue(v).trim()}`).join('\n  ');
  const sc=SCENES.map((s,i)=>`${i+1}. [${s.t0.toFixed(1)}s-${s.t1.toFixed(1)}s] ${s.sec} / ${s.name}\n   Motion: ${s.mot}\n   Caption: ${s.cap}\n   Transition: ${s.tr}`).join('\n');
  const cu=CUES.map(c=>`${c.t.toFixed(2)}s  ${c.type.padEnd(6)} ${c.w}`).join('\n');
  const vo=(VO_LINES||[]).map(l=>`${Number(l.t).toFixed(1)}s  ${l.text}`).join('\n');const cp=Object.entries(CFG.c).map(([k,v])=>`  ${k}: "${v}"`).join('\n');
  const txt=`ROLE
You are a senior motion-graphics engineer. Recreate a 44.3 second SaaS explainer video as a deterministic, scrubbable code animation. Do not copy any real brand, logo or footage; use the placeholders and copy given below.

OUTPUT
One self-contained file, index.html. Vanilla JS plus GSAP 3.12.5 from cdnjs (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js). No other network requests. Everything drawn with CSS, inline SVG or canvas.

FRAME (${F.w}x${F.h}, ${F.label}, scale with container query units so it fits any width; keep important content within a 5 percent safe inset on portrait and square formats)
- Background: vertical gradient from var(--p-void) through #1a0a4a and var(--p-mid) to var(--p-hot).
- Tiny studio label centred at the top: "${CFG.studio}".
- White rounded card (radius 2.2% of width, inset 2.2% on the sides, 4.4% from the top, 13.2% from the bottom) holds every scene.
- Below the card: four equal nav pills (${CFG.nav.join(' | ')}). The active pill is near-black with white text and a soft purple glow bar on its leading edge that moves with progress through that section. Section boundaries: 0, 2.5, 13.5, 38.5, 44.33 seconds.
- Under the pills: a tick ruler with a white playhead that follows time.

THEME TOKENS
  ${th}
Captions use a clean neo-grotesk, weight 500, letter-spacing -0.012em, colour var(--p-ink). Intro title uses a heavy rounded display face.

BRAND AND COPY
Brand name: "${CFG.brand}"
${cp}

SCENE-BY-SCENE (all times in seconds on one master timeline)
${sc}

CAPTION ANIMATION PRESETS
- wordBlurIn: opacity 0 to 1, blur 10px to 0, translateY 1.2% to 0, scale .96 to 1, ease-out cubic, 450ms, stagger 250-350ms, exit blur-out 300ms.
- scatterIn: same but each word starts from a random offset up to 15% of width.
- trackingCollapse: letter-spacing +1.2em to 0 in 700ms with thin vertical guide lines drawing behind.
- typewriter: 55-60ms per character with a 4Hz blinking caret.
- letterDrop: letters fall 7% of width with +-9deg rotation, ease-out-back, 40-70ms stagger.
- inlineObjectSlot: an SVG icon sits inside the sentence and swaps between headphones, laptop, alarm clock with a 250ms overshoot pop.

MOTION RULES
Ease-out cubic for entrances, ease-in-out cubic for moves, ease-out-back for pop-ins. Idle elements always keep a small float, sway or rotation. Section changes cut hard; content inside crossfades 250-400ms. Shadows are soft and violet-tinted. Respect prefers-reduced-motion by shortening durations.

SOUND (Web Audio, synthesised, no files; start only after a user click)
Synth recipes: whoosh = bandpass noise sweep 400-2800Hz 0.55s; pop = sine 620-240Hz 0.14s; tick = highpassed noise 30ms; click = 1.6kHz blip + 25ms noise; hit = sine 120-42Hz 0.4s + low noise; swell = lowpass noise rise 200-3500Hz 1.3s; chime = sines 988/1480/1976Hz 1.2s decay; beep = two 1.5kHz pulses. Add a very quiet sine pad (110, 164.8, 220Hz through a 520Hz lowpass) under the whole piece. Add a tick for every caption word and every typed character.
Cue sheet:
${cu}

VOICEOVER SCRIPT
${vo}
Support an uploaded voiceover file, microphone recording synced to the timeline, and optional browser text-to-speech reading these lines at their times.

CANVAS FORMAT
${F.label} (${F.w} by ${F.h}). Fit the whole composition without cropping or nonuniform stretching. On narrow compositions place supporting media above or below captions instead of squeezing a landscape scene. Keep the caption measure within 80 percent of the frame width and important content inside a 5 percent safe inset.

MOTION SETTINGS
${JSON.stringify(MOT)}

ASSET SLOTS
Provide file inputs and drag-and-drop for: logo, hero/landscape background, product image, and several photos for the flying cards. Use generated gradient placeholders when empty.

CONTROLS
Play/pause, restart, scrub bar, 0.5x/1x/2x speed, mute, clickable nav pills that seek to each section, current time readout.

ENGINEERING REQUIREMENTS
- Expose window.renderFrame(t) that draws any frame deterministically (no wall-clock state) so frames can be captured.
- Master timeline is paused and driven by the scrub bar or requestAnimationFrame.
- Also give a Node script using Playwright to call renderFrame(t) at 30fps, save PNGs, and an ffmpeg command that joins them with a WAV of the synthesised audio into an MP4.
- Wrap all localStorage use in try/catch (or avoid it).

QUALITY BAR
Match timing within 100ms of the cue sheet, no layout shift, no clipped text at any width from 360px up, smooth 60fps. Return the complete file in one code block, then a short list of what to tweak.`;
  $('#prompt').value=txt}

/* ============ STUDIO: motion easing, cues, media, voiceover, theme, save ============ */
const EASEFN={cubic:eo,back:eb,expo:p=>p>=1?1:1-Math.pow(2,-10*p),linear:p=>p};
function EASE(p){return (EASEFN[MOT.ease]||eo)(p)}
const CUES_DEF=JSON.parse(JSON.stringify(CUES));
function rebuildCues(){allCues=[...CUES.filter(c=>c.on!==false).map(c=>({...c,v:c.v==null?1:c.v})),...(AUTO_ON?autoCues:[])].sort((a,b)=>a.t-b.t)}
const SND={};const SNDNAME={};
function playCue(c){if(!ac())return;const v=c.v==null?1:c.v;const buf=SND[c.type];
  if(buf){const s=AC.createBufferSource();s.buffer=buf;const g=AC.createGain();g.gain.value=v;s.connect(g).connect(master);s.start();return}
  const f=S[c.type];if(f)f(v)}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}

/* ---- media (voiceover + music) ---- */
const MEDIA={vo:{el:null,url:null,offset:0,vol:1,name:''},music:{el:null,url:null,offset:0,vol:.5,name:''}};
let recording=false,rec=null;
function setMedia(k,file,name){const m=MEDIA[k];if(m.el)m.el.pause();m.file=file;if(m.url)URL.revokeObjectURL(m.url);m.url=URL.createObjectURL(file);m.el=new Audio(m.url);m.el.preload='auto';m.el.volume=m.vol;m.el.loop=false;m.name=name||file.name||k}
function clearMedia(k){const m=MEDIA[k];if(m.el)m.el.pause();if(m.url)URL.revokeObjectURL(m.url);m.el=null;m.url=null;m.file=null;m.name=''}
function mediaPlay(){if(recording)return;for(const k in MEDIA){const m=MEDIA[k];if(!m.el)continue;m.el.volume=m.vol;if(ACTIVE_TEMPLATE.startsWith('thynk-')){m.el.playbackRate=+$('#speed').value;m.el.muted=muted}const x=t-m.offset;if(x>=0){try{m.el.currentTime=(k==='music'&&m.el.duration)?x%m.el.duration:x}catch(e){}m.el.play().catch(()=>{})}}}
function mediaPause(){for(const k in MEDIA){const m=MEDIA[k];if(m.el)m.el.pause()}}
function mediaResync(){mediaPause();ttsCancel();if(playing)mediaPlay()}
function mediaTick(){if(recording)return;if(ACTIVE_TEMPLATE.startsWith('thynk-'))for(const m of Object.values(MEDIA))if(m.el){m.el.playbackRate=+$('#speed').value;m.el.muted=muted}for(const k in MEDIA){const m=MEDIA[k];if(!m.el||!m.el.paused||m.el.ended)continue;if(t>=m.offset){try{m.el.currentTime=t-m.offset}catch(e){}m.el.play().catch(()=>{})}}
  if(MEDIA.music.el&&MEDIA.music.el.ended){MEDIA.music.el.currentTime=0;MEDIA.music.el.play().catch(()=>{})}}

/* ---- text to speech ---- */
let VO_LINES=null;const TTS={on:false,rate:1,vol:1,voice:''};
function defaultVO(){const C=CFG.c,B=CFG.brand;return[{t:2.6,text:C.a+' '+C.b},{t:9.6,text:C.c},{t:11.1,text:C.d},{t:13.5,text:C.e+'. '+B},{t:26.6,text:C.f1+' '+C.f2+' '+C.g},{t:28.7,text:C.h1+' '+C.h2},{t:38.6,text:C.i1+'. '+C.i2+'. '+C.i3}]}
function ttsSpeak(text){if(!('speechSynthesis' in window))return;const u=new SpeechSynthesisUtterance(text);u.rate=TTS.rate;u.volume=TTS.vol;const v=speechSynthesis.getVoices().find(v=>v.name===TTS.voice);if(v)u.voice=v;speechSynthesis.speak(u)}
function ttsCancel(){try{speechSynthesis.cancel()}catch(e){}}
function ttsTick(prev,now){if(!TTS.on||recording||!VO_LINES)return;for(const l of VO_LINES){if(l.t>prev&&l.t<=now)ttsSpeak(l.text)}}

/* ---- recording voiceover and exporting video ---- */
let exporting=null;
function onEnded(){if(recording&&t>=T-.05)recStop();if(exporting&&t>=T-.05){exporting.stop();exporting=null}}
async function recStart(setMsg){try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const chunks=[];rec=new MediaRecorder(stream);rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{stream.getTracks().forEach(x=>x.stop());const b=new Blob(chunks,{type:rec.mimeType||'audio/webm'});setMedia('vo',b,'Recorded voiceover');MEDIA.vo.offset=0;rec=null;recording=false;setMsg('Recorded. Press Play to hear it with the video.');mkVOrefresh()};
    recording=true;rec.start();seek(0);play();setMsg('Recording. Narrate along with the video. Stops at the end or when you press Stop.');
    const t0=Date.now();if(window._recTick)clearInterval(window._recTick);
    window._recTick=setInterval(()=>{const ec2=document.getElementById('rec-elapsed');if(ec2)ec2.textContent='Recording '+fmt((Date.now()-t0)/1000)+' — press Stop to finish.'},250)}
  catch(e){recording=false;setMsg('Microphone not available: '+(e&&e.message?e.message:e))}}
function recStop(){if(rec&&rec.state!=='inactive'){rec.stop()}recording=false;if(window._recTick){clearInterval(window._recTick);window._recTick=null}const ec2=document.getElementById('rec-elapsed');if(ec2)ec2.textContent='';if(playing)pause()}
async function exportVideo(setMsg){setObjectMode(false);try{const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:true,preferCurrentTab:true,selfBrowserSurface:'include'});
    const chunks=[];const mr=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm'});
    mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};mr.onstop=()=>{stream.getTracks().forEach(x=>x.stop());dl(new Blob(chunks,{type:'video/webm'}),'motion-studio.webm');setMsg('Saved motion-studio.webm')};
    exporting=mr;const wasLoop=loopOn;loopOn=false;seek(0);mr.start();setTimeout(()=>{if(!playing)play()},600);setMsg('Recording this tab. Choose "This tab" in the picker. Tip: press Fullscreen first next time for a clean frame.');
    mr.addEventListener('stop',()=>{loopOn=wasLoop})}
  catch(e){setMsg('Screen capture was cancelled or is blocked in this browser: '+(e&&e.message?e.message:e))}}

/* ---- theme ---- */
const THEMES={violet:{n:'Violet haze',v:{'--p-void':'#07031a','--p-mid':'#6a1fd0','--p-hot':'#e04df0','--p-ink':'#2a1250','--p-accent':'#8a5cf6','--p-lilac':'#b79cf5','--p-deep':'#0a0a0f'}},
 sunset:{n:'Sunset',v:{'--p-void':'#1a0508','--p-mid':'#d4421f','--p-hot':'#ffb347','--p-ink':'#3a1408','--p-accent':'#e8663a','--p-lilac':'#f4a57c','--p-deep':'#1a0508'}},
 ocean:{n:'Ocean',v:{'--p-void':'#021226','--p-mid':'#0a6fb8','--p-hot':'#4fe0d0','--p-ink':'#0b2a3f','--p-accent':'#1f8fd6','--p-lilac':'#8fcbf0','--p-deep':'#021226'}},
 mint:{n:'Mint',v:{'--p-void':'#031a14','--p-mid':'#0e8a5c','--p-hot':'#b7f542','--p-ink':'#0c3326','--p-accent':'#17a673','--p-lilac':'#7fdcb4','--p-deep':'#031a14'}},
 rose:{n:'Rose',v:{'--p-void':'#1d0615','--p-mid':'#c2185b','--p-hot':'#ff8ab5','--p-ink':'#3a0a26','--p-accent':'#e0457f','--p-lilac':'#f5a3c4','--p-deep':'#1d0615'}},
 mono:{n:'Mono',v:{'--p-void':'#050505','--p-mid':'#3a3a3a','--p-hot':'#bdbdbd','--p-ink':'#111111','--p-accent':'#555555','--p-lilac':'#999999','--p-deep':'#000000'}}};
const TKEYS=Object.keys(THEMES.violet.v);
const FONTS_CAP=[['Instrument Sans',"'Instrument Sans',system-ui,sans-serif"],['Manrope',"'Manrope',system-ui,sans-serif"],['DM Sans',"'DM Sans',system-ui,sans-serif"],['Sora',"'Sora',system-ui,sans-serif"],['Outfit',"'Outfit',system-ui,sans-serif"],['Fraunces (serif)',"'Fraunces',Georgia,serif"],['System',"system-ui,-apple-system,'Segoe UI',sans-serif"]];
const FONTS_DISP=[['Bricolage Grotesque',"'Bricolage Grotesque','Instrument Sans',system-ui,sans-serif"],['Syne',"'Syne',system-ui,sans-serif"],['Fraunces (serif)',"'Fraunces',Georgia,serif"],['Outfit',"'Outfit',system-ui,sans-serif"],['Sora',"'Sora',system-ui,sans-serif"],['Instrument Sans',"'Instrument Sans',system-ui,sans-serif"]];
let FONTSEL={cap:'Instrument Sans',disp:'Bricolage Grotesque'};
function syncRing(){const cs=getComputedStyle(stage);const st=document.querySelectorAll('#rg stop');if(st.length>1){st[0].setAttribute('stop-color',cs.getPropertyValue('--p-lilac').trim()||'#b58cff');st[1].setAttribute('stop-color',cs.getPropertyValue('--p-accent').trim()||'#6a2fe0')}}
function setTheme(vars){for(const k in vars){stage.style.setProperty(k,vars[k]);const i=document.getElementById('sw'+k);if(i)i.value=vars[k]}syncRing()}
function themeVars(){const cs=getComputedStyle(stage),o={};TKEYS.forEach(k=>o[k]=cs.getPropertyValue(k).trim());return o}
function setFonts(){const c=FONTS_CAP.find(f=>f[0]===FONTSEL.cap),d=FONTS_DISP.find(f=>f[0]===FONTSEL.disp);if(c)stage.style.setProperty('--f-body',c[1]);if(d)stage.style.setProperty('--f-disp',d[1])}

/* ---- save / load ---- */
function snapshot(withAssets){return{v:1,templateId:ACTIVE_TEMPLATE,format:FMT,canvasFormat:FMT,components:componentSnapshot(withAssets),frames:{...FRAMES},transportShown:OBJECTS.transport,CFG,MOT:{...MOT},theme:themeVars(),fonts:{...FONTSEL},cues:CUES.map(c=>({t:c.t,type:c.type,w:c.w,on:c.on!==false,v:c.v==null?1:c.v})),
  vo:{lines:VO_LINES,tts:{...TTS},offset:MEDIA.vo.offset,vol:MEDIA.vo.vol},music:{offset:MEDIA.music.offset,vol:MEDIA.music.vol},pad:PADVOL,master:MASTER,autoTicks:AUTO_ON,assets:withAssets?ASSET:undefined,referenceAssets:Object.fromEntries(Object.entries(ASSET.directed||{}).filter(([k,v])=>typeof v==='string'&&v.startsWith('assets/reference-library/')))}}
let SAVED_THEME=null;
function applyState(s){if(!s)return;configureTemplate(s.templateId);loadComponentState(s);
  const requestedFormat=s.canvasFormat||s.format;FMT=FORMATS[requestedFormat]?requestedFormat:'original';
  if(s.CFG){CFG=JSON.parse(JSON.stringify(DEF));Object.assign(CFG,s.CFG);CFG.c=Object.assign({},DEF.c,s.CFG.c||{});CFG.nav=s.CFG.nav||DEF.nav}
  if(s.MOT)Object.assign(MOT,MOT_DEF,s.MOT);
  if(s.fonts)Object.assign(FONTSEL,s.fonts);
  if(s.theme)SAVED_THEME=s.theme;
  if(Array.isArray(s.cues)){CUES.length=0;s.cues.forEach(c=>CUES.push(c))}
  if(s.vo){if(s.vo.lines&&s.vo.lines.length)VO_LINES=s.vo.lines;Object.assign(TTS,s.vo.tts||{});MEDIA.vo.offset=s.vo.offset||0;MEDIA.vo.vol=s.vo.vol==null?1:s.vo.vol}
  if(s.music){MEDIA.music.offset=s.music.offset||0;MEDIA.music.vol=s.music.vol==null?.5:s.music.vol}
  if(s.pad!=null)PADVOL=s.pad;if(s.master!=null)MASTER=s.master;if(s.autoTicks!=null)AUTO_ON=s.autoTicks;
  if(s.assets){ASSET.directed={...(s.assets.directed||{})};['logo','bgland','product'].forEach(k=>{if(s.assets[k])ASSET[k]=s.assets[k]});if(s.assets.photos&&s.assets.photos.length)ASSET.photos=s.assets.photos}if(s.referenceAssets){ASSET.directed=ASSET.directed||{};Object.assign(ASSET.directed,s.referenceAssets)}}
function loadSaved(){try{const raw=localStorage.getItem('motion-studio-v1');if(raw){const saved=JSON.parse(raw);if(TEMPLATE_CATALOG.some(d=>d.id===saved.templateId))applyState(saved);else if(saved.templateId?.startsWith('thynk-custom-'))window.__pendingCustomState=saved}}catch(e){}}
let _sv=null;function touch(){clearTimeout(_sv);_sv=setTimeout(()=>{const lab=$('#save-label');try{localStorage.setItem('motion-studio-v1',JSON.stringify(snapshot(false)));if(lab)lab.textContent='Saved in this browser'}catch(e){if(lab)lab.textContent="Couldn't save locally";toast("Couldn't save locally — your work is still in memory.")}},400)}
function fullReload(){buildNav();build();mkPanes();mkStudio();refreshSceneControls();render()}
const rb=()=>{clearTimeout(rb._t);rb._t=setTimeout(()=>{build();render();touch()},120)};

/* ---- UI helpers ---- */
function addTab(label){const n=tabs.children.length;const b=el('button','tab',tabs);b.type='button';b.setAttribute('role','tab');b.id='tab-'+n;b.setAttribute('aria-controls','pane-'+n);b.textContent=label;b.setAttribute('aria-selected','false');b.addEventListener('click',()=>selectTab(b));const p=el('div','pane',panes);p.hidden=true;p.id='pane-'+n;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','tab-'+n);return p}
function selectTab(b){const i=[...tabs.children].indexOf(b);[...tabs.children].forEach((x,j)=>{x.setAttribute('aria-selected',j===i);x.tabIndex=j===i?0:-1});[...panes.children].forEach((p,j)=>p.hidden=j!==i);if(b.textContent==='ChatGPT prompt')refreshPrompt();const ts=$('#tab-select');if(ts)ts.value=String(i);const it=$('#insp-title');if(it)it.textContent=b.textContent}
const paneOf=l=>panes.children[[...tabs.children].findIndex(b=>b.textContent===l)];
function slider(parent,label,min,max,step,val,fmtf,cb){const l=el('label','f',parent);const top=el('span','',l);top.append(label+' ');const out=el('b','mono',top);const i=el('input','',l);i.type='range';i.min=min;i.max=max;i.step=step;i.value=val;const f=fmtf||(x=>x);out.textContent=f(+val);i.addEventListener('input',()=>{out.textContent=f(+i.value);cb(+i.value)});return i}
function selectBox(parent,label,opts,val,cb){const l=el('label','f',parent);l.append(label);const s=el('select','',l);opts.forEach(([v,n])=>{const o=el('option','',s);o.value=v;o.textContent=n});s.value=val;s.addEventListener('change',()=>cb(s.value));return s}
function fileBox(parent,label,accept,cb){const l=el('label','f',parent);l.append(label);const i=el('input','',l);i.type='file';i.accept=accept;i.addEventListener('change',()=>{if(i.files[0])cb(i.files[0],i)});return i}
const refresh=()=>{if(!playing)render()};

/* Presentation only: move the existing live controls; never recreate media state. */
function editorSubtabs(p,groups){
  const list=el('div','subtabs',null);list.setAttribute('role','tablist');list.setAttribute('aria-label','Editing options');
  const buttons=[],panels=[];const active=groups.some(g=>g[0]===p.dataset.subtab)?p.dataset.subtab:groups[0][0];
  function activate(i,focus){p.dataset.subtab=groups[i][0];buttons.forEach((b,j)=>{b.setAttribute('aria-selected',j===i?'true':'false');b.tabIndex=j===i?0:-1;panels[j].hidden=j!==i});if(focus)buttons[i].focus()}
  groups.forEach(([name,nodes],i)=>{
    const b=el('button','subtab',list);b.type='button';b.textContent=name;b.id=p.id+'-subtab-'+i;b.setAttribute('role','tab');
    const panel=el('div','subpanel',null);panel.id=p.id+'-subpanel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);b.setAttribute('aria-controls',panel.id);
    nodes.forEach(n=>panel.appendChild(n));buttons.push(b);panels.push(panel);b.addEventListener('click',()=>activate(i,false));
  });
  p.querySelectorAll(':scope > .grid2').forEach(g=>{if(!g.children.length)g.remove()});p.prepend(list,...panels);
  list.addEventListener('keydown',e=>{const i=buttons.indexOf(document.activeElement);if(i<0)return;let j=i;
    if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%buttons.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=buttons.length-1;else return;
    e.preventDefault();e.stopPropagation();activate(j,true)});
  activate(groups.findIndex(g=>g[0]===active),false);
}

function groupScriptFields(){
  const p=paneOf('Script'),forms=p.querySelector('#capforms'),recipes=p.querySelector('.grid2');
  const guide=el('details','editor-guide',p);el('summary','',guide).textContent='Caption animation guide';guide.appendChild(recipes);
  const groups=[['Intro & brand',['brand','studio']],['Problem',['c.a','c.a2','c.b','c.c','c.d']],['Use Case',['c.e','c.f1','c.f2','c.g','c.h1','c.h2','c.chat','c.big','c.qr']],['Call to Action',['c.i1','c.i2','c.i3']]];
  groups.forEach(([name,keys])=>{const box=el('section','box',forms);el('h3','',box).textContent=name;const fields=el('div','stk',box);keys.forEach(k=>fields.appendChild(document.getElementById('cf-'+k).parentElement))});
}

/* ---- Theme tab additions ---- */
function buildTheme(p){const bx=el('div','box',null);bx.style.marginBottom='14px';bx.innerHTML='<h3>Theme presets</h3>';p.prepend(bx);
  const ch=el('div','chips',bx);Object.keys(THEMES).forEach(k=>{const b=el('button','chip',ch);b.type='button';b.textContent=THEMES[k].n;b.addEventListener('click',()=>{setTheme(THEMES[k].v);touch();refresh()})});
  const g=el('div','grid2',bx);g.style.marginTop='12px';
  selectBox(g,'Caption font',FONTS_CAP.map(f=>[f[0],f[0]]),FONTSEL.cap,v=>{FONTSEL.cap=v;setFonts();touch()});
  selectBox(g,'Title and logo font',FONTS_DISP.map(f=>[f[0],f[0]]),FONTSEL.disp,v=>{FONTSEL.disp=v;setFonts();touch()});
  const sw=p.querySelector('#swlist');sw.addEventListener('input',()=>{syncRing();touch()})}

/* ---- SFX & music tab ---- */
function buildSfx(p){p.innerHTML='';
  const top=el('div','grid2',p);
  const b1=el('div','box',top,'<h3>Mix</h3>');const s1=el('div','stk',b1);
  slider(s1,'Master volume',0,1,.01,MASTER,x=>Math.round(x*100)+'%',v=>{MASTER=v;if(master&&!muted)master.gain.value=v;touch()});
  slider(s1,'Synth pad level',0,2,.05,PADVOL,x=>Math.round(x*100)+'%',v=>{PADVOL=v;touch()});
  const lb=el('label','f',s1);const ck=el('input','',lb);ck.type='checkbox';ck.checked=AUTO_ON;lb.append(' Tick on every caption word and typed letter');ck.addEventListener('change',()=>{AUTO_ON=ck.checked;rebuildCues();touch()});
  const b2=el('div','box',top,'<h3>Background music</h3>');const s2=el('div','stk',b2);const st=el('div','msg',s2);st.textContent=MEDIA.music.name?('Loaded: '+MEDIA.music.name):'No track loaded. The synth pad plays instead.';
  fileBox(s2,'Upload a track (mp3, wav, m4a)','audio/*',(f,i)=>{setMedia('music',f);st.textContent='Loaded: '+f.name;if(playing)mediaResync()});
  slider(s2,'Music volume',0,1,.01,MEDIA.music.vol,x=>Math.round(x*100)+'%',v=>{MEDIA.music.vol=v;if(MEDIA.music.el)MEDIA.music.el.volume=v;touch()});
  slider(s2,'Start offset (seconds)',-5,10,.1,MEDIA.music.offset,x=>x.toFixed(1)+'s',v=>{MEDIA.music.offset=v;touch()});
  const rm=el('button','btn',s2);rm.type='button';rm.textContent='Remove track';rm.addEventListener('click',()=>{clearMedia('music');st.textContent='No track loaded. The synth pad plays instead.'});
  const b3=el('div','box',p,'<h3>Replace a built-in sound with your own file</h3><p class="hint" style="margin-bottom:10px">Each cue type below can use a sound file instead of the synth. Short files work best.</p>');b3.style.margin='14px 0';
  const g3=el('div','grid2',b3);Object.keys(SYNTH).forEach(k=>{const l=el('label','f',g3);const nm=el('span','',l);nm.textContent=k+(SNDNAME[k]?'  ('+SNDNAME[k]+')':'');const i=el('input','',l);i.type='file';i.accept='audio/*';
    i.addEventListener('change',async()=>{if(!i.files[0])return;try{const a=ac();SND[k]=await a.decodeAudioData(await i.files[0].arrayBuffer());SNDNAME[k]=i.files[0].name;nm.textContent=k+'  ('+i.files[0].name+')'}catch(e){nm.textContent=k+'  (could not read that file)'}});
    const c=el('button','btn',l);c.type='button';c.textContent='Use synth again';c.addEventListener('click',()=>{delete SND[k];delete SNDNAME[k];nm.textContent=k;i.value=''})});
  const hd=el('div','rowflex',p);hd.style.margin='4px 0 10px';const add=el('button','btn',hd);add.type='button';add.textContent='Add cue at playhead';const rs=el('button','btn',hd);rs.type='button';rs.textContent='Reset cues';
  const tw=el('div','tw',p);const tb=el('table',null,tw);tb.style.minWidth='820px';
  function draw(){tb.innerHTML='<thead><tr><th>On</th><th>Time (s)</th><th>Cue</th><th>Volume</th><th>Moment</th><th></th></tr></thead>';const body=el('tbody','',tb);
    CUES.forEach((c,idx)=>{const tr=el('tr','',body);
      const t1=el('td','',tr);const ck=el('input','',t1);ck.type='checkbox';ck.checked=c.on!==false;ck.setAttribute('aria-label','Enable cue');ck.addEventListener('change',()=>{c.on=ck.checked;rebuildCues();touch()});
      const t2=el('td','',tr);const tn=el('input','',t2);tn.type='number';tn.step='0.05';tn.min='0';tn.max=String(T);tn.value=c.t;tn.addEventListener('change',()=>{c.t=clamp(+tn.value,0,T);rebuildCues();touch()});
      const t3=el('td','',tr);const sl=el('select','',t3);Object.keys(SYNTH).forEach(k=>{const o=el('option','',sl);o.value=k;o.textContent=k});sl.value=c.type;sl.addEventListener('change',()=>{c.type=sl.value;rebuildCues();touch()});
      const t4=el('td','',tr);const vr=el('input','',t4);vr.type='range';vr.min=0;vr.max=1.5;vr.step=.05;vr.value=c.v==null?1:c.v;vr.setAttribute('aria-label','Volume');vr.addEventListener('input',()=>{c.v=+vr.value;rebuildCues();touch()});
      const t5=el('td','',tr);const lb=el('input','',t5);lb.type='text';lb.value=c.w||'';lb.addEventListener('change',()=>{c.w=lb.value;touch()});
      const t6=el('td','',tr);const pl=el('button','btn',t6);pl.type='button';pl.textContent='Play';pl.addEventListener('click',()=>playCue({type:c.type,v:c.v}));
      const dx=el('button','btn',t6);dx.type='button';dx.textContent='Delete';dx.style.marginLeft='6px';dx.addEventListener('click',()=>{CUES.splice(idx,1);rebuildCues();touch();draw()})})}
  add.addEventListener('click',()=>{CUES.push({t:+t.toFixed(2),type:'pop',w:'New cue',on:true,v:1});CUES.sort((a,b)=>a.t-b.t);rebuildCues();touch();draw()});
  rs.addEventListener('click',()=>{CUES.length=0;CUES_DEF.forEach(c=>CUES.push({...c}));rebuildCues();touch();draw()});
  draw();editorSubtabs(p,[['Mix',[b1]],['Music',[b2]],['Cues',[b3,hd,tw]]])}

/* ---- Voiceover tab ---- */
let mkVOrefresh=()=>{};
function mkVO(p){p.innerHTML='';if(!VO_LINES)VO_LINES=defaultVO();
  const g=el('div','grid2',p);
  const b1=el('div','box',g,'<h3>Upload a voiceover</h3>');const s1=el('div','stk',b1);const st=el('div','msg',s1);
  const upd=()=>{st.textContent=MEDIA.vo.name?('Loaded: '+MEDIA.vo.name):'Upload audio or record a take.'};upd();mkVOrefresh=upd;
  fileBox(s1,'Audio file (mp3, wav, m4a, webm)','audio/*',(f)=>{setMedia('vo',f);upd();if(playing)mediaResync()});
  slider(s1,'Voiceover volume',0,1,.01,MEDIA.vo.vol,x=>Math.round(x*100)+'%',v=>{MEDIA.vo.vol=v;if(MEDIA.vo.el)MEDIA.vo.el.volume=v;touch()});
  slider(s1,'Start offset (seconds)',-5,10,.1,MEDIA.vo.offset,x=>x.toFixed(1)+'s',v=>{MEDIA.vo.offset=v;touch()});
  const r1=el('div','rowflex',s1);const rm=el('button','btn',r1);rm.type='button';rm.textContent='Remove';rm.addEventListener('click',()=>{clearMedia('vo');upd()});
  const dlb=el('button','btn',r1);dlb.type='button';dlb.textContent='Download voiceover';dlb.addEventListener('click',async()=>{if(!MEDIA.vo.url)return;const b=await (await fetch(MEDIA.vo.url)).blob();dl(b,'voiceover.'+((b.type.split('/')[1]||'webm').split(';')[0]))});
  const b2=el('div','box',g,'<h3>Record with your microphone</h3>');const s2=el('div','stk',b2);const rmsg=el('div','msg',s2);rmsg.textContent='Plays the video from the start with effects muted while you speak. Use headphones.';
  const recElapsed=el('div','msg mono',s2);recElapsed.id='rec-elapsed';
  const r2=el('div','rowflex',s2);const rb1=el('button','btn pri',r2);rb1.type='button';rb1.textContent='Record';const rb2=el('button','btn',r2);rb2.type='button';rb2.textContent='Stop';
  rb1.addEventListener('click',()=>{if(!recording)recStart(m=>rmsg.textContent=m)});rb2.addEventListener('click',()=>{if(recording)recStop()});
  const b3=el('div','box',g,'<h3>Browser voice (text to speech)</h3>');const s3=el('div','stk',b3);
  const lk=el('label','f',s3);const ck=el('input','',lk);ck.type='checkbox';ck.checked=TTS.on;lk.append(' Speak the script lines below while playing');ck.addEventListener('change',()=>{TTS.on=ck.checked;if(!ck.checked)ttsCancel();touch()});
  const vsel=selectBox(s3,'Voice',[['','Default voice']],TTS.voice,v=>{TTS.voice=v;touch()});
  const fillV=()=>{if(!('speechSynthesis' in window))return;const vs=speechSynthesis.getVoices();if(!vs.length)return;vsel.innerHTML='';const d=el('option','',vsel);d.value='';d.textContent='Default voice';vs.forEach(v=>{const o=el('option','',vsel);o.value=v.name;o.textContent=v.name+' ('+v.lang+')'});vsel.value=TTS.voice};
  fillV();if('speechSynthesis' in window)speechSynthesis.onvoiceschanged=fillV;
  slider(s3,'Speed',.6,1.6,.05,TTS.rate,x=>x.toFixed(2)+'x',v=>{TTS.rate=v;touch()});
  slider(s3,'Volume',0,1,.01,TTS.vol,x=>Math.round(x*100)+'%',v=>{TTS.vol=v;touch()});
  const bx=el('div','box',p,'<h3>Voiceover script</h3><p class="hint" style="margin-bottom:10px">Each line is spoken at its time by the browser voice. Edit the words, move the times, add or remove lines. Use the same text when you record your own.</p>');bx.style.marginTop='14px';
  const tw=el('div','tw',bx);const tb=el('table',null,tw);tb.style.minWidth='640px';
  function draw(){tb.innerHTML='<thead><tr><th>Time (s)</th><th>Line</th><th></th></tr></thead>';const body=el('tbody','',tb);
    VO_LINES.forEach((l,i)=>{const tr=el('tr','',body);const a=el('td','',tr);const n=el('input','',a);n.type='number';n.step='0.1';n.min='0';n.max=String(T);n.value=l.t;n.addEventListener('change',()=>{l.t=clamp(+n.value,0,T);touch()});
      const b=el('td','',tr);const tx=el('input','',b);tx.type='text';tx.value=l.text;tx.addEventListener('input',()=>{l.text=tx.value;touch()});
      const c=el('td','',tr);const sp=el('button','btn',c);sp.type='button';sp.textContent='Speak';sp.addEventListener('click',()=>{ttsCancel();ttsSpeak(l.text)});const d=el('button','btn',c);d.type='button';d.textContent='Delete';d.style.marginLeft='6px';d.addEventListener('click',()=>{VO_LINES.splice(i,1);touch();draw()})})}
  draw();const rw=el('div','rowflex',bx);rw.style.marginTop='10px';
  const ad=el('button','btn',rw);ad.type='button';ad.textContent='Add line at playhead';ad.addEventListener('click',()=>{VO_LINES.push({t:+t.toFixed(1),text:'New line'});VO_LINES.sort((a,b)=>a.t-b.t);touch();draw()});
  const rs=el('button','btn',rw);rs.type='button';rs.textContent='Rebuild from captions';rs.addEventListener('click',()=>{VO_LINES=defaultVO();touch();draw()});editorSubtabs(p,[['Upload',[b1]],['Record',[b2]],['Browser voice',[b3]]])}

/* ---- Motion tab ---- */
function mkMotion(p){p.innerHTML='';
  const ch=el('div','chips',p);ch.style.marginBottom='14px';
  const PRE={'Original':{...MOT_DEF},'Calm':{...MOT_DEF,stagger:1.4,blur:14,travel:1.6,float:.6,orbit:.6,shake:.4},'Snappy':{...MOT_DEF,stagger:.6,blur:6,travel:.8,orbit:1.4,ease:'expo'},'Playful':{...MOT_DEF,style:'pop',stagger:1,blur:0,travel:2,float:2,orbit:1.6,shake:2,ease:'back',orbs:30}};
  Object.keys(PRE).forEach(k=>{const b=el('button','chip',ch);b.type='button';b.textContent=k;b.addEventListener('click',()=>{Object.assign(MOT,PRE[k]);mkMotion(p);rb()})});
  const g=el('div','grid2',p);
  const b1=el('div','box',g,'<h3>Captions</h3>');const s1=el('div','stk',b1);
  selectBox(s1,'Caption animation',[['orig','Original (per scene)'],['blur','Blur-in'],['rise','Rise'],['pop','Pop'],['drop','Drop'],['fade','Fade'],['scatter','Scatter']],MOT.style,v=>{MOT.style=v;rb()});
  selectBox(s1,'Easing',[['cubic','Smooth (cubic out)'],['back','Springy (back)'],['expo','Snappy (expo)'],['linear','Linear']],MOT.ease,v=>{MOT.ease=v;rb()});
  slider(s1,'Stagger between words',.3,3,.05,MOT.stagger,x=>x.toFixed(2)+'x',v=>{MOT.stagger=v;rb()});
  slider(s1,'Blur amount',0,24,1,MOT.blur,x=>x+'px',v=>{MOT.blur=v;rb()});
  slider(s1,'Travel distance',0,6,.1,MOT.travel,x=>x.toFixed(1),v=>{MOT.travel=v;rb()});
  slider(s1,'Caption size',.6,1.8,.05,MOT.size,x=>x.toFixed(2)+'x',v=>{MOT.size=v;rb()});
  const b2=el('div','box',g,'<h3>Motion graphics</h3>');const s2=el('div','stk',b2);
  slider(s2,'Floating objects (intro orbs)',4,40,1,MOT.orbs,x=>x,v=>{MOT.orbs=v;rb()});
  slider(s2,'Float and sway',0,3,.05,MOT.float,x=>x.toFixed(2)+'x',v=>{MOT.float=v;touch();refresh()});
  slider(s2,'Card ring spin',0,4,.05,MOT.orbit,x=>x.toFixed(2)+'x',v=>{MOT.orbit=v;touch();refresh()});
  slider(s2,'Handheld shake',0,4,.05,MOT.shake,x=>x.toFixed(2)+'x',v=>{MOT.shake=v;touch();refresh()});
  const rs=el('button','btn',s2);rs.type='button';rs.textContent='Reset motion';rs.addEventListener('click',()=>{Object.assign(MOT,MOT_DEF);mkMotion(p);rb()});
  const b3=el('div','box',p,'<h3>Tips</h3><ul><li>Scrub to the scene you are tuning, change a slider, and watch it update in place.</li><li>Use the speed menu at 0.5x to judge timing.</li><li>Pop plus springy easing gives a bouncier feel; Rise plus Calm feels editorial.</li></ul>');b3.style.marginTop='14px';editorSubtabs(p,[['Caption',[b1]],['Graphics',[b2]]])}

/* ---- Project tab ---- */
function mkProject(p){p.innerHTML='';const g=el('div','grid2',p);
  const b1=el('div','box',g,'<h3>Save and load</h3>');const s1=el('div','stk',b1);const msg=el('div','msg',s1);msg.textContent='Settings save in this browser automatically. Export a file to keep or move them.';
  const lk=el('label','f',s1);const ck=el('input','',lk);ck.type='checkbox';lk.append(' Include uploaded images in the file (larger)');
  const r=el('div','rowflex',s1);const ex=el('button','btn pri',r);ex.type='button';ex.id='pj-export';ex.textContent='Export project';ex.addEventListener('click',()=>{dl(new Blob([JSON.stringify(snapshot(ck.checked),null,1)],{type:'application/json'}),'motion-studio-project.json');msg.textContent='Exported. Audio files are not included; add them again after loading.'});
  fileBox(s1,'Import project','.json,application/json',async f=>{msg.textContent=await importProject(f)});
  const rs=el('button','btn',s1);rs.type='button';rs.textContent='Reset everything';rs.addEventListener('click',()=>{if(resetProject())location.reload()});
  const b2=el('div','box',g,'<h3>Export a video</h3>');const s2=el('div','stk',b2);const vm=el('div','msg',s2);vm.textContent='Records this browser tab to a WebM file, with sound, from the start to the end. Works in Chrome and Edge. For a clean frame, hide the frame chrome and use Fullscreen first.';
  const vb=el('button','btn pri',s2);vb.type='button';vb.textContent='Record video of the whole piece';vb.addEventListener('click',()=>exportVideo(m=>vm.textContent=m));
  const b3=el('div','box',g,'<h3>Shortcuts</h3><ul><li><kbd>Space</kbd> play or pause</li><li><kbd>←</kbd> <kbd>→</kbd> seek one second</li><li><kbd>F</kbd> fullscreen</li><li><kbd>M</kbd> mute effects</li></ul>');editorSubtabs(p,[['Project file',[b1,b3]],['Video recording',[b2]]])}

/* ---- interface shell: icons, dropdowns, strip, rail, view switch, assets ---- */
const ICON_PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
const ICON_PAUSE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
const ICON_VOL_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>';
const ICON_VOL_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" stroke="none"/><path d="M16 9l6 6M22 9l-6 6"/></svg>';
const ICON_UPLOAD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" width="22" height="22"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>';
function syncPlayUI(){const label=playing?'Pause':'Play with sound';
  const b=$('#play');if(b){b.setAttribute('aria-label',label);b.classList.toggle('playing',playing);b.innerHTML=playing?ICON_PAUSE:ICON_PLAY}
  const m=$('#play-m');if(m){m.setAttribute('aria-label',label);m.classList.toggle('playing',playing);m.innerHTML=playing?ICON_PAUSE:ICON_PLAY}}
function syncMuteUI(){const b=$('#mute');if(!b)return;b.setAttribute('aria-pressed',muted?'true':'false');b.setAttribute('aria-label',muted?'Unmute':'Mute');b.setAttribute('title',muted?'Unmute':'Mute');b.innerHTML=muted?ICON_VOL_OFF:ICON_VOL_ON}
let _toastT=null;function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.hidden=false;clearTimeout(_toastT);_toastT=setTimeout(()=>{t.hidden=true},3600)}
function makeDropdown(root){if(!root)return{close(){}};const trig=root.querySelector('.dd-trigger'),menu=root.querySelector('.dd-menu');if(!trig||!menu)return{close(){}};
  const opts=[...menu.querySelectorAll('[role="option"],button.mi,input')];
  function position(){const r=trig.getBoundingClientRect(),gap=8,edge=12;
    const vv=window.visualViewport;const vh=vv?vv.height:window.innerHeight,vw=vv?vv.width:window.innerWidth;
    const above=Math.max(0,r.top-gap-edge),below=Math.max(0,vh-r.bottom-gap-edge);
    const up=below<Math.min(menu.scrollHeight,260)&&above>below;menu.style.maxHeight=Math.floor(up?above:below)+'px';
    const w=menu.getBoundingClientRect().width,h=menu.getBoundingClientRect().height;
    menu.style.setProperty('--menu-origin',up?'bottom right':'top right');menu.style.left=Math.max(edge,Math.min(r.right-w,vw-w-edge))+'px';menu.style.top=Math.max(edge,up?r.top-gap-h:r.bottom+gap)+'px';
  }
  function open(){document.body.appendChild(menu);menu.hidden=false;root.classList.add('open');trig.setAttribute('aria-expanded','true');position();const sel=menu.querySelector('[aria-selected="true"]')||opts[0];if(sel)sel.focus()}
  function close(ret){if(menu.hidden)return;menu.hidden=true;root.appendChild(menu);root.classList.remove('open');trig.setAttribute('aria-expanded','false');if(ret)trig.focus()}
  trig.addEventListener('click',()=>menu.hidden?open():close(true));
  trig.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(menu.hidden)open();if(e.key==='ArrowUp'&&opts.length)opts[opts.length-1].focus()}});
  document.addEventListener('click',e=>{if(!root.contains(e.target)&&!menu.contains(e.target))close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();close(true)}});
  window.addEventListener('resize',()=>{if(!menu.hidden)position()});if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{if(!menu.hidden)position()});
  menu.addEventListener('keydown',e=>{const i=opts.indexOf(document.activeElement);let j=null;
    if(e.key==='ArrowDown')j=(i+1)%opts.length;else if(e.key==='ArrowUp')j=(i+opts.length-1)%opts.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=opts.length-1;
    if(j!=null&&opts.length){e.preventDefault();opts[j].focus()}
    else if((e.key==='Enter'||e.key===' ')&&document.activeElement.getAttribute('role')==='option'){e.preventDefault();document.activeElement.click()}
    else if(e.key==='Tab')close(true);
  });
  opts.forEach(o=>{if(o.getAttribute('role')==='option')o.addEventListener('click',()=>close(true));if(!o.hasAttribute('tabindex'))o.tabIndex=0});
  return{open,close}}
function buildStrip(){const wrap=$('#scene-strip');if(!wrap||wrap.children.length)return;
  SCENES.forEach((s,i)=>{const b=el('button','sc-chip',wrap);b.type='button';b.setAttribute('role','option');b.setAttribute('aria-selected',i===0?'true':'false');
    b.innerHTML='<span class="sc-time">'+s.t0.toFixed(1)+'–'+s.t1.toFixed(1)+'s</span><span class="sc-name">'+esc(s.name)+'</span>';
    b.addEventListener('click',()=>seek(s.t0+.05))});
  const ss=$('#scene-select');SCENES.forEach((s,i)=>{const o=el('option','',ss);o.value=String(i);o.textContent=s.t0.toFixed(1)+'s '+s.name});
  ss.addEventListener('change',()=>seek(SCENES[+ss.value].t0+.05));
  const ts=$('#tab-select');[...tabs.children].forEach((b,i)=>{const o=el('option','',ts);o.value=String(i);o.textContent=b.textContent});
  ts.addEventListener('change',()=>selectTab(tabs.children[+ts.value]))}
function setView(v){document.body.dataset.view=v;const pv=$('#vw-preview'),ev=$('#vw-edit');
  pv.classList.toggle('on',v==='preview');ev.classList.toggle('on',v==='edit');
  pv.setAttribute('aria-pressed',v==='preview'?'true':'false');ev.setAttribute('aria-pressed',v==='edit'?'true':'false');
  requestAnimationFrame(()=>{fitStage();refreshObjectPanel()})}
function layoutMode(){document.body.classList.toggle('narrow-ui',window.innerWidth<960||window.innerHeight<480)}
function selectTabByLabel(l){const b=[...tabs.children].find(x=>x.textContent===l);if(b)selectTab(b)}
async function importProject(f){try{const imported=JSON.parse(await f.text());clearTemplateMedia();Object.assign(ASSET,{logo:null,bgland:null,product:null,photos:[]});applyState(imported);paintFormatUI();fullReload();setTransportShown(OBJECTS.transport);touch();return 'Imported.'}catch(e){return 'Could not read that file.'}}
function resetProject(){if(!confirm('Reset everything? This clears the project saved in this browser and reloads the defaults.'))return false;try{localStorage.removeItem('motion-studio-v1')}catch(e){}return true}
function projAction(k){if(k==='export'){const b=document.getElementById('pj-export');if(b)b.click()}
  else if(k==='import'){const f=$('#import-file');if(f)f.click()}
  else if(k==='reset'){if(resetProject())location.reload()}}

/* ---- Your assets tab: real thumbnails, per-slot remove ---- */
const ASSETNAME={logo:'',bgland:'',product:''};
function renderAssetPreviews(){const p=paneOf('Your assets');if(!p)return;
  const set=k=>{const slot=p.querySelector('[data-slot="'+k+'"]');if(!slot)return;const th=slot.querySelector('.asset-thumb');const nm=slot.querySelector('.asset-name');
    if(ASSET[k]){th.innerHTML='';const im=el('img','',th);im.src=ASSET[k];im.alt=k;nm.textContent=ASSETNAME[k]||'Image loaded'}
    else{th.innerHTML='';const d=el('div','asset-empty',th);d.innerHTML=ICON_UPLOAD;el('span','',d,'Add '+slot.dataset.label+' image');nm.textContent='No file'}};
  ['logo','bgland','product'].forEach(set);
  const pg=p.querySelector('#photo-grid');
  if(pg){pg.innerHTML='';if(ASSET.photos.length){ASSET.photos.forEach((u,i)=>{const d=el('div','asset-thumb',pg);const im=el('img','',d);im.src=u;im.alt='Photo '+(i+1)})}
    else{const d=el('div','asset-empty',pg);d.style.gridColumn='1/-1';d.innerHTML=ICON_UPLOAD;el('span','',d,'Add photos for the flying cards')}}
  const pn=p.querySelector('#photos-name');if(pn)pn.textContent=ASSET.photos.length?ASSET.photos.length+' photo(s) selected':'No files'}
function mkAssets(p){const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
  const slot=(k,label,btn)=>`<div class="asset-slot" data-slot="${k}" data-label="${label}"><div class="asset-thumb"></div><div class="asset-meta"><b>${label}</b><span class="asset-name"></span></div><div class="rowflex"><button class="btn" type="button" data-act="pick">${btn}</button><button class="btn" type="button" data-act="rm">Remove</button></div><input type="file" accept="image/*" id="as-${k}" hidden></div>`;
  p.innerHTML=`<p class="hint" style="margin-bottom:12px">Pick your files and the preview rebuilds with them. Images stay in your browser; nothing is uploaded.</p><div class="asset-grid">`
    +slot('logo','Logo','Choose file')+slot('bgland','Landscape / hero background','Choose file')+slot('product','Product image','Choose file')
    +`<div class="asset-slot" data-slot="photos" data-label="photos"><div class="photo-grid" id="photo-grid"></div><div class="asset-meta"><b>Photos for the flying cards</b><span class="asset-name" id="photos-name"></span></div><div class="rowflex"><button class="btn" type="button" data-act="pick">Choose files</button><button class="btn" type="button" data-act="rm">Remove</button></div><input type="file" accept="image/*" multiple id="as-photos" hidden></div>`
    +`</div><div style="margin-top:12px"><button class="btn" type="button" id="as-clear">Clear all assets</button></div>`;
  ['logo','bgland','product'].forEach(k=>{const inp=p.querySelector('#as-'+k);inp.addEventListener('change',async()=>{const f=inp.files[0];if(!f)return;ASSET[k]=await rd(f);ASSETNAME[k]=f.name;build();render();renderAssetPreviews()})});
  const ph=p.querySelector('#as-photos');ph.addEventListener('change',async()=>{ASSET.photos=await Promise.all([...ph.files].map(rd));build();render();renderAssetPreviews()});
  p.querySelectorAll('.asset-slot').forEach(sl=>{const k=sl.dataset.slot;
    sl.querySelector('[data-act="pick"]').addEventListener('click',()=>sl.querySelector('input[type=file]').click());
    sl.querySelector('[data-act="rm"]').addEventListener('click',()=>{if(k==='photos')ASSET.photos=[];else{ASSET[k]=null;ASSETNAME[k]=''}sl.querySelector('input[type=file]').value='';build();render();renderAssetPreviews()})});
  p.querySelector('#as-clear').addEventListener('click',()=>{ASSET.logo=ASSET.bgland=ASSET.product=null;ASSET.photos=[];ASSETNAME.logo=ASSETNAME.bgland=ASSETNAME.product='';p.querySelectorAll('input[type=file]').forEach(i=>i.value='');build();render();renderAssetPreviews()});
  renderAssetPreviews()}

function initUI(){
  layoutMode();
  makeDropdown($('#fmt-dd'));const projDD=makeDropdown($('#proj-dd'));makeDropdown($('#pb-dd'));
  document.querySelectorAll('#fmt-menu [role="option"]').forEach(o=>o.addEventListener('click',()=>setFormat(o.dataset.v)));
  document.querySelectorAll('#proj-menu [data-proj]').forEach(b=>b.addEventListener('click',()=>{projDD.close();projAction(b.dataset.proj)}));
  $('#vw-preview').addEventListener('click',()=>setView('preview'));
  $('#vw-edit').addEventListener('click',()=>setView('edit'));
  $('#rail-home').addEventListener('click',()=>{setView('preview');selectTab(tabs.children[0])});
  $('#rail-preview').addEventListener('click',()=>setView('preview'));
  $('#rail-assets').addEventListener('click',()=>{selectTabByLabel('Add all assets');if(document.body.classList.contains('narrow-ui'))setView('edit')});
  $('#rail-project').addEventListener('click',()=>{selectTabByLabel('Project');if(document.body.classList.contains('narrow-ui'))setView('edit')});
  $('#ctx-toggle').addEventListener('click',()=>{const d=$('#ctx-detail');const open=d.hidden;d.hidden=!open;$('#ctx-toggle').setAttribute('aria-expanded',open?'true':'false')});
  $('#play-m').addEventListener('click',()=>playing?pause():play());
  $('#scrub-m').addEventListener('input',e=>seek(+e.target.value));
  $('#recbtn').addEventListener('click',()=>exportVideo(m=>toast(m)));
  $('#import-file').addEventListener('change',async e=>{const f=e.target.files[0];if(f)toast(await importProject(f));e.target.value=''});
  tabs.addEventListener('keydown',e=>{const bs=[...tabs.children];const i=bs.indexOf(document.activeElement);if(i<0)return;let j=null;
    if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%bs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i-1+bs.length)%bs.length;
    else if(e.key==='Home')j=0;else if(e.key==='End')j=bs.length-1;
    if(j!=null){e.preventDefault();bs[j].focus();selectTab(bs[j])}});
  new ResizeObserver(()=>fitStage()).observe($('#well'));
  window.addEventListener('resize',()=>{layoutMode();fitStage()});
  document.addEventListener('fullscreenchange',fitStage);
  syncPlayUI();syncMuteUI();
}

/* ---- assemble tabs ---- */
const ORDER=['Components','Templates','Add all assets','Reference Library','Scenes','Script','Voiceover','Motion','Theme','SFX & music','Your assets','ChatGPT prompt','Project'];
function mkStudio(){buildTheme(paneOf('Theme'));buildSfx(paneOf('SFX & music'));mkAssets(paneOf('Your assets'));mkVO(addTab('Voiceover'));mkMotion(addTab('Motion'));mkProject(addTab('Project'));mkComponents(addTab('Components'));mkTemplates(addTab('Templates'));mkAssetVault(addTab('Add all assets'));mkReferenceLibrary(addTab('Reference Library'));
  const tb=[...tabs.children],pn=[...panes.children];ORDER.forEach(l=>{const i=tb.findIndex(b=>b.textContent===l);if(i>=0){tabs.appendChild(tb[i]);panes.appendChild(pn[i])}});
  selectTab(tabs.children[0]);const scenesPane=paneOf('Scenes');scenesPane.querySelector('.tw').classList.add('scene-list');groupScriptFields();setFonts();if(SAVED_THEME)setTheme(SAVED_THEME);else syncRing();rebuildCues()}

