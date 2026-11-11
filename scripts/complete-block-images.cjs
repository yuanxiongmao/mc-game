const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {blocks}=require('../catalog.js'),manifest=require('../sources/block-images.json');
const ids=blocks.filter(b=>!manifest[b.id]||manifest[b.id].kind==='texture').map(b=>b.id);
const title=id=>id.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
(async()=>{
 const query='https://minecraft.wiki/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=original&titles='+encodeURIComponent(ids.map(title).join('|'));
 const data=await(await fetch(query)).json();
 const pages=Object.values(data.query.pages),redirects=data.query.redirects||[];
 for(const id of ids){let name=title(id);name=redirects.find(x=>x.from===name)?.to||name;const page=pages.find(p=>p.title.toLowerCase()===name.toLowerCase());
  if(!page?.original){console.log('No image:',id);continue;}
  const url=page.original.source,ext=path.extname(new URL(url).pathname).slice(1);const r=await fetch(url);if(!r.ok)throw Error(r.status+' '+url);
  fs.writeFileSync(path.join(root,`assets/blocks/${id}.${ext}`),Buffer.from(await r.arrayBuffer()));
  manifest[id]={kind:'render',representative:id,ext,source:url,page:`https://minecraft.wiki/w/${encodeURIComponent(page.title.replaceAll(' ','_'))}`};console.log('Saved:',id,ext);
 }
 fs.writeFileSync(path.join(root,'sources/block-images.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(root,'block-images.js'),'/* Local Minecraft image metadata. See SOURCES.md. */\nconst BlockImages='+JSON.stringify(manifest)+';\n');
 console.log('Covered:',Object.keys(manifest).length,'/',blocks.length);
})();
