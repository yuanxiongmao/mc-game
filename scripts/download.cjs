// 下载项目数据；请求的内容和校验用原始文件均保存在工作目录。
const fs=require('node:fs');const path=require('node:path');
const dir=path.resolve(__dirname,'../sources');fs.mkdirSync(dir,{recursive:true});
async function get(file,url,json=true){const dest=path.join(dir,file);if(fs.existsSync(dest))return json?JSON.parse(fs.readFileSync(dest,'utf8')):fs.readFileSync(dest,'utf8');const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`${r.status} ${url}`);const text=await r.text();fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text);console.log(file,text.length);return json?JSON.parse(text):text;}
module.exports={get,dir};
if(require.main===module)(async()=>{
 const manifest=await get('manifest.json','https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
 const version=await get('version-26.3.json',manifest.versions.find(v=>v.id==='26.3').url);
 const assets=await get('asset-index.json',version.assetIndex.url);
 const zh=assets.objects['minecraft/lang/zh_cn.json'];await get('zh_cn.json',`https://resources.download.minecraft.net/${zh.hash.slice(0,2)}/${zh.hash}`);
 await get('en_us.json','https://raw.githubusercontent.com/misode/mcmeta/26.3-assets/assets/minecraft/lang/en_us.json');
 await get('registry-26.3.json','https://raw.githubusercontent.com/misode/mcmeta/26.3-registries/block/data.json');
 const tags=await get('bookshelf-tags.json','https://api.github.com/repos/mcbookshelf/mcdata/tags?per_page=100');console.log('tags',tags.slice(0,12).map(t=>t.name));
 console.log('registry',require('../sources/registry-26.3.json').length);
})().catch(e=>{console.error(e);process.exitCode=1;});
