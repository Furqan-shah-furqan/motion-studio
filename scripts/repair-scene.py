"""Install a deterministic scene render without touching the original soundtrack."""
import subprocess,json,sys,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parent.parent
args=sys.argv[1:]
start,end=1087,1244
if '--range' in args:
    index=args.index('--range');start,end=map(int,args[index+1].split(':'));del args[index:index+2]

def repair(n):
    original=root/f'exports/video-{n:02}.mp4'
    patch=root/f'qa/render-segments/video-{n:02}-{start}-{end}.mp4'
    output=original.with_suffix('.repairing.mp4')
    graph=f'[0:v]split=2[a][b];[a]trim=start_frame=0:end_frame={start},setpts=PTS-STARTPTS[p];[b]trim=start_frame={end}:end_frame=1626,setpts=PTS-STARTPTS[s];[1:v]setpts=PTS-STARTPTS[c];[p][c][s]concat=n=3:v=1:a=0[v]'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(original),'-i',str(patch),'-filter_complex',graph,'-map','[v]','-map','0:a:0','-c:v','libx264','-preset','fast','-crf','16','-threads','2','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(output)],check=True)
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(output)]))
    assert int(next(s for s in info['streams'] if s['codec_type']=='video')['nb_frames'])==1626
    output.replace(original)
    print('Updated scene segment',n,flush=True)
if __name__=='__main__':
    numbers=list(map(int,args)) or list(range(1,21))
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(repair,numbers))
