/* Component edits are additive to the original scene engine. All animation uses t. */
const FRAME_DEFAULTS={outerHeight:120,middleWidth:120,middleHeight:120,innerWidth:130,innerHeight:130};
const FRAMES={...FRAME_DEFAULTS};
const OBJECTS={edits:Object.create(null),nodes:new Map(),base:new WeakMap(),metrics:new Map(),selected:null,enabled:false,transport:true,undo:[],redo:[],listScene:-1};
const OBJECT_ANIMATIONS=['original','fade','rise','slide-left','slide-right','zoom','turn','blur','wipe','float','pulse','shake'];
const objectNumber=(v,min,max,fallback=0)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
function cleanObjectEdit(raw){if(!raw||typeof raw!=='object')return{};const o={};
  if(raw.freezeBase===true&&raw.frozen&&typeof raw.frozen==='object'){o.freezeBase=true;o.frozen={};for(const k of ['a','b','c','d','tx','ty','left','top','opacity'])o.frozen[k]=objectNumber(raw.frozen[k],-100000,100000,k==='a'||k==='d'?1:0)}
  for(const k of ['x','y','width','height','radius','rotation','opacity','fontSize','delay','duration','distance'])if(raw[k]!=null&&raw[k]!==''){
    const ranges={x:[-10000,10000],y:[-10000,10000],width:[2,10000],height:[2,10000],radius:[0,5000],rotation:[-3600,3600],opacity:[0,1],fontSize:[1,2000],delay:[0,T],duration:[.05,T],distance:[0,2000]};o[k]=objectNumber(raw[k],...ranges[k]);}
  for(const k of ['name','text'])if(typeof raw[k]==='string')o[k]=raw[k].slice(0,k==='name'?100:5000);
  if(typeof raw.fill==='string'&&/^#[\da-f]{6}$/i.test(raw.fill))o.fill=raw.fill;
  if(typeof raw.image==='string'&&raw.image.length<18000000&&/^data:image\/(?:png|jpeg|jpg|gif|webp|avif|svg\+xml);base64,[a-z\d+/=\s]+$/i.test(raw.image))o.image=raw.image;
  if(OBJECT_ANIMATIONS.includes(raw.animation))o.animation=raw.animation;
  if(['linear','smooth','spring','expo'].includes(raw.easing))o.easing=raw.easing;
  return o;
}
function componentSnapshot(withImages){const out=Object.create(null);for(const [id,edit] of Object.entries(OBJECTS.edits)){out[id]={...edit};if(!withImages)delete out[id].image}return out}
function loadComponentState(s){restoreObjectPresentation();OBJECTS.edits=Object.create(null);OBJECTS.undo=[];OBJECTS.redo=[];OBJECTS.selected=null;OBJECTS.metrics.clear();Object.assign(FRAMES,FRAME_DEFAULTS);OBJECTS.transport=true;if(s.components&&typeof s.components==='object'){Object.entries(s.components).slice(0,2000).forEach(([id,e])=>{if(id.length<600)OBJECTS.edits[id]=cleanObjectEdit(e)})}
  if(s.frames&&typeof s.frames==='object')for(const k of Object.keys(FRAME_DEFAULTS))if(s.frames[k]!=null)FRAMES[k]=objectNumber(s.frames[k],0,600,FRAME_DEFAULTS[k]);
  if(typeof s.transportShown==='boolean')OBJECTS.transport=s.transportShown;
}
function copyObjectState(){return{edits:Object.fromEntries(Object.entries(OBJECTS.edits).map(([k,v])=>[k,{...v}])),frames:{...FRAMES}}}
function rememberObjectState(before){OBJECTS.undo.push(before||copyObjectState());if(OBJECTS.undo.length>40)OBJECTS.undo.shift();OBJECTS.redo=[];syncObjectHistory()}
function syncObjectHistory(){const u=$('#object-undo'),r=$('#object-redo');if(u)u.disabled=!OBJECTS.undo.length;if(r)r.disabled=!OBJECTS.redo.length}
function restoreObjectState(s){restoreObjectPresentation();OBJECTS.edits=Object.assign(Object.create(null),s.edits);Object.assign(FRAMES,s.frames);fitStage();build();render();refreshObjectPanel();touch()}
function undoObjectEdit(redo=false){const from=redo?OBJECTS.redo:OBJECTS.undo,to=redo?OBJECTS.undo:OBJECTS.redo;if(!from.length)return;to.push(copyObjectState());restoreObjectState(from.pop());syncObjectHistory()}
function objectUnits(px,node){const F=FORMATS[FMT]||FORMATS.original;if(node===stage)return(px/F.w*(+stage.dataset.fitWidth||parseFloat(stage.style.width)||stage.clientWidth))+'px';return (px/F.w*100)+'cqw'}
const OBJECT_STYLE_KEYS=['translate','rotate','scale','width','height','borderRadius','fontSize','backgroundColor','backgroundImage','left','top','transform','opacity'];
function restoreObjectPresentation(){for(const [id,e] of OBJECTS.nodes){if(!OBJECTS.edits[id])continue;const base=OBJECTS.base.get(e);if(!base)continue;for(const k of OBJECT_STYLE_KEYS)e.style[k]=base.props[k]||'';if(base.text!=null)e.textContent=base.text;e.classList.remove('object-image','object-effect');for(const k of ['--object-alpha','--object-filter','--object-clip'])e.style.removeProperty(k)}}
function objectLabel(e){const edit=OBJECTS.edits[e.dataset.editId];if(edit&&edit.name)return edit.name;const klass=[...e.classList].find(k=>!['L','object-image','object-effect'].includes(k));
  const text=!e.children.length?e.textContent.trim().slice(0,28):'';return (klass||e.tagName.toLowerCase())+(text?' · '+text:'')}
function objectPath(e,root){const parts=[];while(e&&e!==root){const tag=e.tagName.toLowerCase(),cl=[...e.classList].filter(k=>!k.startsWith('object-')).sort().join('.');const peers=[...e.parentElement.children].filter(n=>n.tagName===e.tagName&&[...n.classList].filter(k=>!k.startsWith('object-')).sort().join('.')===cl);parts.unshift(tag+(cl?'.'+cl:'')+':'+peers.indexOf(e));e=e.parentElement}return parts.join('/')}
function registerEditableComponents(){
  OBJECTS.nodes.clear();const roots=[{e:stage,id:'stage',a:0,b:T},{e:card,id:'canvas',a:0,b:T}];
  for(const [i,l] of layers.entries()){l.e.dataset.layerIndex=String(i);roots.push({e:l.e,id:'scene-'+i,a:l.a,b:l.b})}
  const register=(e,id,a,b)=>{e.dataset.editId=id;e.dataset.editStart=String(a);e.dataset.editEnd=String(b);OBJECTS.nodes.set(id,e);if(!OBJECTS.base.has(e))OBJECTS.base.set(e,{props:Object.fromEntries(OBJECT_STYLE_KEYS.map(k=>[k,e.style[k]||''])),text:!e.children.length?e.textContent:null})};
  roots.forEach(({e,id,a,b})=>{register(e,id,a,b);if(id.startsWith('scene-'))for(const child of e.querySelectorAll('*')){
    if(child.closest('svg')&&child.tagName.toLowerCase()!=='svg')continue;
    if(['defs','lineargradient','stop','path','circle','textpath','rect','g','br','s'].includes(child.tagName.toLowerCase()))continue;
    register(child,id+'/'+objectPath(child,e),child.dataset.componentStart==null?a:+child.dataset.componentStart,child.dataset.componentEnd==null?b:+child.dataset.componentEnd);
  }});
  for(const e of stage.querySelectorAll(':scope > .studio,:scope > .nav,:scope > .nav > .pill,:scope > .ruler'))register(e,'chrome/'+objectPath(e,stage),0,T);
  OBJECTS.listScene=-1;fitStage();refreshObjectList();
}
function applyFrameSizing(){document.documentElement.style.setProperty('--outer-extra',FRAMES.outerHeight+'px');const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  // Grow relative to the original frame anatomy, then keep the inner frame centered.
  const bw=Math.max(24,w-(+stage.dataset.middleExtraX||0)),bh=Math.max(24,h-(+stage.dataset.middleExtraY||0)),narrow=FMT==='phone'||FMT==='tablet';
  card.style.left='50%';card.style.top='50%';card.style.right='auto';card.style.bottom='auto';card.style.transform='translate(-50%,-50%)';
  card.style.width=Math.min(w-12,Math.max(20,bw*(narrow?.9:.956)+FRAMES.innerWidth))+'px';
  card.style.height=Math.min(h-12,Math.max(20,bh-bw*(narrow?.34:.176)+FRAMES.innerHeight))+'px';
}
function objectMotion(time,edit,start=0){const animation=edit.animation||'original',delay=edit.delay||0,duration=edit.duration||.7,amount=edit.distance==null?80:edit.distance;
  const progress=clamp((time-start-delay)/duration),ease=edit.easing||'smooth';let q=progress;
  if(ease==='smooth')q=eo(q);else if(ease==='expo')q=q===1?1:1-Math.pow(2,-10*q);else if(ease==='spring')q=eb(q);
  const k=1-q,out={x:0,y:0,scale:1,rotation:0,alpha:1,blur:0,clip:0};
  if(animation==='original')return out;
  if(['fade','rise','slide-left','slide-right','zoom','turn','blur','wipe'].includes(animation))out.alpha=progress;
  if(animation==='rise')out.y=amount*k;
  if(animation==='slide-left')out.x=-amount*k;
  if(animation==='slide-right')out.x=amount*k;
  if(animation==='zoom')out.scale=.7+.3*q;
  if(animation==='turn'){out.rotation=-35*k;out.scale=.9+.1*q}
  if(animation==='blur'){out.blur=16*k;out.y=amount*.2*k}
  if(animation==='wipe')out.clip=100*(1-progress);
  const elapsed=Math.max(0,time-start-delay);
  if(animation==='float')out.y=Math.sin(elapsed/duration*Math.PI*2)*amount*.15;
  if(animation==='pulse')out.scale=1+Math.sin(elapsed/duration*Math.PI*2)*.08;
  if(animation==='shake')out.x=Math.sin(elapsed/duration*Math.PI*12)*amount*.1*(1-progress);
  return out;
}
function applyComponentEdits(){
  for(const [id,edit] of Object.entries(OBJECTS.edits)){const e=OBJECTS.nodes.get(id);if(!e)continue;const fx=objectMotion(t,edit,+e.dataset.editStart||0),units=v=>objectUnits(v,e);
    if(edit.freezeBase&&edit.frozen){const f=edit.frozen;e.style.transform='translate('+units(f.tx)+','+units(f.ty)+') matrix('+[f.a,f.b,f.c,f.d,0,0].join(',')+')';e.style.left=units(f.left);e.style.top=units(f.top);e.style.opacity=String(clamp(f.opacity))}
    e.style.translate=units((edit.x||0)+fx.x)+' '+units((edit.y||0)+fx.y);e.style.rotate=((edit.rotation||0)+fx.rotation)+'deg';e.style.scale=String(fx.scale);
    if(edit.width!=null)e.style.width=units(edit.width);if(edit.height!=null)e.style.height=units(edit.height);
    if(edit.radius!=null)e.style.borderRadius=units(edit.radius);if(edit.fontSize!=null)e.style.fontSize=units(edit.fontSize);if(edit.fill)e.style.backgroundColor=edit.fill;if(e===stage)applyFrameSizing();
    if(edit.text!=null&&!e.children.length)e.textContent=edit.text;
    if(edit.image){e.classList.add('object-image');e.style.backgroundImage='url('+JSON.stringify(edit.image)+')';if(e.tagName==='IMG')e.src=edit.image}
    e.classList.remove('object-effect');const native=getComputedStyle(e);
    const alpha=objectNumber(native.opacity,0,1,1)*(edit.opacity==null?1:edit.opacity)*fx.alpha;
    const nativeFilter=native.filter&&native.filter!=='none'?native.filter+' ':'';
    e.style.setProperty('--object-alpha',String(alpha));e.style.setProperty('--object-filter',fx.blur?nativeFilter+'blur('+fx.blur.toFixed(2)+'px)':nativeFilter||'none');
    e.style.setProperty('--object-clip',fx.clip?'inset(0 '+fx.clip+'% 0 0)':native.clipPath||'none');e.classList.add('object-effect');
  }
  syncSelectionBox();
  if(OBJECTS.listScene!==curScene){OBJECTS.listScene=curScene;refreshObjectList()}
}
function setObjectMode(on){OBJECTS.enabled=!!on;if(on&&playing)pause();document.body.classList.toggle('object-edit',!!on);const b=$('#object-mode');if(b)b.setAttribute('aria-pressed',on?'true':'false');if(!on)$('#selection-box').hidden=true;else syncSelectionBox()}
function setTransportShown(on){OBJECTS.transport=!!on;document.body.classList.toggle('transport-hidden',!on);const ck=$('#show-transport');if(ck)ck.checked=!!on;requestAnimationFrame(()=>{fitStage();render()})}
function selectObject(id,openPanel=true){if(!OBJECTS.nodes.has(id))return;OBJECTS.selected=id;setObjectMode(true);if(openPanel){selectTabByLabel('Components');if(document.body.classList.contains('narrow-ui'))toast('Selected. Open Edit to change its properties.')}refreshObjectPanel();syncSelectionBox()}
function syncSelectionBox(){const box=$('#selection-box');if(!box)return;const e=OBJECTS.nodes.get(OBJECTS.selected);const l=e&&e.closest('[data-layer-index]');
  if(!OBJECTS.enabled||playing||!e||e.getClientRects().length===0||(l&&(t<+l.dataset.editStart||t>=+l.dataset.editEnd))){box.hidden=true;return}
  const r=e.getBoundingClientRect(),wr=$('#well').getBoundingClientRect();if(r.width<1||r.height<1){box.hidden=true;return}
  box.hidden=false;box.style.left=(r.left-wr.left-$('#well').clientLeft)+'px';box.style.top=(r.top-wr.top-$('#well').clientTop)+'px';box.style.width=r.width+'px';box.style.height=r.height+'px';box.querySelector('.selection-label').textContent=objectLabel(e);
}
function refreshObjectList(){const list=$('#object-list');if(!list)return;const selected=OBJECTS.selected;list.innerHTML='';let count=0;
  for(const [id,e] of OBJECTS.nodes){const start=+e.dataset.editStart,end=+e.dataset.editEnd;if(id!=='stage'&&id!=='canvas'&&(t<start||t>=end))continue;
    const o=el('option','',list);o.value=id;o.textContent=(id==='stage'?'Middle frame':id==='canvas'?'Inner frame':objectLabel(e));count++;
  }
  if([...list.options].some(o=>o.value===selected))list.value=selected;else list.selectedIndex=-1;
  const c=$('#object-count');if(c)c.textContent=count+' components in this scene';
}
function refreshObjectPanel(){const pane=paneOf('Components');if(!pane)return;const e=OBJECTS.nodes.get(OBJECTS.selected),edit=OBJECTS.edits[OBJECTS.selected]||{};pane.querySelector('#object-properties').hidden=!e;pane.querySelector('#object-empty').hidden=!!e;refreshObjectList();syncObjectHistory();for(const k of Object.keys(FRAMES)){const i=pane.querySelector('[data-frame="'+k+'"]');if(i&&i!==document.activeElement)i.value=FRAMES[k]}if(!e)return;
  const cs=getComputedStyle(e),unit=(parseFloat(stage.style.width)||stage.clientWidth||1)/(FORMATS[FMT]||FORMATS.original).w;
  if(e.getClientRects().length)OBJECTS.metrics.set(OBJECTS.selected,{width:parseFloat(cs.width)/unit,height:parseFloat(cs.height)/unit,radius:parseFloat(cs.borderTopLeftRadius)/unit,fontSize:parseFloat(cs.fontSize)/unit});
  const measured=OBJECTS.metrics.get(OBJECTS.selected)||{};
  const val=(key,def)=>edit[key]==null?def:edit[key];
  for(const [key,value] of Object.entries({name:edit.name||objectLabel(e),x:val('x',0),y:val('y',0),width:val('width',measured.width??''),height:val('height',measured.height??''),radius:val('radius',measured.radius??''),rotation:val('rotation',0),opacity:val('opacity',1),fontSize:val('fontSize',measured.fontSize??''),text:val('text',e.children.length?'':e.textContent),animation:val('animation','original'),easing:val('easing','smooth'),delay:val('delay',0),duration:val('duration',.7),distance:val('distance',80)})){
    const input=pane.querySelector('[data-property="'+key+'"]');if(input&&document.activeElement!==input)input.value=typeof value==='number'?String(Math.round(value*100)/100):value;
  }
  pane.querySelector('[data-property=text]').disabled=!!e.children.length;pane.querySelector('[data-property=fontSize]').disabled=e.tagName==='SVG';
  pane.querySelector('#object-freeze').checked=!!edit.freezeBase;
  const fill=pane.querySelector('[data-property=fill]');fill.value=edit.fill||'#ffffff';
  const drop=$('#object-drop');if(drop._image!==edit.image||!drop.children.length){drop._image=edit.image;drop.innerHTML='';if(edit.image){const img=el('img','',drop);img.src=edit.image;img.alt='Selected component image'}else{el('strong','',drop).textContent='Drop an image here';el('span','',drop).textContent='Or drop directly onto a component in the preview.'}}
  for(const k of Object.keys(FRAMES)){const i=pane.querySelector('[data-frame="'+k+'"]');if(i&&i!==document.activeElement)i.value=FRAMES[k]}
}
function updateObjectProperty(key,value){const id=OBJECTS.selected;if(!id)return;const edit=OBJECTS.edits[id]||{};restoreObjectPresentation();if(value==='')delete edit[key];else edit[key]=['name','text','animation','easing','fill'].includes(key)?value:Number(value);OBJECTS.edits[id]=cleanObjectEdit(edit);fitStage();render();touch()}
function resetSelectedObject(){if(!OBJECTS.selected)return;rememberObjectState();restoreObjectPresentation();delete OBJECTS.edits[OBJECTS.selected];build();render();refreshObjectPanel();touch()}
async function imageForObject(file,id){if(!file||!id)return;if(!file.type.startsWith('image/')){toast('Choose an image file.');return}if(file.size>12*1024*1024){toast('Use an image under 12 MB.');return}
  try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the image.'));r.readAsDataURL(file)});
    const valid=cleanObjectEdit({image:data});if(!valid.image)throw new Error('This image format is not supported. Use PNG, JPEG, WebP, GIF, AVIF or SVG.');
    rememberObjectState();OBJECTS.edits[id]={...(OBJECTS.edits[id]||{}),image:valid.image};selectObject(id);render();refreshObjectPanel();touch();toast('Image added. Include uploaded images when exporting your project.');
  }catch(err){toast(err.message||'Could not read that image.')}
}
function objectParentDelta(e,dx,dy,includeSelf=false){let m=new DOMMatrix();for(let p=includeSelf?e:e.parentElement;p&&p!==$('#well');p=p.parentElement){const cs=getComputedStyle(p);let pm=new DOMMatrix(cs.transform==='none'?undefined:cs.transform);if(cs.rotate&&cs.rotate!=='none')pm=new DOMMatrix().rotate(parseFloat(cs.rotate)||0).multiply(pm);if(cs.scale&&cs.scale!=='none'){const ss=cs.scale.split(' ').map(Number);pm=new DOMMatrix().scale(ss[0]||1,ss[1]||ss[0]||1).multiply(pm)}m=pm.multiply(m)}
  const det=m.a*m.d-m.b*m.c;if(Math.abs(det)<.00001)return{x:dx,y:dy};return{x:(m.d*dx-m.c*dy)/det,y:(-m.b*dx+m.a*dy)/det};
}
function beginObjectDrag(event,resize){if(event.button!=null&&event.button!==0)return;const target=resize?OBJECTS.nodes.get(OBJECTS.selected):pickComponent(event);if(!target||!stage.contains(target))return;
  if(!OBJECTS.enabled&&!resize)return;event.preventDefault();event.stopPropagation();const parent=event.altKey&&target.parentElement.closest('[data-edit-id]');const e=parent||target;selectObject(e.dataset.editId);const id=OBJECTS.selected,initial={...(OBJECTS.edits[id]||{})},before=copyObjectState(),cs=getComputedStyle(e),unit=stage.clientWidth/(FORMATS[FMT]||FORMATS.original).w;
  const x=event.clientX,y=event.clientY,bw=parseFloat(cs.width)/unit,bh=parseFloat(cs.height)/unit;let moved=false;
  const handle=resize||'',capture=event.currentTarget;try{capture.setPointerCapture(event.pointerId)}catch(_){}
  function move(ev){const d=objectParentDelta(e,(ev.clientX-x)/unit,(ev.clientY-y)/unit,!!handle);if(Math.abs(d.x)+Math.abs(d.y)<.1)return;moved=true;const edit={...initial};
    if(!handle){edit.x=(initial.x||0)+d.x;edit.y=(initial.y||0)+d.y}
    else{const left=handle.includes('w'),up=handle.includes('n');edit.width=Math.max(2,bw+(left?-d.x:d.x));edit.height=Math.max(2,bh+(up?-d.y:d.y));if(left)edit.x=(initial.x||0)+bw-edit.width;if(up)edit.y=(initial.y||0)+bh-edit.height}
    OBJECTS.edits[id]=cleanObjectEdit(edit);render();refreshObjectPanel();
  }
  function end(ev){capture.removeEventListener('pointermove',move);capture.removeEventListener('pointerup',end);capture.removeEventListener('pointercancel',cancel);try{capture.releasePointerCapture(event.pointerId)}catch(_){}if(moved){rememberObjectState(before);touch()}refreshObjectPanel()}
  function cancel(ev){restoreObjectPresentation();OBJECTS.edits=Object.assign(Object.create(null),before.edits);moved=false;end(ev);build();render();refreshObjectPanel()}
  capture.addEventListener('pointermove',move);capture.addEventListener('pointerup',end);capture.addEventListener('pointercancel',cancel);
}
function mkComponents(p){p.innerHTML=`<div class="component-form">
  <div class="component-section"><div class="component-row"><select id="object-list" aria-label="Select a component"></select><button class="btn" id="object-parent" type="button" title="Select parent component">Parent</button></div><p class="hint" id="object-count"></p><p class="component-empty" id="object-empty">Turn on Edit objects, then click a component in the preview or choose one above. Drag to move it; use the corner handles to resize. Alt-click selects its parent. Right-click opens all overlapping layers. A selected component stays selected when you drag it.</p></div>
  <div id="object-properties" class="component-form" hidden>
    <section class="component-section"><h3>Selected component</h3><label class="f">Name<input type="text" data-property="name" maxlength="100"></label><div class="property-grid" style="margin-top:12px">
      <label class="f">X offset<input type="number" data-property="x" step="1"></label><label class="f">Y offset<input type="number" data-property="y" step="1"></label>
      <label class="f">Width<input type="number" data-property="width" min="2" step="1"></label><label class="f">Height<input type="number" data-property="height" min="2" step="1"></label>
      <label class="f">Corner radius<input type="number" data-property="radius" min="0" step="1"></label><label class="f">Rotation (degrees)<input type="number" data-property="rotation" step="1"></label>
      <label class="f">Font size<input type="number" data-property="fontSize" min="1" step="1"></label><label class="f">Opacity (0–1)<input type="number" data-property="opacity" min="0" max="1" step="0.05"></label>
    </div><p class="hint" style="margin:8px 0">Sizes use canvas units. Movement adds to the existing animated path.</p><label class="f">Fill color<input type="color" data-property="fill"></label><label class="f" style="margin-top:12px">Leaf text<input type="text" data-property="text"><span class="hint">For grouped text, use the Script tab.</span></label></section>
    <section class="component-section"><h3>Image</h3><div class="component-drop" id="object-drop"></div><div class="component-actions" style="margin-top:8px"><button class="btn" type="button" id="object-image-pick">Choose image</button><button class="btn" type="button" id="object-image-remove">Remove image</button></div><input type="file" id="object-image-file" accept="image/*" hidden></section>
    <section class="component-section"><h3>Component animation</h3><label class="component-row" style="margin-bottom:12px"><input type="checkbox" id="object-freeze"><span>Freeze original movement at this frame</span></label><label class="f">Effect<select data-property="animation">${OBJECT_ANIMATIONS.map(a=>'<option value="'+a+'">'+a.replace(/-/g,' ')+'</option>').join('')}</select></label><div class="property-grid" style="margin-top:12px"><label class="f">Delay from scene start<input type="number" min="0" max="44.33" step="0.05" data-property="delay"></label><label class="f">Duration (seconds)<input type="number" min="0.05" max="44.33" step="0.05" data-property="duration"></label><label class="f">Travel / intensity<input type="number" min="0" max="2000" step="5" data-property="distance"></label><label class="f">Easing<select data-property="easing"><option value="smooth">Smooth</option><option value="expo">Fast ease-out</option><option value="spring">Spring</option><option value="linear">Linear</option></select></label></div><p class="hint" style="margin:8px 0">Effects follow the playhead and layer timing, including when scrubbing and recording.</p><button class="btn" type="button" id="object-preview-animation">Preview this scene</button></section>
    <button class="btn" type="button" id="object-reset">Reset selected component</button>
  </div>
  <details class="component-section"><summary>Frame sizes</summary><p class="hint" style="margin-bottom:12px">Extra display pixels around the original frame sizing. The preview fits the available workspace.</p><div class="property-grid">${[['outerHeight','Outer height +'],['middleWidth','Middle width +'],['middleHeight','Middle height +'],['innerWidth','Inner width +'],['innerHeight','Inner height +']].map(([k,label])=>'<label class="f">'+label+'<input type="number" min="0" max="600" step="10" data-frame="'+k+'" value="'+FRAMES[k]+'"></label>').join('')}</div><button class="btn" id="frame-reset" type="button" style="margin-top:12px">Restore frame additions</button></details>
  <div class="component-actions"><button class="btn" id="object-undo" type="button" disabled>Undo</button><button class="btn" id="object-redo" type="button" disabled>Redo</button><button class="btn" id="object-clear" type="button">Reset all edits</button></div>
  <p class="hint">Component images are included in project JSON when “Include uploaded images” is enabled. Audio file export behavior stays the same.</p>
</div>`;
  p.querySelector('#object-list').addEventListener('change',e=>selectObject(e.target.value,false));
  p.querySelector('#object-parent').addEventListener('click',()=>{const e=OBJECTS.nodes.get(OBJECTS.selected),parent=e&&e.parentElement.closest('[data-edit-id]');if(parent)selectObject(parent.dataset.editId,false)});
  p.querySelectorAll('[data-property]').forEach(i=>{i.addEventListener('focus',()=>i._before=copyObjectState());i.addEventListener('input',()=>updateObjectProperty(i.dataset.property,i.value));i.addEventListener('change',()=>{rememberObjectState(i._before);i._before=copyObjectState();refreshObjectPanel()})});
  $('#object-freeze').addEventListener('change',event=>{const e=OBJECTS.nodes.get(OBJECTS.selected);if(!e)return;rememberObjectState();const edit=OBJECTS.edits[OBJECTS.selected]||{};if(event.target.checked){e.classList.remove('object-effect');const cs=getComputedStyle(e),m=new DOMMatrix(cs.transform==='none'?undefined:cs.transform),unit=stage.clientWidth/(FORMATS[FMT]||FORMATS.original).w;edit.freezeBase=true;edit.frozen={a:m.a,b:m.b,c:m.c,d:m.d,tx:m.e/unit,ty:m.f/unit,left:parseFloat(cs.left)/unit||0,top:parseFloat(cs.top)/unit||0,opacity:+cs.opacity}}else{restoreObjectPresentation();delete edit.freezeBase;delete edit.frozen}OBJECTS.edits[OBJECTS.selected]=cleanObjectEdit(edit);render();refreshObjectPanel();touch()});
  p.querySelectorAll('[data-frame]').forEach(i=>{i.addEventListener('focus',()=>i._before=copyObjectState());i.addEventListener('input',()=>{FRAMES[i.dataset.frame]=objectNumber(i.value,0,600);fitStage();render();touch()});i.addEventListener('change',()=>{rememberObjectState(i._before);i._before=copyObjectState()})});
  $('#object-image-pick').addEventListener('click',()=>$('#object-image-file').click());$('#object-image-file').addEventListener('change',e=>{const id=OBJECTS.selected;imageForObject(e.target.files[0],id);e.target.value=''});
  $('#object-image-remove').addEventListener('click',()=>{const id=OBJECTS.selected;if(!id||!OBJECTS.edits[id]?.image)return;rememberObjectState();restoreObjectPresentation();delete OBJECTS.edits[id].image;build();render();refreshObjectPanel();touch()});
  $('#object-reset').addEventListener('click',resetSelectedObject);$('#object-undo').addEventListener('click',()=>undoObjectEdit());$('#object-redo').addEventListener('click',()=>undoObjectEdit(true));
  $('#frame-reset').addEventListener('click',()=>{rememberObjectState();Object.assign(FRAMES,FRAME_DEFAULTS);fitStage();render();refreshObjectPanel();touch()});
  $('#object-clear').addEventListener('click',()=>{if(!confirm('Reset all component edits? Script, audio and original scene settings will stay.'))return;rememberObjectState();restoreObjectPresentation();OBJECTS.edits=Object.create(null);build();render();refreshObjectPanel();touch()});
  $('#object-preview-animation').addEventListener('click',()=>{const e=OBJECTS.nodes.get(OBJECTS.selected);if(e){seek(+e.dataset.editStart+.01);play()}});
  const drop=$('#object-drop');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag-over')});drop.addEventListener('dragleave',()=>drop.classList.remove('drag-over'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag-over');imageForObject(e.dataTransfer.files[0],OBJECTS.selected)});
  refreshObjectPanel();refreshObjectList();
}
function initComponentEditor(){
  const bar=$('#navbar-tools');bar.appendChild($('#scene-select'));bar.appendChild($('.ctxrow'));bar.appendChild($('#pb-dd'));
  const edit=el('button','btn object-mode',bar);edit.id='object-mode';edit.type='button';edit.textContent='Edit objects';edit.setAttribute('aria-pressed','false');edit.addEventListener('click',()=>{setObjectMode(!OBJECTS.enabled);if(OBJECTS.enabled){selectTabByLabel('Components');if(document.body.classList.contains('narrow-ui'))setView('preview')}});
  const toggle=el('label','transport-switch',bar);toggle.innerHTML='<input type="checkbox" id="show-transport" checked><span class="switch-track" aria-hidden="true"></span><span>Playback controls</span>';$('#show-transport').addEventListener('change',e=>{setTransportShown(e.target.checked);touch()});
  const well=$('#well'),box=el('div','',well);box.id='selection-box';box.hidden=true;el('div','selection-label',box);
  for(const h of ['nw','ne','sw','se']){const b=el('button','resize-handle',box);b.type='button';b.dataset.handle=h;b.setAttribute('aria-label','Resize '+h+' corner');b.addEventListener('pointerdown',e=>beginObjectDrag(e,h))}
  well.addEventListener('pointerdown',e=>beginObjectDrag(e,''));stage.addEventListener('click',e=>{if(OBJECTS.enabled){e.preventDefault();e.stopImmediatePropagation()}},true);
  well.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';well.classList.add('drag-over')}});well.addEventListener('dragleave',e=>{if(!well.contains(e.relatedTarget))well.classList.remove('drag-over')});
  well.addEventListener('drop',e=>{e.preventDefault();well.classList.remove('drag-over');const target=pickComponent(e);imageForObject(e.dataTransfer.files[0],target?.dataset.editId||OBJECTS.selected)});
  document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoObjectEdit(e.shiftKey);return}
    if(e.key==='Escape'){setObjectMode(false);return}
    if(!OBJECTS.enabled||!OBJECTS.selected||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;if(e.target.closest('button,.dd-menu'))return;e.preventDefault();e.stopImmediatePropagation();rememberObjectState();const edit=OBJECTS.edits[OBJECTS.selected]||{},amount=e.shiftKey?10:1;edit.x=(edit.x||0)+(e.key==='ArrowRight'?amount:e.key==='ArrowLeft'?-amount:0);edit.y=(edit.y||0)+(e.key==='ArrowDown'?amount:e.key==='ArrowUp'?-amount:0);OBJECTS.edits[OBJECTS.selected]=edit;render();refreshObjectPanel();touch();
  },true);
  window.addEventListener('resize',syncSelectionBox);setTransportShown(OBJECTS.transport);fitStage();render();
}

