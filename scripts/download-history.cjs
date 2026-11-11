const {get}=require('./download.cjs');
(async()=>{
await get('item-components.json','https://raw.githubusercontent.com/misode/mcmeta/26.3-summary/item_components/data.json');
await get('registry-commits-1.json','https://api.github.com/repos/misode/mcmeta/commits?sha=registries&path=block/data.json&per_page=100&page=1');
await get('registry-commits-2.json','https://api.github.com/repos/misode/mcmeta/commits?sha=registries&path=block/data.json&per_page=100&page=2');
const c=[...require('../sources/registry-commits-1.json'),...require('../sources/registry-commits-2.json')];console.log('history commits',c.length,c.at(-1)?.commit.message);let next=0;await Promise.all(Array.from({length:5},async()=>{while(next<c.length){const item=c[next++];try{await get('registry-history/'+item.sha+'.json',`https://raw.githubusercontent.com/misode/mcmeta/${item.sha}/block/data.json`);}catch(e){if(item.sha==='1a9e0b3b821c05f817f9b46ef2a4f7236d458a59'&&e.message.startsWith('404'))console.log('23w07a 注册表缺失，使用已保存 Wiki 历史核对。');else throw e;}}}));
})().catch(e=>{console.error(e);process.exitCode=1;});
