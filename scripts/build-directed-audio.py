"""Make speech-led SFX from supplied assets. Requires only Python + FFmpeg.
The original AAC is never modified. Timing follows the existing measured speech
clock, with a single effect per caption phrase and semantic graphic landings.
"""
from pathlib import Path
import array,json,math,subprocess,wave,re,argparse,base64
ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--assets',type=Path,default=ROOT/'assets/directed/supplied');args=parser.parse_args()
SR=48000
FILES={
 'pop':('abhicreates-soft-subtle-ui-pop-sfx-348820.mp3','caption',.26),
 'whoosh':('ribhavagrawal-woosh-230554.mp3','whoosh',.55),
 'hit':('dragon-studio-hard-punch-sfx-515251.mp3','impact',.85),
 'chime':('oxidvideos-ding-small-bell-sfx-411945.mp3','ding',.52)}
def decode(p,channels):
 a=array.array('f');a.frombytes(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar',str(SR),'-ac',str(channels),'-f','f32le','-']));return a
prepared={};provenance={}
for key,(name,slug,maxlen) in FILES.items():
 a=decode(args.assets/name,1);pk=max(map(abs,a));threshold=pk*10**(-30/20)
 onset=next(i for i,x in enumerate(a) if abs(x)>=threshold)
 # The first significant transient begins at the visible cue, not the MP3's
 # leading silence. Preserve the audible tail; fade its very last samples.
 a=a[onset:min(len(a),onset+int(maxlen*SR))];pk=max(map(abs,a));a=array.array('f',(x/pk for x in a))
 for i in range(min(96,len(a))):a[i]*=i/96
 fade=min(1440,len(a))
 for i in range(fade):a[-fade+i]*=(fade-i)/fade
 out=ROOT/f'assets/audio/directed-{slug}.wav';out.parent.mkdir(parents=True,exist_ok=True)
 pcm=array.array('h',(int(max(-1,min(1,x)) *32767) for x in a))
 with wave.open(str(out),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
 prepared[key]=a;provenance[key]={'source':name,'file':str(out.relative_to(ROOT)),'trimmedLeadingSeconds':round(onset/SR,6),'duration':len(a)/SR,'peakNormalized':True}
master=json.loads((ROOT/'timing/master-transcript.json').read_text())
special=[(14.96,16.48,15.16),(25.7,26.34,25.7),(34.22,36.26,34.22),(46.54,47.8,46.54),(47.8,48.78,47.8),(52.66,master['duration'],52.66)]
bounds=[0,3.2,4.2,6.34,10.78,12.46,14.96,16.48,19.02,22.46,25.7,26.34,30.88,34.22,36.26,41.46,44.56,46.54,47.8,48.78,51.36,52.66]
def is_title(t):return any(a<=t<b for a,b,_ in special)
caption=[]
for g in master['groups']:
 if not is_title(g['start']):caption.append((g['start'],'Caption · '+' '.join(w['text'] for w in g['words'])))
 for b in bounds:
  if g['start']<b<g['end'] and not is_title(b):caption.append((b,'Caption · next scene'))
caption.extend((c,'Caption · title reveal') for _,_,c in special)
caption.sort();unique=[]
for t,w in caption:
 if not unique or t-unique[-1][0]>=.12:unique.append((t,w))
cues=[{'t':round(t,3),'type':'pop','w':w,'gain':.065} for t,w in unique]
# Each motion effect names its visible payoff. No random ambient effects.
motion=[(1.62,'hit','Four product icons land',.075),(6.98,'whoosh','ClipFlow reveals',.09),(7.94,'whoosh','Scan beam starts',.065),(9.7,'chime','Viral moment selected',.065),(13.38,'whoosh','Instagram logo enters',.08),(14.04,'chime','YouTube logo lands',.06),(16.48,'whoosh','Prompt field slides in',.085),(20.12,'hit','Phone screen lands',.055),(20.86,'hit','Tablet screen lands',.055),(21.44,'hit','Desktop screen lands',.055),(22.66,'chime','HTML icon appears',.05),(23.8,'chime','CSS icon appears',.05),(24.48,'chime','JavaScript icon appears',.05),(26.34,'whoosh','Meal scan begins',.075),(29.36,'chime','Calorie value resolves',.075),(31.72,'whoosh','Progress chart draws',.07),(33.0,'chime','Subscription indicator resolves',.05),(38.78,'whoosh','AR dish lifts from table',.10),(41.46,'hit','Technology icons assemble',.065),(45.86,'whoosh','Ship graphic exits',.08),(47.8,'chime','Message icon lands',.065),(51.56,'hit','Full Guide callout lands',.055)]
cues.extend({'t':t,'type':ty,'w':w,'gain':v} for t,ty,w,v in motion);cues.sort(key=lambda c:c['t'])
source=decode(ROOT/master['audio'],2);frames=round(master['duration']*SR);source=source[:frames*2];mix=array.array('f',source)
for c in cues:
 start=round(c['t']*SR)
 for i,v in enumerate(prepared[c['type']]):
  j=(start+i)*2
  if j+1>=len(mix):break
  mix[j]+=v*c['gain'];mix[j+1]+=v*c['gain']
peak=max(map(abs,mix));gain=min(1,.85/peak)
# One static gain gives codec/reconstruction headroom; no limiting, compression,
# dialog normalization, cut, time stretch or source replacement is performed.
outwav=ROOT/'assets/audio/directed-mix.wav';pcm=array.array('h',(int(max(-1,min(1,x*gain))*32767) for x in mix))
with wave.open(str(outwav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg','-y','-v','error','-i',str(outwav),'-c:a','aac','-b:a','192k',str(ROOT/'assets/audio/directed-mix.m4a')],check=True)
master_sfx=.7
for c in cues:c['v']=round(c.pop('gain')*gain/master_sfx,6)
report={'duration':master['duration'],'sampleRate':SR,'narration':master['audio'],'mixedAudio':'assets/audio/directed-mix.m4a','narrationGain':gain,'sfxMasterGain':master_sfx,'captionEffect':'pop','captionCueCount':len(unique),'motionCueCount':len(motion),'files':{k:v['file'] for k,v in provenance.items()},'provenance':provenance,'cues':cues,'mix':{'staticGainDb':20*math.log10(gain),'pcmPeakDbFS':20*math.log10(peak*gain),'originalUncut':True,'originalFileUnmodified':True,'note':'SFX are aligned to measured phrase/semantic timestamps; timing estimates retain source transcription uncertainty. The original narration has no cuts or dynamic processing. One static headroom gain is applied to mixed delivery.'}}
for name,p in [('original',ROOT/master['audio']),('mix',ROOT/'assets/audio/directed-mix.m4a')]:
 run=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True);summary=run.stderr[run.stderr.rfind('Summary:'):];report['mix'][name+'EBU']=summary.strip()
(ROOT/'timing/directed-sfx.json').write_text(json.dumps(report,indent=2))
runtime=dict(report);runtime['dataURIs']={k:'data:audio/wav;base64,'+base64.b64encode((ROOT/v['file']).read_bytes()).decode() for k,v in provenance.items()}
(ROOT/'src/directed-audio-data.js').write_text('/* Measured, onset-trimmed supplied effects; see timing/directed-sfx.json. */\nconst DIRECTED_SFX_DATA='+json.dumps(runtime,separators=(',',':'))+';\n')
print(json.dumps({'captionCues':len(unique),'motionCues':len(motion),'narrationGain':gain,'headroomDb':20*math.log10(gain),'files':report['files'],'mix':report['mix']},indent=2))
