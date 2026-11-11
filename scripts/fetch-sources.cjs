const fs=require('node:fs');const path=require('node:path');
const dir=path.resolve(__dirname,'../sources');fs.mkdirSync(dir,{recursive:true});
const sources={
 'paths.json':'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/dataPaths.json',
 'manifest.json':'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
 'mcdata-readme.md':'https://raw.githubusercontent.com/mcbookshelf/mcdata/v1/README.md',
 'mcmeta-versions.json':'https://raw.githubusercontent.com/misode/mcmeta/summary/versions/data.json',
 'blocks-26.1.json':'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/26.1/blocks.json',
 'bookshelf-26.3.json':'https://raw.githubusercontent.com/mcbookshelf/mcdata/v1/26.3/blocks/data.min.json',
 'rosegold-26.3.json':'https://raw.githubusercontent.com/RosegoldMC/minecraft-data.cr/main/data/26.3/blocks.json',
 'wiki-stone.txt':'https://minecraft.wiki/w/Stone?action=raw'
};
(async()=>{for(const [file,url]of Object.entries(sources)){try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(String(r.status));const data=await r.text();fs.writeFileSync(path.join(dir,file),data);console.log(file,data.length,data.slice(0,70).replace(/\n/g,' '));}catch(e){console.log(file,e.message);}}})();
