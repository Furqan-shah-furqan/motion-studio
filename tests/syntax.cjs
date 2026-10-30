const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
for(const dir of ['src','scripts'])for(const f of fs.readdirSync(path.join(root,dir))){if(!/\.(?:js|mjs|cjs)$/.test(f))continue;const out=cp.spawnSync(process.execPath,['--check',path.join(root,dir,f)],{encoding:'utf8'});if(out.status){process.stderr.write(out.stderr);process.exit(out.status)}}console.log('All application and render scripts parse.');
