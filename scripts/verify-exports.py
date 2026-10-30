"""Fully decode finished exports and verify the narration + synchronized SFX mix."""
import concurrent.futures,subprocess,json,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
def run(args):
    result=subprocess.run(args,capture_output=True,text=True)
    if result.returncode:raise RuntimeError(result.stderr)
    return result.stdout
def audio_hash(file):
    return run(['ffmpeg','-threads','1','-v','error','-i',str(file),'-map','0:a:0','-f','hash','-hash','sha256','-']).strip()
source_hash=audio_hash(root/'assets/audio/directed-mix.m4a')
def verify(n):
    file=root/f'exports/video-{n:02}.mp4'
    assert file.is_file(),file
    meta=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
    video=next(s for s in meta['streams'] if s['codec_type']=='video')
    audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
    assert (video['width'],video['height'],video['codec_name'],video['r_frame_rate'],int(video['nb_frames']))==(1080,1920,'h264','30/1',1626),(file,video)
    assert audio['codec_name']=='aac' and abs(float(audio['duration'])-54.186)<.002
    checksums=run(['ffmpeg','-threads','1','-v','error','-i',str(file),'-map','0:v:0','-f','framemd5','-'])
    hashes=[line.rsplit(',',1)[-1].strip() for line in checksums.splitlines() if line and not line.startswith('#')]
    assert len(hashes)==1626,(file,'decoded frame count')
    longest=streak=1
    for previous,current in zip(hashes,hashes[1:]):
        streak=streak+1 if previous==current else 1
        longest=max(longest,streak)
    assert longest<=50,(file,'unexpected long freeze beyond the intentional final title hold',longest)
    actual=audio_hash(file)
    assert actual==source_hash,(file,'directed mix mismatch')
    print('Verified',file.name,flush=True)
    return dict(file=file.name,sizeBytes=file.stat().st_size,width=1080,height=1920,fps='30/1',frames=1626,videoDuration=video['duration'],audioDuration=audio['duration'],videoCodec='h264',audioCodec='aac',fullDecode=True,maxIdenticalFrameRun=longest,decodedPcmSha256=actual,directedMixMatch=True)
if __name__=='__main__':
    numbers=list(map(int,sys.argv[1:])) or list(range(1,21))
    assert all(1<=n<=20 for n in numbers)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:outputs=list(pool.map(verify,numbers))
    (root/'qa').mkdir(exist_ok=True)
    name='export-verification.json' if numbers==list(range(1,21)) else f'export-verification-subset-{numbers[0]}-{numbers[-1]}.json'
    (root/'qa'/name).write_text(json.dumps(dict(sourceAudioHash=source_hash,outputs=outputs),indent=2))
