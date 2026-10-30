import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=await import(process.env.MOTION_PLAYWRIGHT_MODULE||'playwright');
const args=process.argv.slice(2),flag=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
const projectFile=flag('--project'),audioFile=flag('--audio');
const portableHtml=process.env.MOTION_PORTABLE_HTML==='1'?await fs.readFile(path.join(root,'motion-studio.html'),'utf8'):null;
const range=flag('--range'),startFrame=range?Number(range.split(':')[0]):0,endFrame=range?Number(range.split(':')[1]):1626,partial=Boolean(range);
if(!Number.isInteger(startFrame)||!Number.isInteger(endFrame)||startFrame<0||endFrame>1626||endFrame<=startFrame)throw new Error('Range must be start:end frame indices within 0:1626');
const project=projectFile?JSON.parse(await fs.readFile(path.resolve(projectFile),'utf8')):null;
if(project&&(project.canvasFormat||project.format)!=='phone')throw new Error('MP4 production is 1080×1920. Save your project with Phone format before rendering it.');
if(project&&!String(project.templateId).startsWith('thynk-'))throw new Error('The production MP4 command renders the twenty Thynk templates. Use a Thynk saved project.');
const requested=args.filter((a,i)=>!a.startsWith('--')&&!['--project','--audio','--range'].includes(args[i-1])).map(Number);
const queue=requested.length?requested:Array.from({length:20},(_,i)=>i+1);
if(project&&queue.length!==1)throw new Error('Render one saved project at a time: specify one template number.');
if(queue.some(n=>!Number.isInteger(n)||n<1||n>20))throw new Error('Template numbers must be 1–20.');
if(spawnSync('ffmpeg',['-version']).status!==0)throw new Error('Install FFmpeg on PATH before rendering.');
await fs.mkdir(path.join(root,'exports'),{recursive:true});if(partial)await fs.mkdir(path.join(root,'qa/render-segments'),{recursive:true});await fs.mkdir(path.join(root,'qa/render-frames'),{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.MOTION_CHROMIUM?{executablePath:process.env.MOTION_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
async function render(n){const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});let ff,temp;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  if(portableHtml)await page.setContent(portableHtml,{waitUntil:'load'});else await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.waitForFunction(()=>typeof window.__seek==='function');
  await page.evaluate(({n,project})=>{pause();if(project)applyState(project);else{configureTemplate(MOTION_CATALOG[n-1].id);CFG.brand='THYNK';CFG.studio='THYNK STUDIO';CFG.nav=['Intro','ClipFlow','Products','Guide'];}FMT='phone';fullReload();paintFormatUI();document.body.appendChild(card);},{n,project});
  await page.addStyleTag({content:'html,body{margin:0!important;padding:0!important;width:1080px!important;height:1920px!important;overflow:hidden!important}.shell{visibility:hidden!important}#card{visibility:visible!important;position:fixed!important;inset:0!important;left:0!important;top:0!important;transform:none!important;width:1080px!important;height:1920px!important;max-width:none!important;max-height:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;z-index:9999!important;container-type:inline-size!important}.studio,.nav,.ruler,#selection-box,.rail-tooltip{visibility:hidden!important}'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([
   ...[...document.querySelectorAll('#card img')].filter(img=>img.getAttribute('src')).map(img=>img.decode()),
   ...Object.values(OBJECTS.edits).filter(edit=>edit.image).map(edit=>{const image=new Image();image.src=edit.image;return image.decode()})
  ])});
  const capture=await page.context().newCDPSession(page),out=partial?path.join(root,'qa/render-segments',`video-${String(n).padStart(2,'0')}-${startFrame}-${endFrame}.mp4`):path.join(root,'exports',`video-${String(n).padStart(2,'0')}.mp4`);
  temp=out+'.rendering.mp4';
  ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-vcodec','mjpeg','-r','30','-i','pipe:0',...(partial?['-map','0:v:0','-an']:['-i',audioFile?path.resolve(audioFile):path.join(root,'assets/audio/directed-mix.m4a'),'-map','0:v:0','-map','1:a:0']),'-c:v','libx264','-preset','veryfast','-threads','2','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',temp],{stdio:['pipe','ignore','pipe']});
  let stderr='';ff.stderr.on('data',b=>stderr+=b);ff.stdin.on('error',()=>{});const finished=once(ff,'exit');
  for(let frame=startFrame;frame<endFrame;frame++){
   await page.evaluate(time=>{window.__seek(time);void card.offsetHeight},frame/30);
   const bytes=Buffer.from((await capture.send('Page.captureScreenshot',{format:'jpeg',quality:90,optimizeForSpeed:true,captureBeyondViewport:false})).data,'base64');
   if(ff.exitCode!==null)throw new Error(stderr||'FFmpeg exited before the final frame');
   if(!ff.stdin.write(bytes))await Promise.race([once(ff.stdin,'drain'),finished.then(()=>{throw new Error(stderr||'FFmpeg stopped while receiving frames')})]);
   if(frame%300===0)console.log(`video-${String(n).padStart(2,'0')} ${frame}/1626`);
  }
  ff.stdin.end();const [code]=await finished;if(code!==0)throw new Error(stderr||'FFmpeg failed');if(errors.length)throw new Error(errors.join('\n'));
  const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',temp],{encoding:'utf8'});if(probe.status!==0)throw new Error(probe.stderr||'Export container validation failed');
  const meta=JSON.parse(probe.stdout),video=meta.streams.find(s=>s.codec_type==='video'),audio=meta.streams.find(s=>s.codec_type==='audio');
  if(video?.width!==1080||video?.height!==1920||Number(video?.nb_frames)!==endFrame-startFrame||(!partial&&(!audio||Number(meta.format.duration)<54.186)))throw new Error('Export is incomplete; the previous output was retained.');
  await fs.rename(temp,out);console.log('Rendered '+out);
 }catch(e){ff?.kill('SIGTERM');if(temp)await fs.rm(temp,{force:true}).catch(()=>{});throw e}finally{await page.close()}
}
try{await Promise.all(Array.from({length:Math.min(Number(process.env.MOTION_WORKERS)||4,queue.length)},async()=>{while(queue.length)await render(queue.shift())}))}finally{await browser.close()}
