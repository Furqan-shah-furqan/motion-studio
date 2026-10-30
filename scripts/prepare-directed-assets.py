"""Reproducible theme variants of assets explicitly supplied for the Thynk film.

No reference-video pixels, external imagery, generated replacements or services.
Pillow is required only when rebuilding these already-included PNG assets.
"""
from pathlib import Path
from collections import deque
from PIL import Image, ImageOps, ImageDraw, ImageFilter
import hashlib, json, io, os

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/directed'
SOURCE = OUT / 'supplied'
OUT.mkdir(parents=True, exist_ok=True)

def save_png(im,path):
    stream=io.BytesIO();im.save(stream,format='PNG',optimize=True)
    temp=path.with_suffix('.png.tmp')
    with open(temp,'wb') as f:
        f.write(stream.getvalue());f.flush();os.fsync(f.fileno())
    os.replace(temp,path)

def flood_alpha(im, mode):
    """Remove only the edge-connected plain background, never subject interiors."""
    im = im.convert('RGBA')
    w,h=im.size; px=im.load(); seen=bytearray(w*h); todo=deque()
    def background(x,y):
        r,g,b,a=px[x,y]
        if a<8:return True
        if mode=='white':return min(r,g,b)>214 and max(r,g,b)-min(r,g,b)<36
        if mode=='pale':return min(r,g,b)>198 and max(r,g,b)-min(r,g,b)<48
        return max(r,g,b)<62
    def add(x,y):
        i=y*w+x
        if not seen[i] and background(x,y): seen[i]=1;todo.append((x,y))
    for x in range(w):add(x,0);add(x,h-1)
    for y in range(h):add(0,y);add(w-1,y)
    while todo:
        x,y=todo.popleft();r,g,b,a=px[x,y];px[x,y]=(r,g,b,0)
        if x:add(x-1,y)
        if x<w-1:add(x+1,y)
        if y:add(x,y-1)
        if y<h-1:add(x,y+1)
    return im

def polygon_cut(im, points):
    mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(points,fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(.65))
    im=im.convert('RGBA');im.putalpha(mask);return im

def theme(im, white=False):
    alpha=im.getchannel('A')
    gray=ImageOps.grayscale(im)
    if white: result=ImageOps.colorize(gray,'#c6a0f1','#ffffff')
    else: result=ImageOps.colorize(gray,'#6b21b5','#ffffff')
    result.putalpha(alpha);return result

def trim(im):
    box=im.getchannel('A').getbbox()
    if box:im=im.crop(box)
    im.thumbnail((640,640),Image.Resampling.LANCZOS)
    pad=max(8,round(max(im.size)*.025))
    result=Image.new('RGBA',(im.width+pad*2,im.height+pad*2))
    result.alpha_composite(im,(pad,pad));return result

