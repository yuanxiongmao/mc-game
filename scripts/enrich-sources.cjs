const {get}=require('./download.cjs');
(async()=>{
const tags=require('../sources/bookshelf-tags.json');
await get('bookshelf-26.3.json',`https://raw.githubusercontent.com/mcbookshelf/mcdata/${tags.find(t=>t.name==='v1/26.3').commit.sha}/blocks/data.min.json`);
await get('wiki-fire.txt','https://minecraft.wiki/w/Fire?action=raw',false);
const en=require('../sources/en_us.json'),ids=require('../sources/registry-26.3.json');
const names=ids.map(id=>en['block.minecraft.'+id]||id.replaceAll('_',' '));
const batches=[];for(let i=0;i<names.length;i+=40)batches.push(names.slice(i,i+40));
let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<batches.length){const i=next++;await get(`wiki/batch-${i}.json`,'https://minecraft.wiki/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'revisions',rvprop:'content',rvslots:'main',redirects:'1',titles:batches[i].join('|')}));}}));
})().catch(e=>{console.error(e);process.exitCode=1;});
