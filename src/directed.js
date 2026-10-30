/* Thynk director's cut. One measured audio clock, twenty authored compositions. */
CUES_DEF.splice(0,CUES_DEF.length,...DIRECTED_SFX_DATA.cues.map(c=>({...c})));
const DIRECTED_SCENES=[
 [0,3.2,'intro','Four real products','big'],[3.2,4.2,'mockups','Not mockups','medium'],[4.2,6.34,'smarter','The smarter way','medium'],
 [6.34,10.78,'clip','ClipFlow scans','medium'],[10.78,12.46,'captions','Animated captions','medium'],[12.46,14.96,'social','Publish to Instagram and YouTube','medium'],
 [14.96,16.48,'wiretitle','Wireframer','title'],[16.48,19.02,'prompt','One prompt or reference','medium'],[19.02,22.46,'screens','Phone, tablet, desktop','medium'],[22.46,25.7,'code','HTML, CSS, JavaScript','medium'],
 [25.7,26.34,'foodtitle','FoodSnap','title'],[26.34,30.88,'scan','Meal recognition','medium'],[30.88,34.22,'tracking','Diary and progress','medium'],
 [34.22,36.26,'artitle','AR menu viewer','title'],[36.26,41.46,'ar','A dish in your space','medium'],[41.46,44.56,'stack','The build stack','small'],[44.56,46.54,'ship','Build fast. Ship.','small'],
 [46.54,47.8,'need','Need a product built?','title'],[47.8,48.78,'message','Message me.','title'],[48.78,51.36,'guide','How these graphics were made','medium'],[51.36,52.66,'comment','Comment Full Guide','title'],[52.66,54.186,'follow','Follow Thynk.','title']
].map(([start,end,kind,name,size])=>({start,end,kind,name,size}));
const DIRECTED_DIRECTIONS=[
 ['Launch quartet','Four equal icons settle into a precise launch grid','grid','riffle','up',0],
 ['Orbit of products','Four icons orbit once and resolve into a diamond','orbit','hub','down',1],
 ['Vertical stories','A cascading column of product icons becomes a timeline','column','stack','up',2],
 ['Floating shelf','Four products land across two offset shelves','shelf','drawer','down',3],
 ['Connected launch','Signals join four product stations around a hub','cross','relay','up',4],
 ['Pocket constellation','Large hero icon with three orbiting companions','hero','phone','down',5],
 ['Split rhythm','Alternating pairs answer across a split composition','pairs','format','up',6],
 ['Soft cascade','Overlapping icon cards unfold in a measured cascade','cascade','exploded','down',7],
 ['Carousel studio','Four products travel through a shallow carousel','carousel','turntable','up',8],
 ['Diagonal momentum','Product icons climb a clean diagonal','diagonal','branches','down',9],
 ['Gallery of four','Two tall columns establish an editorial gallery','gallery','cabinet','up',10],
 ['Modular bloom','A compact bento opens into four product tiles','bento','rebuild','down',11],
 ['Signal path','A traveling signal reveals each product in sequence','path','terminal','up',12],
 ['Arc of ideas','Four icons settle along a generous open arc','arc','terrain','down',13],
 ['Lifted layers','A depth stack peels into four independent products','layers','laptop','up',14],
 ['Focus and flow','A spotlight moves between four clean product tiles','focus','loupe','down',15],
 ['Wave of launches','Four products rise on a subtle staggered wave','wave','plot','up',16],
 ['Center of gravity','A centered icon cross gathers and expands','diamond','phosphor','down',17],
 ['Studio sequence','An offset two-by-two arrangement uses elegant holds','offset','keyboard','up',18],
 ['Final assembly','Four separate modules lock into a complete system','assembly','slow','down',19]
];
// Twenty distinct director treatments. The brand palette stays purple / white / pink;
// each treatment changes captions, entrance mechanics, transition masks and graphic texture.
const DIRECTED_TREATMENTS=[
 {captionLabel:'Kinetic snap words',transitionLabel:'Vertical lift mask',motionLabel:'Precise grid, pink edge glints',captionMode:0,transitionMode:0,motionMode:0},
 {captionLabel:'Orbiting tracking reveal',transitionLabel:'Radial orbit wipe',motionLabel:'Circular halo rings and counter-orbit',captionMode:1,transitionMode:1,motionMode:1},
 {captionLabel:'Vertical cascade rhythm',transitionLabel:'Staggered drop mask',motionLabel:'Timeline rails and wave-staggered tiles',captionMode:2,transitionMode:2,motionMode:2},
 {captionLabel:'Alternating shelf snap',transitionLabel:'Horizontal shelf wipe',motionLabel:'Glass shelves with soft spring settling',captionMode:3,transitionMode:3,motionMode:3},
 {captionLabel:'Split-phrase left/right',transitionLabel:'Cross-split reveal',motionLabel:'Connected signal nodes and drawn routes',captionMode:4,transitionMode:4,motionMode:4},
 {captionLabel:'Hero pop and bloom',transitionLabel:'Expanding circle iris',motionLabel:'One hero focal point with orbiting satellites',captionMode:5,transitionMode:5,motionMode:5},
 {captionLabel:'Mirrored duet captions',transitionLabel:'Split-screen slider',motionLabel:'Twin columns and mirrored movement',captionMode:6,transitionMode:6,motionMode:6},
 {captionLabel:'Rotating card cascade',transitionLabel:'Diagonal blade wipe',motionLabel:'Layered cards with controlled rotation',captionMode:7,transitionMode:7,motionMode:7},
 {captionLabel:'Carousel tracking type',transitionLabel:'Zoom-through reveal',motionLabel:'Lateral carousel depth and parallax',captionMode:8,transitionMode:8,motionMode:8},
 {captionLabel:'Diagonal tilt reveal',transitionLabel:'Diagonal polygon sweep',motionLabel:'Angled panels and diagonal momentum',captionMode:9,transitionMode:9,motionMode:9},
 {captionLabel:'Editorial gallery focus',transitionLabel:'Framed inset reveal',motionLabel:'Gallery spacing, picture rails and pink rule',captionMode:10,transitionMode:10,motionMode:10},
 {captionLabel:'Bento scale-up words',transitionLabel:'Grid-cell reveal',motionLabel:'Bento tiles expand into a modular system',captionMode:11,transitionMode:11,motionMode:11},
 {captionLabel:'Signal-by-signal type',transitionLabel:'Traveling signal bar',motionLabel:'Progressive light path with pulse nodes',captionMode:12,transitionMode:12,motionMode:12},
 {captionLabel:'Arc-sweep typography',transitionLabel:'Curved iris reveal',motionLabel:'Open arcs and curved path movement',captionMode:13,transitionMode:13,motionMode:13},
 {captionLabel:'Layer peel and roll',transitionLabel:'Paper-peel mask',motionLabel:'Stacked depth planes and perspective tilt',captionMode:14,transitionMode:14,motionMode:14},
 {captionLabel:'Focus-lock captions',transitionLabel:'Spotlight lock-on',motionLabel:'Focus corners and controlled depth blur',captionMode:15,transitionMode:15,motionMode:15},
 {captionLabel:'Wave-stagger cadence',transitionLabel:'Wavefront reveal',motionLabel:'Flowing wave path with soft pink peaks',captionMode:16,transitionMode:16,motionMode:16},
 {captionLabel:'Center-bloom typography',transitionLabel:'Center burst mask',motionLabel:'Diamond cluster, radial rays and bloom',captionMode:17,transitionMode:17,motionMode:17},
 {captionLabel:'Editorial staggered lines',transitionLabel:'Clean side wipe',motionLabel:'Offset editorial grid with typography rules',captionMode:18,transitionMode:18,motionMode:18},
 {captionLabel:'Assembly snap typography',transitionLabel:'Four-quadrant lock',motionLabel:'Panels snap into one balanced system',captionMode:19,transitionMode:19,motionMode:19}
];
// The only built-in template catalog. Old films cannot be restored accidentally.
MOTION_CATALOG.splice(0,MOTION_CATALOG.length,...DIRECTED_DIRECTIONS.map(([name,description,layout,figure,slide,index])=>{const treatment=DIRECTED_TREATMENTS[index];return{id:'thynk-directed-'+String(index+1).padStart(2,'0'),style:'directed',name,description:description+' · '+treatment.motionLabel,layout,figure,slide,index,concept:index+1,family:index%8,theme:'violet-pink',bg:'#ffffff',accent:'#7b2df4',pink:'#f3a4e8',ink:'#7b2df4',duration:54.186,...treatment}}));
thynkScenes=function(){const d=MOTION_CATALOG.find(item=>item.id===ACTIVE_TEMPLATE)||MOTION_CATALOG[0];return DIRECTED_SCENES.map((s,i)=>({t0:s.start,t1:s.end,sec:i<3?'Intro':i<6?'ClipFlow':i<17?'Products':'Guide',name:s.name,mot:d.motionLabel,cap:d.captionLabel+' · word-timed animation; safe-margin aware.',tr:d.transitionLabel+'.'}))};
function resolveDirectedAsset(key,fallback){return ASSET.directed?.[key]||((key==='clipflow'||key==='wireframer'||key==='meal'||key==='table')&&ASSET.photos?.[['clipflow','wireframer','meal','table'].indexOf(key)%Math.max(1,ASSET.photos.length)])||(key==='meal'&&ASSET.product)||(key==='foodsnap'&&ASSET.logo)||DIRECTED_ASSETS[key]||fallback||'';}
function directedImage(parent,key,cls='dm-image'){const im=el('img',cls,parent);im.src=resolveDirectedAsset(key);im.alt=key.replaceAll('-',' ');im.draggable=false;return im;}
function directedText(parent,text,cls=''){return thynkText('div',cls,parent,text)}
function directedCard(parent,cls=''){return el('div','dm-card '+cls,parent)}
function captionMotion(mode,p,index){
 const q=eo(clamp(p)),side=index%2?1:-1,px=1-q;
 const out={opacity:Math.min(1,p*2.6),transform:'none',filter:'none',clipPath:'none',letterSpacing:'inherit',transformOrigin:index%2?'right center':'left center'};
 switch(mode){
  case 0:out.transform=`translate3d(0,${px*34}px,0) scale(${.96+.04*q})`;break;
  case 1:out.transform=`translate3d(${side*px*48}px,${Math.sin(q*Math.PI)*-4}px,0)`;out.letterSpacing=`${.12*px}em`;break;
  case 2:out.transform=`translate3d(0,${-px*40}px,0) scale(${.92+.08*q})`;out.clipPath=`inset(0 0 ${px*100}% 0)`;break;
  case 3:out.transform=`translate3d(${side*px*28}px,${px*12}px,0) rotate(${side*px*4}deg)`;break;
  case 4:out.transform=`translate3d(${side*px*68}px,0,0)`;out.clipPath=`inset(0 ${px*100}% 0 0)`;break;
  case 5:out.transform=`scale(${.45+.55*q}) rotate(${side*px*9}deg)`;out.opacity=Math.min(1,p*3.2);break;
  case 6:out.transform=`translate3d(${side*px*42}px,${px*8}px,0) scaleX(${.82+.18*q})`;out.transformOrigin=side>0?'right center':'left center';break;
  case 7:out.transform=`translate3d(${side*px*30}px,${px*26}px,0) rotate(${side*px*6}deg) scale(${.9+.1*q})`;break;
  case 8:out.transform=`translate3d(${side*px*56}px,0,0) scale(${.88+.12*q})`;out.filter=`blur(${px*5}px)`;break;
  case 9:out.transform=`translate3d(${side*px*34}px,${px*28}px,0) rotate(${side*px*8}deg)`;break;
  case 10:out.transform=`translate3d(0,${px*20}px,0) scale(${.94+.06*q})`;out.filter=`blur(${px*8}px)`;break;
  case 11:out.transform=`scale(${.72+.28*q})`;out.clipPath=`inset(${px*12}% ${px*12}% ${px*12}% ${px*12}% round ${q*12}px)`;break;
  case 12:out.transform=`translate3d(${side*px*46}px,0,0)`;out.letterSpacing=`${px*.08}em`;break;
  case 13:out.transform=`translate3d(${side*px*24}px,${px*16}px,0) rotate(${side*px*5}deg)`;out.clipPath=`circle(${35+65*q}% at ${index%2?100-50*q:50*q}% 50%)`;break;
  case 14:out.transform=`translate3d(0,${px*24}px,0) rotateX(${px*35}deg) scale(${.92+.08*q})`;out.filter=`blur(${px*3}px)`;break;
  case 15:out.transform=`scale(${.9+.1*q})`;out.filter=`blur(${px*9}px)`;break;
  case 16:out.transform=`translate3d(0,${Math.sin((1-q)*Math.PI)*-18+px*28}px,0)`;break;
  case 17:out.transform=`scale(${.35+.65*q}) rotate(${side*px*18}deg)`;out.opacity=Math.min(1,p*2.7);break;
  case 18:out.transform=`translate3d(${side*px*32}px,${px*10}px,0)`;out.clipPath=`inset(0 ${px*100}% 0 0)`;break;
  case 19:out.transform=`translate3d(${side*px*24}px,${px*22}px,0) scale(${.88+.12*q}) rotate(${side*px*3}deg)`;break;
 }
 return out;
}
function entryPose(mode,index){
 const side=index%2?1:-1;const poses=[
  [0,42,.84,0],[side*85,-4,.72,side*12],[0,-78,.9,0],[side*64,38,.86,side*5],[-side*72,0,.78,side*8],
  [0,0,.22,side*25],[side*88,0,.88,0],[side*52,62,.68,side*18],[side*110,0,.8,0],[side*72,side*64,.72,side*14],
  [0,30,.92,0],[0,0,.35,0],[side*120,0,.84,0],[side*36,52,.82,side*16],[0,70,.84,side*22],
  [0,0,.72,0],[0,72,.78,side*4],[0,0,.12,side*45],[side*58,12,.9,0],[side*72,side*56,.76,side*9]
 ];const [x,y,scale,rotation]=poses[mode%poses.length];return{x,y,scale,rotation};
}
function transitionClip(mode,q,slide){
 if(q>=.999)return'none';const r=Math.max(0,Math.min(100,q*100)),c=100-r;
 switch(mode){
  case 0:return `inset(${slide==='up'?c:0}% 0 ${slide==='down'?c:0}% 0)`;
  case 1:return `circle(${r*1.5}% at 50% 50%)`;
  case 2:return `inset(0 0 ${c}% 0)`;
  case 3:return `inset(0 ${c}% 0 0)`;
  case 4:return `polygon(0 0,${r}% 0,${r}% 100%,0 100%)`;
  case 5:return `circle(${r*1.55}% at 50% 50%)`;
  case 6:return `inset(0 0 0 ${c}%)`;
  case 7:return `polygon(0 0,${r}% 0,100% ${r}%,100% 100%,0 100%)`;
  case 8:return `inset(${c*.1}% ${c*.1}% ${c*.1}% ${c*.1}% round ${q*32}px)`;
  case 9:return `polygon(0 0,${r}% 0,100% ${r}%,100% 100%,0 100%)`;
  case 10:return `inset(7% ${c}% 7% ${c}% round ${q*34}px)`;
  case 11:return `polygon(0 0,${r}% 0,${r}% 45%,100% 45%,100% 100%,0 100%)`;
  case 12:return `inset(0 ${c}% 0 0)`;
  case 13:return `circle(${r*1.5}% at ${50+(slide==='down'?-8:8)*c}% 50%)`;
  case 14:return `polygon(0 0,100% 0,${r}% 100%,0 100%)`;
  case 15:return `circle(${r*1.55}% at 50% 50%)`;
  case 16:return `polygon(0 0,100% 0,100% ${r}%,75% ${Math.max(0,r-8)}%,50% ${r}%,25% ${Math.max(0,r-8)}%,0 ${r}%)`;
  case 17:return `circle(${r*1.6}% at 50% 50%)`;
  case 18:return `inset(0 ${c}% 0 0)`;
  case 19:return `polygon(0 0,${r}% 0,${r}% ${r}%,100% ${r}%,100% 100%,0 100%)`;
  default:return'none';
 }
}
function motionDrift(mode,index,local){
 const p=local,phase=local*(.65+(mode%5)*.09)+index*1.13,amp=[2.5,7,4.5,5.5,6,3.5,8,6.5,9,7.5,3,5,8,4,6,3.5,7,4,5,5.5][mode%20];
 let x=Math.sin(phase)*amp,y=Math.cos(phase*.82+index)*amp*.68;
 switch(mode%20){case 0:y*=.45;break;case 1:x=Math.cos(phase)*amp*1.25;break;case 2:y=Math.sin(p*2+index)*amp*1.5;break;case 3:x=Math.sin(phase*.6)*amp*1.2;break;case 4:x=Math.sin(phase)*amp*1.35;y=Math.cos(phase)*amp*.35;break;case 5:x=Math.cos(phase)*amp*.45;y=Math.sin(phase)*amp*.65;break;case 6:x=Math.sin(phase+Math.PI*index)*amp;break;case 7:x=Math.sin(phase)*amp;y=Math.cos(phase)*amp;break;case 8:x=Math.sin(phase)*amp*1.7;y=Math.cos(phase)*amp*.35;break;case 9:x=Math.sin(phase)*amp;y=Math.sin(phase)*amp;break;case 10:y=Math.sin(phase)*amp*.5;break;case 11:x=Math.sin(phase)*amp*.75;y=Math.cos(phase)*amp*.75;break;case 12:x=Math.sin(phase)*amp*1.4;break;case 13:x=Math.cos(phase)*amp;y=Math.sin(phase)*amp*.5;break;case 14:y=Math.sin(phase)*amp*1.1;break;case 15:x=Math.sin(phase)*amp*.4;y=Math.cos(phase)*amp*.4;break;case 16:y=Math.sin(phase+index*.5)*amp*1.35;break;case 17:x=Math.sin(phase)*amp*.8;y=Math.cos(phase)*amp*.8;break;case 18:x=Math.sin(phase)*amp*.55;break;case 19:x=Math.sin(phase)*amp*.6;y=Math.cos(phase)*amp*.6;break;}
 return{x,y};
}
function directedEntry(node,time,delay=0){node.dataset.reveal=String(time+delay);return node}
function directedIcon(parent,key,time,cls=''){const p=directedEntry(directedCard(parent,'dm-icon '+cls),time);directedImage(p,key);return p;}
function directedCaptions(parent,scene,d){
 const root=el('div','dm-caption dm-caption-'+scene.size,parent);root.dataset.captionMode=String(d.captionMode);root.classList.add('dm-caption-style-'+d.captionMode);root.setAttribute('aria-label',scene.name);if(scene.kind==='foodtitle'){directedImage(root,'foodsnap-wordmark','dm-food-wordmark');return time=>{const q=eo(clamp((time-scene.start)/.2));root.style.opacity=q;root.style.transform=`translateY(${(1-q)*(d.slide==='up'?25:-25)}px)`}}
 const special={wiretitle:'Then, Wireframer.',foodtitle:'FoodSnap',artitle:'And the AR menu viewer',need:'Need a product built?',message:'Message me.',comment:'Comment “Full Guide.”',follow:'Follow Thynk.'};
 let phrases=[];
 if(special[scene.kind]){const start=scene.kind==='wiretitle'?15.16:scene.start;phrases=[{start,end:scene.end,words:special[scene.kind].split(' ').map((text,i)=>({text,start:start+i*.055,end:scene.end}))}]}
 else phrases=MASTER_TIMING.groups.map(g=>{const words=g.words.filter(w=>w.start>=scene.start-.001&&w.start<scene.end-.001);return{start:Math.max(g.start,scene.start),end:Math.min(g.end,scene.end),words}}).filter(g=>g.words.length);
 const groups=phrases.map(g=>{const box=el('div','dm-caption-group',root);box.dataset.componentStart=g.start;box.dataset.componentEnd=g.end;const words=g.words.map(w=>{const e=thynkText('span','dm-word',box,w.text+' ');e.dataset.componentStart=g.start;e.dataset.componentEnd=g.end;return e});return{g,box,words}});
 return time=>{let active=false;for(const {g,box,words} of groups){const on=time>=g.start&&time<(g.end+.001);box.style.display=on?'block':'none';if(!on)continue;active=true;const len=g.words.map(w=>w.text).join(' ').length;root.style.setProperty('--caption-size',(scene.size==='title'?(len>22?65:78):scene.size==='big'?(len>25?58:72):scene.size==='small'?31:len>35?40:46)+'px');words.forEach((e,i)=>{const w=g.words[i],p=clamp((time-w.start)/(.23+(d.captionMode%3)*.025)),style=captionMotion(d.captionMode,p,i);e.style.opacity=time>=w.start?style.opacity:0;e.style.transform=style.transform;e.style.filter=style.filter;e.style.clipPath=style.clipPath;e.style.letterSpacing=style.letterSpacing;e.style.transformOrigin=style.transformOrigin;e.classList.toggle('dm-spoken',time>=w.start&&time<w.end);});}root.style.opacity=active?1:0};
}
function directedLayout(layout,i,time=0){
 const grid=[[158,180],[442,180],[158,464],[442,464]],a=i/4*Math.PI*2-Math.PI/2;let [x,y]=grid[i],r=0,s=1;
 switch(layout){
 case'orbit':x=300+Math.cos(a)*190;y=320+Math.sin(a)*205;s=.87;r=Math.sin(time*.6+i)*2;break;
 case'column':x=i%2?390:210;y=100+i*150;s=.7;break;
 case'shelf':x=i%2?440:160;y=i<2?205:465;r=i%2?3:-3;s=.92;break;
 case'cross':x=300+Math.cos(a)*185;y=325+Math.sin(a)*200;s=.78;break;
 case'hero':x=[300,100,300,500][i];y=[170,450,490,450][i];s=i?.72:1.12;break;
 case'pairs':x=i<2?155:445;y=(i%2)*300+170;s=.91;r=i<2?-4:4;break;
 case'cascade':x=180+i*82;y=140+i*135;r=-8+i*5;s=.83;break;
 case'carousel':x=300+Math.sin(a+.5)*195;y=315+Math.cos(a+.5)*180;s=.8+Math.cos(a+.5)*.12;r=Math.sin(a+.5)*-9;break;
 case'diagonal':x=125+i*115;y=125+i*135;s=.73;r=-5;break;
 case'gallery':x=i%2?435:165;y=i<2?145:465;s=.95;break;
 case'bento':x=[165,440,180,445][i];y=[170,155,465,440][i];s=[1.08,.8,.85,1.03][i];break;
 case'path':x=[140,450,140,450][i];y=105+i*145;s=.65;break;
 case'arc':x=300+Math.cos(Math.PI+i/3*Math.PI)*220;y=440+Math.sin(Math.PI+i/3*Math.PI)*270;s=.83;r=(i-1.5)*4;break;
 case'layers':x=180+i*80;y=140+i*130;r=-12+i*8;s=.86;break;
 case'focus':s=.88+.045*Math.sin(time*1.1-i);break;
 case'wave':x=120+i*120;y=300+Math.sin(i*1.4)*170;s=.73;r=Math.sin(i)*7;break;
 case'diamond':x=300+Math.cos(a+.8)*195;y=320+Math.sin(a+.8)*210;s=.82;r=0;break;
 case'offset':x=i%2?430:170;y=(i<2?165:455)+(i%2?60:-20);s=.94;break;
 case'assembly':x=i%2?430:170;y=i<2?190:450;s=1;break;
 }return{x,y,r,s};
}
function directedGraphic(board,scene,d){
 const nodes=[],updates=[],add=(e,time)=>{directedEntry(e,time);nodes.push(e);return e},icon=(key,time,cls='')=>{const e=directedIcon(board,key,time,cls);nodes.push(e);return e};
 const image=(key,cls,time)=>add(directedImage(board,key,cls),time),text=(p,s,c)=>directedText(p,s,c);
 let figure=null;
 if(scene.kind==='intro'){
  const icons=['clipflow','wireframer','foodsnap','ar'];icons.forEach((key,i)=>{const p=icon(key,[.1,.54,1.32,1.62][i],'dm-product');p.dataset.product=key;const pos=directedLayout(d.layout,i);p.style.cssText=`left:${pos.x}px;top:${pos.y}px;--rotation:${pos.r}deg;--item-scale:${pos.s}`;updates.push(local=>{const at=directedLayout(d.layout,i,local);p.style.setProperty('--float-y',Math.sin(local*.75+i)*3+'px');p.style.setProperty('--rotation',at.r+'deg');p.style.setProperty('--item-scale',at.s)})});
 }else if(scene.kind==='mockups'||scene.kind==='smarter'){
  if(scene.kind==='mockups'&&ASSET.directed?.mockups)image('mockups','dm-hero-asset',scene.start+.05);else if(scene.kind==='smarter')image('smarter','dm-hero-asset',scene.start+.05);else{for(let i=0;i<3;i++){const shell=add(directedCard(board,'dm-mockup'),scene.start+i*.07);shell.style.cssText=`left:${90+i*105}px;top:${170+i*55}px;rotate:${(i-1)*8}deg`;el('div','dm-screen-lines',shell);}}
  if(scene.kind==='smarter')figure={kind:'relay',className:'dm-smarter-figure'};
 }else if(scene.kind==='clip'||scene.kind==='captions'){
  const p=add(directedCard(board,'dm-clip-panel directed-media'),scene.start+.15);p.dataset.assetVideoSlot='true';
  const wave=el('div','dm-wave',p);const bars=Array.from({length:42},(_,i)=>{const bar=el('i','',wave);bar.style.height=(25+Math.abs(Math.sin(i*2.23))*70)+'%';return bar});const scan=el('i','dm-wave-scan',wave);
  const tiles=el('div','dm-clips',board);for(let i=0;i<3;i++){const c=add(directedCard(tiles,'dm-clip'),scene.kind==='clip'?9.28+i*.16:scene.start+.15+i*.1);const crop=el('div','dm-clip-art',c);directedImage(crop,['clipflow-montage','clipflow-editor-poster','caption-demo-poster'][i]);text(c,['00:12','01:24','03:08'][i],'dm-time');}
  updates.push((local,time)=>{scan.style.left=(eo(clamp((time-7.94)/1.5))*92)+'%';bars.forEach((b,i)=>b.style.transform=`scaleY(${.7+.3*Math.sin(local*3+i*.5)**2})`)});
  if(scene.kind==='captions'){text(p,'animated captions','dm-mini-caption');figure={kind:'slow',className:'dm-caption-figure'}}
 }else if(scene.kind==='social'){
  const core=icon('clipflow',scene.start+.05,'dm-flow-source');const ig=icon('instagram',13.38,'dm-instagram'),yt=icon('youtube',14.04,'dm-youtube');
  const flow=add(el('div','dm-flow',board),12.6);flow.innerHTML='<svg viewBox="0 0 600 650"><path d="M300 185V280Q300 325 200 325H160V390M300 280Q300 325 400 325H440V390" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" pathLength="1"/></svg>';updates.push((local,time)=>flow.style.setProperty('--draw',1-eo(clamp((time-12.6)/1))));
 }else if(scene.kind==='prompt'){
  const field=add(directedCard(board,'dm-prompt'),16.48);text(field,'Search what you can imagine','dm-hint');const mini=el('div','dm-prompt-actions',field);const pic=el('div','dm-reference',mini);pic.innerHTML='<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="9" r="2" fill="currentColor"/><path d="M4 19l6-6 4 3 4-5 4 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';const ref=el('img','dm-prompt-reference',mini);ref.src=resolveDirectedAsset('wireframe-reference');ref.alt='Reference image preview';text(mini,'↑','dm-send');
  figure={kind:'keyboard',className:'dm-prompt-figure'};
 }else if(scene.kind==='screens'){
  ['phone','tablet','desktop'].forEach((kind,i)=>{const screen=add(directedCard(board,'dm-screen dm-screen-'+kind),[20.12,20.86,21.44][i]);if(d.index%3===1){screen.style.top=([180,130,300][i])+'px';screen.style.left=([15,185,280][i])+'px';}else if(d.index%3===2){screen.style.top=([280,190,100][i])+'px';screen.style.left=([15,165,280][i])+'px';}const header=el('div','dm-screen-header',screen);directedImage(header,'wireframer');const chart=el('div','dm-screen-chart',screen);for(let k=0;k<6;k++){const b=el('i','',chart);b.style.height=(24+(k*19)%70)+'%';updates.push((local,time)=>{b.style.transform=`scaleY(${eo(clamp((time-[20.12,20.86,21.44][i])/.6))*(.97+Math.sin(local+k)*.03)})`})}el('div','dm-screen-lines',screen);});
 }else if(scene.kind==='code'){
  ['html','css','js'].forEach((key,i)=>icon(key,[22.66,23.8,24.48][i],'dm-code dm-code-'+i));
 }else if(scene.kind==='foodtitle'){
  image('foodsnap','dm-food-logo',25.7);
 }else if(scene.kind==='scan'){
  const meal=image('meal','dm-meal',26.34);const focus=add(el('div','dm-focus',board),26.94);focus.innerHTML='<i></i><i></i><i></i><i></i>';const beam=add(el('div','dm-food-beam',board),27.26);const cal=add(directedCard(board,'dm-calorie'),29.36);text(cal,'513','dm-calorie-number');text(cal,'kcal','dm-small-label');
  updates.push((local,time)=>{beam.style.top=(200+eo(clamp((time-27.26)/1.8))*240)+'px';beam.style.opacity=time<29.36?1:0;meal.style.setProperty('--float-y',Math.sin(local*1.4)*7+'px')});
 }else if(scene.kind==='tracking'){
  if(ASSET.directed?.calories)image('calories','dm-calories-upload',30.88);const p=add(directedCard(board,'dm-tracking'),30.88),ring=el('div','dm-ring',p);text(ring,'1356','dm-ring-number');text(ring,'Calories left','dm-small-label');
  const macro=el('div','dm-macros',p);[['136g','Protein'],['115g','Carbs'],['37g','Fat']].forEach(([n,label],i)=>{const c=directedCard(macro,'dm-macro');text(c,n,'dm-macro-number');text(c,label,'dm-small-label')});
  const chart=el('div','dm-tracking-chart',p);for(let i=0;i<7;i++){const bar=el('i','',chart);bar.style.height=(25+i*9)+'%';updates.push((local,time)=>bar.style.transform=`scaleY(${eo(clamp((time-31.72-i*.09)/.6))})`)}const ref=el('img','dm-tracking-reference',p);ref.src=resolveDirectedAsset('nutrition-reference');ref.alt='Nutrition reference artwork';
  const check=add(directedCard(board,'dm-subscription'),33.0);text(check,'✓','dm-check');text(check,'Subscriptions','dm-small-label');updates.push((local,time)=>ring.style.setProperty('--progress',eo(clamp((time-30.88)/1.1))*282+'deg'));
 }else if(scene.kind==='ar'){
  const view=add(directedCard(board,'dm-ar-view'),36.26);directedImage(view,ASSET.directed?.table?'table':'meal');const target=el('div','dm-ar-reticle',view);target.innerHTML='<i></i><i></i><i></i><i></i>';const camera=el('div','dm-camera-icon',view);camera.innerHTML='<svg viewBox="0 0 40 32"><path d="M5 7h8l3-4h9l3 4h7v21H5z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="17" r="6" fill="none" stroke="currentColor" stroke-width="3"/></svg>';const plane=add(el('div','dm-table-plane',board),37.72);const projection=add(el('div','dm-projection',board),37.36);projection.innerHTML='<svg viewBox="0 0 600 650"><path d="M145 420Q140 515 385 505" pathLength="1"/><circle cx="385" cy="505" r="40"/></svg>';updates.push((local,time)=>{projection.style.setProperty('--project',1-eo(clamp((time-37.36)/1.1)));target.style.opacity=.4+.6*Math.sin(local*2)**2});const dish=image('meal','dm-ar-dish',38.78);updates.push((local,time)=>{dish.style.setProperty('--float-y',-40*eo(clamp((time-38.78)/.8))+Math.sin(local*1.8)*5+'px');dish.style.setProperty('--rotation',Math.sin(local*.8)*4+'deg')});
  figure={kind:'phone',className:'dm-ar-figure'};
 }else if(scene.kind==='stack'){
  ['flutter','next','node','ai'].forEach((key,i)=>{const p=icon(key,[41.46,42.08,43.1,43.82][i],'dm-stack-icon');const pos=directedLayout(d.layout,i);p.style.left=pos.x+'px';p.style.top=pos.y+'px';p.style.setProperty('--item-scale',pos.s*.9)});
 }else if(scene.kind==='ship'){
  figure={kind:d.figure,className:'dm-ship-figure'};
 }else if(scene.kind==='message'){
  image('message','dm-message-icon',47.8);
 }else if(scene.kind==='guide'){
  figure={kind:'exploded',className:'dm-guide-figure'};
 }else if(scene.kind==='comment'){
  // The caption is the complete call-to-action. No extra copy or ornament.
 }
 return{nodes,updates,figure};
}
let directedFigures=[];
function buildThynkVideo(d){
 directedFigures.forEach(f=>f.destroy());directedFigures=[];
 Object.values(window.__timelines||{}).forEach(tl=>tl.kill());window.__timelines={};
 const tl=gsap.timeline({paused:true});
 DIRECTED_SCENES.forEach((scene,j)=>{
  const o=layer(scene.start,Math.min(T+.001,scene.end+.22),{fi:0,fo:0,cls:'directed-scene'});o.e.dataset.kind=scene.kind;o.e.dataset.direction=d.index;o.e.dataset.transitionMode=String(d.transitionMode);
  const invert=(d.index%4===1&&j%3===0)||(d.index%4===2&&j%4===1)||(d.index%4===3&&j%2===0);o.e.classList.toggle('dm-violet',invert);o.e.style.setProperty('--dm-paper',invert?'#7b2df4':'#ffffff');o.e.style.setProperty('--dm-ink',invert?'#ffffff':'#7b2df4');o.e.style.setProperty('--dm-pink','#f3a4e8');
  const canvas=el('div','dm-canvas',o.e);const ratio=FORMATS[FMT].w/FORMATS[FMT].h;canvas.dataset.orientation=ratio>=1.1?'wide':ratio>=.9?'square':'portrait';canvas.dataset.layout=d.layout;canvas.dataset.motionMode=String(d.motionMode);canvas.dataset.captionMode=String(d.captionMode);canvas.dataset.transitionMode=String(d.transitionMode);
  const capUpdate=directedCaptions(canvas,scene,d);const art=el('div','dm-art',canvas),board=el('div','dm-board',art);if(scene.size==='title')canvas.classList.add('dm-title-scene');if(scene.kind==='foodtitle'||scene.kind==='message')canvas.classList.add('dm-title-with-icon');
  const product=directedGraphic(board,scene,d);
  if(scene.kind==='intro'||scene.kind==='stack')canvas.classList.add('dm-quartet');
  let figure=null;
  if(product.figure){const host=el('div','dm-hairline '+product.figure.className,board);figure=HairlineMotion.create(host,product.figure.kind,{seed:d.index+1,plate:invert?'#a36cf7':'#f6eeff',highlight:invert?'#ffffff':'#7b2df4',edge:invert?'#ffffff':'#7b2df4',mid:invert?'#ccb0ff':'#c3a4ef',low:invert?'#9961ed':'#e8d9fb',stroke:1.2,intensity:.7});directedFigures.push(figure);product.nodes.push(directedEntry(host,scene.start+.1));}
  product.nodes.forEach(node=>node.classList.add('dm-motion-node'));
  for(const [i,node] of product.nodes.entries()){
   const at=+node.dataset.reveal,pose=entryPose(d.motionMode,i),ease=['power3.out','back.out(1.65)','expo.out','circ.out','sine.out','elastic.out(1,.55)'][d.motionMode%6];
   tl.from(node,{opacity:0,x:pose.x,y:pose.y,scale:pose.scale,rotation:pose.rotation,duration:.34+(d.motionMode%4)*.075,ease,immediateRender:true},at);
  }
  o.fn=(local,time)=>{capUpdate(time);const q=eo(clamp(local/(.3+(d.transitionMode%4)*.07)));o.e.style.clipPath=j?transitionClip(d.transitionMode,q,d.slide):'none';product.nodes.forEach((node,i)=>{const drift=motionDrift(d.motionMode,i,local);node.style.setProperty('--motion-x',drift.x.toFixed(2)+'px');node.style.setProperty('--motion-y',drift.y.toFixed(2)+'px')});product.updates.forEach(fn=>fn(local,time));figure?.seek(Math.max(0,Math.min(local,scene.end-scene.start)))};
 });
 window.__timelines[d.id]=tl;window.__productionTimeline=tl;ensureMasterNarration();
}
fitThynkBoards=function(){
 for(const c of card.querySelectorAll('.dm-canvas')){
  const wide=c.dataset.orientation==='wide',square=c.dataset.orientation==='square',w=wide?1280:square?900:720,h=wide?720:square?900:1280,s=Math.min(card.clientWidth/w,card.clientHeight/h);
  c.style.transform=`translate(-50%,-50%) scale(${s})`;
  const art=c.querySelector('.dm-art'),board=art.firstElementChild,scale=Math.min(art.clientWidth/600,art.clientHeight/board.offsetHeight);board.style.transform=`scale(${scale})`;
 }
};