POLYGONS={
 'html':[(242,408),(258,280),(267,260),(286,250),(432,233),(447,237),(480,261),(486,277),(473,433),(461,453),(413,472),(261,450),(244,439)],
 'css':[(226,423),(247,266),(256,247),(279,238),(449,215),(465,221),(497,250),(504,269),(486,432),(472,448),(430,465),(246,461),(231,447)],
 'js':[(246,451),(274,285),(285,266),(307,260),(428,245),(440,250),(465,273),(470,288),(450,442),(434,468),(407,484),(269,477),(250,466)],
 'flutter':[(101,25),(139,25),(111,52),(127,52),(139,65),(121,82),(145,108),(127,125),(82,81),(100,63),(85,63),(65,83),(51,70)],
 'ar':[(209,342),(220,314),(244,285),(251,264),(265,250),(290,255),(309,230),(293,247),(292,239),(442,81),(464,58),(485,59),(509,80),(501,93),(513,96),(535,106),(542,123),(528,139),(414,220),(471,233),(488,250),(496,286),(507,320),(511,358),(496,419),(475,451),(442,475),(398,488),(333,493),(283,481),(251,464),(229,435),(214,388)]
}
POLYGONS['meal2']=POLYGONS['ar']
ENTRIES={
 'clipflow':('🎬 Premium Editing Assets Pack _ Video Editing Resources.jpg','white',None),
 'wireframer':('icons smm (1).jpg','white',None),
 'foodsnap':('foodsnap_app_icon.png',None,None),
 'foodsnap-wordmark':('foodsnap_wordmark.png',None,None),
 'ar':('meal2.jpg',None,None),
 'instagram':('Instagram.jpg','dark',None),
 'youtube':('YouTube.jpg','white',None),
 'html':('HTML.jpg',None,None),
 'css':('Css.jpg',None,None),
 'js':('JavaScript.jpg',None,None),
 'flutter':('Flutter 4_0.jpg',None,None),
 'next':('next.js.jpg','dark',None),
 'node':('Node.js.jpg','white',None),
 'ai':('Ai.jpg','dark',None),
 'message':('Message.jpg','white',None),
 'smarter':('icons smm.jpg','white',None),
 'meal':('3D meal.jpg','white',None),
 'meal2':('meal2.jpg',None,None),
 'meal3':('meal3.jpg','white',None),
 'table':('costumer points a phone at the table.jpg',None,None),
 'calories-reference':('calories tracking.jpg',None,None),
 'mockups-reference':('mockups.jpg',None,None)
}
assets={}
for key,(name,mode,crop) in ENTRIES.items():
    p=SOURCE/name;im=Image.open(p).convert('RGBA')
    steps=[]
    if key in POLYGONS:im=polygon_cut(im,POLYGONS[key]);steps.append('manually bounded supplied icon silhouette')
    if mode:im=flood_alpha(im,mode);steps.append('edge-connected '+mode+' background removal')
    if crop:im=im.crop(crop);steps.append('crop to supplied illustration region')
    if key=='foodsnap-wordmark':
        # Keep the original glyph geometry; recolor dark text to legible violet.
        alpha=im.getchannel('A');solid=Image.new('RGBA',im.size,'#7c3aed');solid.putalpha(alpha);im=solid
    natural=trim(im)
    if key in ('meal','meal2','meal3','foodsnap','foodsnap-wordmark'):
        save_png(natural,OUT/(key+'-natural.png'))
    if key in ('next','ai'):
        alpha=im.getchannel('A');im=ImageOps.colorize(ImageOps.grayscale(im),'#eee4fc','#7c3aed');im.putalpha(alpha)
    elif key!='foodsnap-wordmark':im=theme(im)
    im=trim(im)
    save_png(im,OUT/(key+'.png'))
    assets[key]={'path':'assets/directed/'+key+'.png','source':'assets/directed/supplied/'+name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'processing':steps+['purple-white luminance map; alpha retained; maximum 640px'],'referenceOnly':key.endswith('-reference') or key=='table'}

manifest={'version':1,'palette':['#ffffff','#7c3aed'],'provenance':'All images are derived only from the user-supplied Assets(1).zip. The unmodified files remain in assets/directed/supplied/. No pixels from 000.mp4 or thynk-v4.mp4 are used. Reference-only images guide authored UI; they are not rendered as UI screenshots.','assets':assets,'notes':['Use the PNG variants to keep the complete film purple and white. Natural meal/brand variants are supplied separately if the user later requests their original colors.','For next.png the original NEXT.js glyph shape is preserved in violet.','SFX are prepared independently under assets/audio/directed-*; their unmodified MP3 sources remain in supplied/.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
images=[(key,Image.open(OUT/(key+'.png')).copy()) for key in assets]
sheet=Image.new('RGB',(1100,((len(images)+4)//5)*220),'#eee6fa');draw=ImageDraw.Draw(sheet)
for i,(key,im) in enumerate(images):
    im.thumbnail((190,180),Image.Resampling.LANCZOS);x=(i%5)*220+(220-im.width)//2;y=(i//5)*220
    sheet.paste(im,(x,y),im);draw.text(((i%5)*220+12,y+188),key,fill='#6323a0')
sheet.save(OUT/'asset-contact.jpg',quality=90)
print(json.dumps({'assets':len(assets),'output':str(OUT)}))
