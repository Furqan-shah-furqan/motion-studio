/* Bundled reference library: source files are kept in assets/reference-library/. */
function referenceCategoryLabel(value){return String(value||'').replace(/^\d+_/,'').replaceAll('_',' ')}
function referenceDefaultSlot(item){
 const c=item.category||'';
 if(c.includes('ClipFlow'))return item.title.toLowerCase().includes('caption')?'caption-demo-poster':item.kind==='video'?'clipflow-editor-poster':'clipflow-montage';
 if(c.includes('Wireframer'))return item.title.toLowerCase().includes('prompt')?'wireframe-reference':'mockups';
 if(c.includes('FoodSnap'))return /progress|nutrition|calorie|dashboard|health/i.test(item.title)?'nutrition-reference':'meal';
 if(c.includes('AR_Menu'))return /table|phone|ar/i.test(item.title)?'table':'ar-food-reference';
 if(c.includes('Tech_Stack'))return 'ai-neural-poster';
 if(c.includes('Call_To_Action'))return item.title.toLowerCase().includes('message')?'message':'motion-typography-poster';
 if(c.includes('Transitions'))return 'smarter';
 return 'smarter';
}
function referenceSlotOptions(){
 const extras=[['clipflow-montage','ClipFlow montage reference'],['clipflow-editor-poster','Video editor reference frame'],['caption-demo-poster','Caption animation reference frame'],['wireframe-reference','Wireframer prompt reference'],['nutrition-reference','Nutrition chart reference'],['food-scan-reference','Food scan reference'],['ar-food-reference','AR food reference'],['ai-neural-poster','AI neural motion poster'],['motion-typography-poster','Motion typography poster']];
 const base=typeof DIRECTED_ASSET_SLOTS!=='undefined'?DIRECTED_ASSET_SLOTS:[];
 const all=[...base,...extras];const seen=new Set();return all.filter(([key])=>!seen.has(key)&&seen.add(key));
}
function mkReferenceLibrary(pane){
 if(!pane)return;
 pane.innerHTML='<div class="ref-library"><div class="ref-intro"><div><strong>Thynk Reference Library</strong><p>Browse the bundled reference assets. Assign an image or a generated video/GIF poster to a visual slot in the selected film. Original media remains in the library; for actual video layers, use Add all assets.</p></div><span class="ref-count" id="ref-total"></span></div><div class="ref-filters"><label class="f">Search references<input id="ref-search" type="search" placeholder="Search food, UI, AI, transitions…" autocomplete="off"></label><label class="f">Category<select id="ref-category"><option value="all">All categories</option></select></label><label class="f">Media type<select id="ref-kind"><option value="all">All media</option><option value="image">Images</option><option value="video">Videos</option><option value="animation">Animated GIFs</option></select></label><label class="f">Use as visual slot<select id="ref-slot"></select></label></div><div class="ref-action-row"><button class="btn" type="button" id="ref-default-slot">Suggest slot for category</button><span class="hint" id="ref-status" role="status" aria-live="polite">Select a reference to apply it to the current film.</span></div><div class="ref-grid" id="ref-grid"></div><div class="ref-more-row"><button class="btn" type="button" id="ref-more" hidden>Show more references</button></div></div>';
 const search=pane.querySelector('#ref-search'),category=pane.querySelector('#ref-category'),kind=pane.querySelector('#ref-kind'),slot=pane.querySelector('#ref-slot'),grid=pane.querySelector('#ref-grid'),status=pane.querySelector('#ref-status'),more=pane.querySelector('#ref-more');
 const slotOptions=referenceSlotOptions();for(const [key,label] of slotOptions){const option=document.createElement('option');option.value=key;option.textContent=label;slot.appendChild(option)}slot.value='clipflow-montage';
 const categories=[...new Set(REFERENCE_LIBRARY.map(a=>a.category))];for(const value of categories){const option=document.createElement('option');option.value=value;option.textContent=referenceCategoryLabel(value);category.appendChild(option)}
 pane.querySelector('#ref-total').textContent=REFERENCE_LIBRARY.length+' assets';
 let limit=36,activeItem=null;
 function draw(){
  grid.replaceChildren();const q=search.value.trim().toLowerCase();const selectedCategory=category.value,selectedKind=kind.value;
  const items=REFERENCE_LIBRARY.filter(item=>(selectedCategory==='all'||item.category===selectedCategory)&&(selectedKind==='all'||item.kind===selectedKind)&&(!q||`${item.title} ${item.category} ${item.path} ${item.kind}`.toLowerCase().includes(q)));
  items.slice(0,limit).forEach(item=>{
   const card=document.createElement('article');card.className='ref-card';card.dataset.kind=item.kind;
   const media=document.createElement('div');media.className='ref-media';const img=document.createElement('img');img.src=item.thumbnail||item.path;img.alt=item.title;img.loading='lazy';img.decoding='async';media.appendChild(img);
   const badge=document.createElement('span');badge.className='ref-kind-badge';badge.textContent=item.kind==='video'?'VIDEO':item.kind==='animation'?'GIF':'IMAGE';media.appendChild(badge);card.appendChild(media);
   const body=document.createElement('div');body.className='ref-card-body';const title=document.createElement('strong');title.textContent=item.title;title.title=item.title;body.appendChild(title);const cat=document.createElement('span');cat.className='ref-card-category';cat.textContent=referenceCategoryLabel(item.category);body.appendChild(cat);
   const note=document.createElement('p');note.textContent=item.kind==='video'?'Poster preview · original video included':item.kind==='animation'?'Static poster · original GIF included':'Bundled reference image';body.appendChild(note);
   const use=document.createElement('button');use.type='button';use.className='btn pri ref-use';use.textContent='Use in selected film';use.onclick=()=>applyReferenceLibraryAsset(item,slot.value,status);body.appendChild(use);
   const preview=document.createElement('button');preview.type='button';preview.className='ref-open';preview.textContent='Open original';preview.onclick=()=>openReferenceOriginal(item,status);body.appendChild(preview);
   card.appendChild(body);grid.appendChild(card);
  });
  if(!items.length){const empty=document.createElement('p');empty.className='hint';empty.textContent='No references match these filters.';grid.appendChild(empty)}
  more.hidden=items.length<=limit;more.textContent=`Show ${Math.min(24,items.length-limit)} more of ${items.length} results`;
  pane.querySelector('#ref-total').textContent=items.length+' of '+REFERENCE_LIBRARY.length+' assets';
 }
 search.addEventListener('input',()=>{limit=36;draw()});category.addEventListener('change',()=>{limit=36;const item=REFERENCE_LIBRARY.find(a=>a.category===category.value);if(item)slot.value=referenceDefaultSlot(item);draw()});kind.addEventListener('change',()=>{limit=36;draw()});more.addEventListener('click',()=>{limit+=24;draw()});pane.querySelector('#ref-default-slot').onclick=()=>{const item=REFERENCE_LIBRARY.find(a=>category.value==='all'||a.category===category.value);if(item){slot.value=referenceDefaultSlot(item);status.textContent='Suggested slot: '+(slotOptions.find(o=>o[0]===slot.value)?.[1]||slot.value)}};
 draw();
}
async function applyReferenceLibraryAsset(item,slot,status){
 try{
  const url=item.kind==='image'?item.path:item.thumbnail||item.path;
  ASSET.directed=ASSET.directed||{};ASSET.directed[slot]=url;
  build();render();touch();
  const id=ACTIVE_TEMPLATE;await studioStore('put','project:'+id,snapshot(true));
  status.textContent='Applied “'+item.title+'” to '+(referenceSlotOptions().find(s=>s[0]===slot)?.[1]||slot)+' for '+(TEMPLATE_CATALOG.find(d=>d.id===id)?.name||'the selected film')+'.';
  toast('Reference asset applied');
 }catch(error){status.textContent='Could not save this asset: '+error.message}
}
function openReferenceOriginal(item,status){
 const url=item.path;
 try{const tab=window.open(url,'_blank','noopener');if(!tab)status.textContent='Pop-up blocked. Original file: '+url;else status.textContent='Opened original reference: '+item.title}
 catch(error){status.textContent='Original file path: '+url}
}
