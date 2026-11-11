const {test}=require('node:test');
const assert=require('node:assert/strict');
const {blocks,metadata}=require('../data.js');
const {compareVersion,versionRank,compare,fields,newGame,submit,findBlock,search}=require('../core.js');
test('题库包含完整且有效的11项属性，无重复ID或名称',()=>{
 assert.equal(blocks.length,1286);assert.equal(new Set(blocks.map(b=>b.id)).size,blocks.length);assert.equal(new Set(blocks.map(b=>b.name)).size,blocks.length);
 for(const b of blocks){assert.ok(b.name&&(b.id==='tnt'||/[\u4e00-\u9fff]/.test(b.name)),b.id);for(const [key]of fields)assert.notEqual(b[key],undefined,`${b.name}: ${key}`);for(const k of ['renewable','full','flammable','spread','transparent'])assert.ok([0,1].includes(b[k]),`${b.id}: ${k}`);for(const k of ['resistance','stack','light'])assert.ok(Number.isFinite(b[k])&&b[k]>=0,`${b.id}: ${k}`);assert.ok(Number.isFinite(b.hardness)&&b.hardness>=-1);assert.ok([0,1,16,64].includes(b.stack));assert.ok(b.light<=15);assert.equal(compare(b,b).filter(c=>c.match).length,11);assert.ok(versionRank(b.version).every(Number.isFinite),b.version);}
});
test('题库与26.3原版注册表完全一致，包括变种和技术方块',()=>{
 const registry=require('../sources/registry-26.3.json');assert.deepEqual(blocks.map(b=>b.id).sort(),[...registry].sort());assert.equal(metadata.gameVersion,'26.3');
 for(const id of ['poplar_planks','white_wool_stairs','black_concrete_slab','sulfur_spike','air','barrier','command_block','oak_wall_sign','cave_air'])assert.ok(blocks.some(b=>b.id===id),id);
});
test('镐不区分材质，工具匹配按大类判断',()=>{
 const byId=id=>blocks.find(b=>b.id===id);for(const id of ['stone','iron_ore','gold_ore','obsidian','ancient_debris','netherite_block'])assert.equal(byId(id).tool,'镐',id);
 assert.ok(compare(byId('stone'),byId('obsidian')).find(c=>c.key==='tool').match);assert.ok(blocks.every(b=>!/[钻铁石木]镐|及以上/.test(b.tool)));
});
test('版本包含早期开发版、快照和实验特性，改名不改变加入时间',()=>{
 const expected={stone:'rd-132211',cobblestone:'rd-20090515',oak_log:'Classic 0.0.14a',crafting_table:'Indev 20100129-2332',oak_door:'Infdev 20100607',obsidian:'Classic 0.28',acacia_log:'13w43a',acacia_button:'17w47a',acacia_fence:'14w32b',cherry_log:'23w07a',bamboo_planks:'22w42a',iron_chain:'20w16a',cave_vines:'21w05a',crying_obsidian:'20w09a',white_wool_stairs:'26.3-snapshot-1'};
 for(const [id,v]of Object.entries(expected))assert.equal(blocks.find(b=>b.id===id).version,v,id);
 assert.ok(new Set(blocks.map(b=>b.version)).size>=140);
 for(const [a,b]of [['rd-161348','rd-20090515'],['Classic 0.28','Classic 0.0.14a'],['Indev 20100129-2332','Indev 20091223-1459'],['Alpha 1.2.0','Alpha 1.2.0 preview'],['Beta 1.6','Beta 1.6 Test Build 3'],['Beta 1.9 Prerelease 3','Beta 1.9 Prerelease 2'],['13w43a','1.6.4'],['1.7.2','13w43a'],['26.3-snapshot-7','26.3-snapshot-1'],['26.3','26.3-snapshot-7']]){assert.equal(compareVersion(a,b),1,`${a} > ${b}`);assert.equal(compareVersion(b,a),-1);}
});
test('不可破坏方块视为硬度更高，无物品形态不假装有堆叠',()=>{
 const byId=id=>blocks.find(b=>b.id===id);assert.equal(byId('bedrock').hardness,-1);assert.equal(compare(byId('stone'),byId('bedrock')).find(c=>c.key==='hardness').direction,'up');assert.equal(compare(byId('bedrock'),byId('stone')).find(c=>c.key==='hardness').direction,'down');assert.equal(byId('air').stack,0);assert.equal(byId('water').stack,0);assert.equal(byId('cake').stack,1);assert.equal(byId('white_shulker_box').stack,1);assert.equal(byId('oak_sign').stack,16);
});
test('版本按阶段和数字排序，1.10高于1.8',()=>{for(const [a,b]of [['1.10','1.8'],['1.17','1.16'],['1.0','Beta 1.2'],['Beta 1.2','Alpha'],['Alpha','Infdev'],['Indev','Classic']]){assert.equal(compareVersion(a,b),1);assert.equal(compareVersion(b,a),-1);}assert.equal(compareVersion('1.17','1.17'),0);});
test('同周快照按字母排序，日期时刻缺失也不会倒序',()=>{assert.equal(compareVersion('12w21b','12w21a'),1);assert.equal(compareVersion('12w21a','12w21b'),-1);assert.equal(compareVersion('21w05b','21w05a'),1);});
test('方向指向目标，只在三个指定字段上显示箭头',()=>{const a=blocks.find(b=>b.id==='stone'),b=blocks.find(b=>b.id==='ancient_debris');const cells=compare(a,b);for(const key of ['resistance','hardness','version'])assert.equal(cells.find(c=>c.key===key).direction,'up');for(const c of cells.filter(c=>!['resistance','hardness','version'].includes(c.key)))assert.equal(c.direction,'');for(const key of ['resistance','hardness','version'])assert.equal(compare(b,a).find(c=>c.key===key).direction,'down');});
test('旧模式回合兼容：重复猜测不计数、猜中结束',()=>{const state={targetId:'stone',guesses:[]};assert.equal(submit(state,'dirt'),'guess');assert.equal(submit(state,'dirt'),'duplicate');assert.equal(state.guesses.length,1);assert.equal(submit(state,'stone'),'won');assert.equal(submit(state,'glass'),'finished');assert.deepEqual(state.guesses,['dirt','stone']);});
test('新局使用有效方块且不重复上一局答案',()=>{for(const value of [0,.5,.99999]){const s=newGame(blocks,'stone',()=>value);assert.notEqual(s.targetId,'stone');assert.ok(blocks.some(b=>b.id===s.targetId));assert.deepEqual(s.guesses,[]);}});
test('支持中文、英文、命名空间和模糊查找，未知名称不匹配',()=>{assert.equal(findBlock(blocks,' 石头 ').id,'stone');assert.equal(findBlock(blocks,'minecraft:GRASS_BLOCK').id,'grass_block');assert.equal(findBlock(blocks,'unknown'),undefined);assert.ok(search(blocks,'黑曜石').length===2);assert.ok(search(blocks,'ore').length>=3);});
