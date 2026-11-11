const {test}=require('node:test'),assert=require('node:assert/strict');
const {blocks,category}=require('../catalog.js');const {bestMatch,submitField,restoreState}=require('../core.js');
const fresh=(targetId='diamond_block')=>({targetId,guesses:[],inputs:[],mode:'free-text'});
test('天然石材按石种独立，加工石材另归一类',()=>{
 const natural='stone granite diorite andesite deepslate blackstone basalt smooth_basalt tuff calcite end_stone'.split(' ');
 for(const id of natural){assert.equal(category(id),id);const block=blocks.find(b=>b.id===id);assert.ok(block,id);assert.ok(block.members.includes(id));}
 assert.equal(new Set(natural.map(category)).size,natural.length);
 for(const id of ['smooth_stone','polished_granite','polished_diorite','polished_andesite','polished_deepslate','polished_blackstone','polished_basalt','polished_tuff'])assert.equal(category(id),'worked_stone');
 assert.equal(blocks.find(b=>b.id==='stone').name,'石头');assert.equal(blocks.find(b=>b.id==='worked_stone').name,'加工石材');
});
test('自动选择完整名称、原始别名、ID以及归并后的类别',()=>{
 for(const [input,id]of [['花岗岩','granite'],['磨制花岗岩','worked_stone'],['minecraft:IRON_ORE','iron_ore'],['橡木原木','log'],['斑驳的铜格栅','copper_grate'],['虞美人盆栽','flower'],['黑色混凝土台阶','stairs']])assert.equal(bestMatch(blocks,input).block.id,id,input);
});
test('名称片段和错别字无需选择候选即可匹配',()=>{
 for(const [input,id]of [['闪长','diorite'],['铜格','copper_grate'],['黑曜是','obsidian'],['amethyst','amethyst_block'],['diamnod_block','diamond_block']])assert.equal(bestMatch(blocks,input).block.id,id,input);
});
test('同分选择固定，改变题库顺序不会改变结果',()=>{
 const candidates=[{id:'z',name:'木甲',aliases:[]},{id:'a',name:'木乙',aliases:[]}];assert.equal(bestMatch(candidates,'木').block.id,'a');assert.equal(bestMatch([...candidates].reverse(),'木').block.id,'a');
});
test('每次有效提交计一次，重复匹配不跳过且保留原始输入',()=>{
 const state=fresh();assert.equal(submitField(state,blocks,' 铜格 ').result,'guess');assert.equal(submitField(state,blocks,'斑驳的铜格栅').result,'guess');assert.deepEqual(state.guesses,['copper_grate','copper_grate']);assert.deepEqual(state.inputs,['铜格','斑驳的铜格栅']);
 assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state)),blocks),state);
});
test('匹配不参考答案或已猜历史，命中结束后不再计数',()=>{
 const a=fresh('copper_grate'),b=fresh('stone');const first=submitField(a,blocks,'铜格'),second=submitField(b,blocks,'铜格');assert.equal(first.block.id,second.block.id);assert.equal(first.result,'won');assert.equal(submitField(a,blocks,'泥土').result,'finished');assert.equal(a.guesses.length,1);
});
test('无明显相关输入仍选出一个方块，空输入和过长输入不计数',()=>{
 const state=fresh('barrier');assert.equal(submitField(state,blocks,'   ').result,'empty');assert.equal(submitField(state,blocks,'a'.repeat(81)).result,'too-long');assert.equal(state.guesses.length,0);const result=submitField(state,blocks,'zzzzzzzzzz');assert.ok(result.block&&blocks.some(b=>b.id===result.block.id));assert.equal(state.guesses.length,1);assert.equal(state.inputs[0],'zzzzzzzzzz');
});
test('新玩法存档保留重复猜测，合并导致命中时截断后续记录',()=>{
 const state={targetId:'dandelion',mode:'free-text',guesses:['stone','stone','poppy','gold_ore'],inputs:['石','石头','虞美人','金矿']};assert.deepEqual(restoreState(state,blocks),{targetId:'flower',mode:'free-text',guesses:['stone','stone','flower'],inputs:['石','石头','虞美人']});assert.equal(restoreState({...state,inputs:[]},blocks),null);
});
