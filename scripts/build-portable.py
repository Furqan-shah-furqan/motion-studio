"""Build a portable single-file HTML editor with bundled fonts, narration and image references."""
from pathlib import Path
import base64, json, mimetypes, re

root = Path(__file__).resolve().parent.parent
timing = json.loads((root / 'timing/master-transcript.json').read_text())
(root / 'timing/master.js').write_text('const MASTER_TIMING=' + json.dumps(timing) + ';\n')
html = (root / 'index.html').read_text()

def data_uri(asset):
    mime = mimetypes.guess_type(asset.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,' + base64.b64encode(asset.read_bytes()).decode('ascii')

def stylesheet(match):
    name = match[1]
    if name.startswith('http'):
        return match[0]
    source = root / name
    def font(m):
        asset = (source.parent / m[1]).resolve()
        return 'url(' + data_uri(asset) + ')'
    css = re.sub(r"url\(['\"]?(\.\./assets/fonts/[^)'\"]+)['\"]?\)", font, source.read_text())
    return '<style>' + css + '</style>'

html = re.sub(r'<link rel="stylesheet" href="([^"\s]+)"\s*>', stylesheet, html)

def script(match):
    name = match[1]
    text = (root / name).read_text()
    # Make any referenced raster assets/posters self-contained. Original video files
    # intentionally remain as ordinary files in the organized source project.
    for folder in ('assets/directed', 'assets/reference-library'):
        base = root / folder
        if not base.exists():
            continue
        for asset in base.rglob('*'):
            if not asset.is_file() or asset.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp', '.gif'}:
                continue
            rel = asset.relative_to(root).as_posix()
            if rel in text:
                text = text.replace(rel, data_uri(asset))
    if name == 'timing/master.js':
        text = text.replace(timing['audio'], data_uri(root / timing['audio']))
    return '<script>' + text.replace('</script', '<\\/script') + '</script>'

html = re.sub(r'<script src="([^"]+)"></script>', script, html)
output = root / 'motion-studio.html'
output.write_text(html)
print(f'Built {output.name} ({output.stat().st_size / 1024 / 1024:.1f} MiB) with embedded source, fonts, narration and image-based reference assets.')
