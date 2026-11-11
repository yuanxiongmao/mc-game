const {test}=require('node:test');const assert=require('node:assert/strict');
const raw=require('../data.js').blocks;const {blocks,metadata,category,aggregate}=require('../catalog.js');
const {fields,findBlock,search,compare,compareVersion,newGame,submit}=require('../core.js');
const byId=id=>blocks.find(b=>b.id===id);

test('全部命令方块类型归为命令方块，输入和旧存档兼容',()=>{
 const {bestMatch,restoreState}=require('../core.js');
 const command=byId('command_block');assert.equal(command.name,'命令方块');
 assert.deepEqual([...command.members].sort(),['chain_command_block','command_block','repeating_command_block']);
 assert.equal(blocks.filter(b=>b.id.includes('command_block')).length,1);
 for(const input of ['命令方块','连锁型命令方块','循环型命令方块','chain_command_block','minecraft:repeating_command_block']){
  assert.equal(findBlock(blocks,input).id,'command_block');assert.equal(bestMatch(blocks,input).block.name,'命令方块');
 }
 assert.equal(command.version,'1.4');assert.equal(command.hardness,-1);assert.equal(command.resistance,3600000);
 assert.deepEqual(restoreState({targetId:'chain_command_block',guesses:['stone','repeating_command_block'],inputs:['石头','循环型命令方块'],mode:'free-text'},blocks),{targetId:'command_block',guesses:['stone','command_block'],inputs:['石头','循环型命令方块'],mode:'free-text'});
 assert.equal(restoreState({targetId:'repeating_command_block',guesses:[],ended:true},blocks).ended,true);
});

test('普通空气、洞穴空气和虚空空气统一为空气，名称与旧存档兼容',()=>{
 const {bestMatch,restoreState}=require('../core.js');
 const air=byId('air');assert.equal(air.name,'空气');
 assert.deepEqual([...air.members].sort(),['air','cave_air','void_air']);
 assert.equal(blocks.filter(b=>b.id.endsWith('air')).length,1);
 for(const name of ['空气','洞穴空气','虚空空气','air','cave_air','minecraft:void_air']){
  assert.equal(findBlock(blocks,name).id,'air');assert.equal(bestMatch(blocks,name).block.name,'空气');
 }
 assert.equal(air.version,'pre-alpha');assert.equal(air.stack,0);assert.equal(air.full,0);
 assert.deepEqual(restoreState({targetId:'cave_air',guesses:['stone','void_air'],inputs:['石头','虚空空气'],mode:'free-text'},blocks),{targetId:'air',guesses:['stone','air'],inputs:['石头','虚空空气'],mode:'free-text'});
 assert.equal(restoreState({targetId:'void_air',guesses:[],ended:true},blocks).ended,true);
});
test('全部1286个原始方块恰好属于一个类别，分类无重复且可随机选取',()=>{
 const members=blocks.flatMap(b=>b.members);assert.equal(members.length,1286);assert.equal(new Set(members).size,1286);assert.deepEqual([...members].sort(),raw.map(b=>b.id).sort());
 assert.equal(new Set(blocks.map(b=>b.name)).size,blocks.length);assert.equal(new Set(blocks.map(b=>b.id)).size,blocks.length);assert.equal(metadata.rawBlockCount,1286);assert.ok(blocks.length<raw.length);
 const state=newGame(blocks,null,()=>.9999);assert.ok(byId(state.targetId));
 for(const b of blocks){assert.equal(compare(b,b).filter(c=>c.match).length,11,b.id);assert.ok(/^(pre-alpha|alpha|beta|\d+\.\d+)$/.test(b.version),b.version);for(const [key]of fields)assert.notEqual(b[key],undefined,b.id+' '+key);}
});
test('所有木种、去皮原木、木头、菌柄归并为原木，木板包括竹马赛克',()=>{
 for(const id of ['oak_log','acacia_log','birch_log','stripped_cherry_log','spruce_wood','crimson_stem','warped_hyphae','bamboo_block'])assert.equal(findBlock(blocks,id).name,'原木',id);
 for(const name of ['橡木原木','金合欢原木','白桦原木','minecraft:birch_log','原木'])assert.equal(findBlock(blocks,name).id,'log',name);
 for(const id of ['oak_planks','birch_planks','warped_planks','bamboo_mosaic','poplar_planks'])assert.equal(findBlock(blocks,id).name,'木板',id);
 assert.equal(byId('log').flammable,'partial');assert.equal(byId('planks').flammable,'partial');
});
test('所有198种楼梯和台阶只生成一个楼梯类别，工具完整并列',()=>{
 const members=raw.filter(b=>/_(stairs|slab)$/.test(b.id));assert.equal(members.length,198);assert.equal(byId('stairs').members.length,members.length);
 for(const b of members)assert.equal(findBlock(blocks,b.id).id,'stairs',b.id);
 for(const input of ['楼梯','台阶','橡木台阶','石楼梯','cut_copper_slab','white_wool_stairs'])assert.equal(findBlock(blocks,input).name,'楼梯',input);
 assert.equal(byId('stairs').tool,'镐/斧/剪刀');assert.equal(byId('stairs').flammable,'partial');assert.equal(byId('stairs').full,0);assert.deepEqual(byId('stairs').hardness,{min:.8,max:3.5});
});
test('木石制品按用途分类，矿石和独立资源仍保留',()=>{
 for(const [id,group]of [['acacia_door','door'],['iron_door','door'],['oak_trapdoor','trapdoor'],['polished_blackstone_button','button'],['birch_button','button'],['spruce_pressure_plate','pressure_plate'],['nether_brick_fence','fence'],['tuff_wall','wall'],['stripped_oak_log','log'],['mossy_cobblestone','cobblestone'],['cracked_stone_bricks','stone_bricks'],['polished_andesite','worked_stone'],['red_sandstone','sandstone']])assert.equal(category(id),group,id);
 assert.notEqual(category('iron_ore'),category('gold_ore'));assert.equal(category('redstone_block'),'redstone_block');
 for(const [id,group]of [['chiseled_quartz_block','quartz_block'],['smooth_quartz','quartz_block'],['quartz_bricks','quartz_block'],['dark_prismarine','prismarine'],['polished_sulfur','sulfur'],['chiseled_cinnabar','cinnabar']])assert.equal(category(id),group,id);
});
test('染色玻璃羊毛等所有可染色系列去掉颜色，不误合并红石和红色蘑菇',()=>{
 for(const [id,name]of [['red_stained_glass','玻璃'],['glass','玻璃'],['blue_stained_glass_pane','玻璃板'],['black_wool','羊毛'],['yellow_carpet','地毯'],['red_bed','床'],['blue_candle','蜡烛'],['magenta_terracotta','陶瓦'],['pink_glazed_terracotta','陶瓦'],['black_concrete','混凝土'],['light_blue_concrete_powder','混凝土粉末'],['purple_shulker_box','潜影盒'],['red_wall_banner','旗帜']])assert.equal(findBlock(blocks,id).name,name,id);
 assert.equal(byId('glass').members.length,17);assert.equal(byId('wool').members.length,16);assert.equal(byId('banner').members.length,32);
 assert.equal(category('redstone_block'),'redstone_block');assert.equal(category('red_mushroom'),'red_mushroom');
});
test('主世界花卉和生长形态统一为花，末地紫颂花保留',()=>{
 for(const id of ['dandelion','golden_dandelion','sunflower','poppy','allium','red_tulip','blue_orchid','cornflower','lilac','peony','rose_bush','pink_petals','wildflowers','cactus_flower','wither_rose','open_eyeblossom','closed_eyeblossom','spore_blossom','torchflower','torchflower_crop','pitcher_plant','pitcher_crop','flowering_azalea'])assert.equal(findBlock(blocks,id).name,'花',id);
 for(const name of ['蒲公英','向日葵','玫瑰丛','花'])assert.equal(findBlock(blocks,name).id,'flower',name);
 assert.equal(findBlock(blocks,'chorus_flower').id,'chorus_flower');assert.notEqual(findBlock(blocks,'crimson_fungus').id,'flower');assert.equal(findBlock(blocks,'flowering_azalea_leaves').id,'leaves');
});
test('所有雕纹和墙上变种回到基础方块，无重复题目',()=>{
 assert.ok(blocks.every(b=>!/^potted_|(^|_)wall_|(^|_)chiseled_/.test(b.id)));
 assert.ok(blocks.every(b=>!(/雕[纹文]|墙上的|盆栽/.test(b.name))));
 for(const [id,base]of [['chiseled_bookshelf','bookshelf'],['chiseled_resin_bricks','resin_bricks'],['chiseled_copper','copper_block'],['chiseled_deepslate','deepslate'],['creeper_wall_head','creeper_head'],['skeleton_wall_skull','skeleton_skull'],['wall_torch','torch'],['soul_wall_torch','soul_torch'],['copper_wall_torch','copper_torch']])assert.equal(category(id),category(base),id);
 assert.equal(findBlock(blocks,'雕文书架').id,'bookshelf');assert.equal(category('tuff_wall'),'wall');
});
test('普通、染色、带釉陶瓦全部归并为陶瓦',()=>{
 const all=raw.filter(b=>b.id==='terracotta'||/_terracotta$/.test(b.id));assert.equal(all.length,33);assert.equal(byId('terracotta').members.length,33);
 for(const b of all)assert.equal(findBlock(blocks,b.id).name,'陶瓦',b.id);
 assert.equal(findBlock(blocks,'glazed_terracotta').id,'terracotta');assert.equal(findBlock(blocks,'带釉陶瓦').id,'terracotta');assert.ok(!byId('glazed_terracotta'));
});
test('珊瑚包含活体、失活和墙挂变种，只按三种形态出题',()=>{
 const all=raw.filter(b=>/(?:tube|brain|bubble|fire|horn)_coral/.test(b.id));assert.equal(all.length,40);
 for(const b of all){const expected=b.id.endsWith('_fan')?'coral_fan':b.id.endsWith('_block')?'coral_block':'coral';assert.equal(findBlock(blocks,b.id).id,expected,b.id);}
 assert.equal(byId('coral').members.length,10);assert.equal(byId('coral_block').members.length,10);assert.equal(byId('coral_fan').members.length,20);assert.equal(findBlock(blocks,'墙上的失活脑纹珊瑚扇').name,'珊瑚扇');
});
test('所有铜制品去掉氧化和涂蜡细分，保留楼梯等既有归并',()=>{
 const {baseVariant}=require('../catalog.js');
 const variants=raw.filter(b=>/^(?:waxed_)?(?:exposed_|weathered_|oxidized_)/.test(b.id)||b.id.startsWith('waxed_'));
 assert.ok(variants.length>100);
 for(const b of variants){assert.equal(category(b.id),category(baseVariant(b.id)),b.id);assert.equal(findBlock(blocks,b.id).id,category(baseVariant(b.id)),b.id);}
 for(const [id,expected]of [['weathered_copper_grate','copper_grate'],['waxed_oxidized_copper_bulb','copper_bulb'],['exposed_copper','copper_block'],['waxed_weathered_copper_chest','copper_chest'],['oxidized_lightning_rod','lightning_rod'],['waxed_oxidized_cut_copper_slab','stairs']])assert.equal(findBlock(blocks,id).id,expected,id);
 assert.equal(findBlock(blocks,'斑驳的铜格栅').name,'铜格栅');assert.ok(blocks.every(b=>!(/^(waxed_|exposed_|weathered_|oxidized_)/.test(b.id))));
});
test('盆栽只作植物别名，不出盆栽题，也不把花盆物理属性混入植物',()=>{
 const all=raw.filter(b=>b.id.startsWith('potted_'));assert.equal(all.length,39);
 for(const b of all)assert.ok(findBlock(blocks,b.id)&&!findBlock(blocks,b.id).id.startsWith('potted_'),b.id);
 assert.equal(findBlock(blocks,'虞美人盆栽').name,'花');assert.equal(findBlock(blocks,'橡树树苗盆栽').id,'sapling');assert.equal(findBlock(blocks,'potted_cactus').id,'cactus');assert.equal(findBlock(blocks,'flower_pot').name,'花盆');
 assert.equal(byId('flower').stack,64);assert.equal(byId('cactus').hardness,.4);assert.equal(byId('cactus').stack,64);
});
test('已有分类存档随新规则归并、去重，并在首次命中后结束',()=>{
 const {restoreState}=require('../core.js');
 assert.deepEqual(restoreState({targetId:'diamond_block',guesses:['glazed_terracotta','white_terracotta','weathered_copper_grate','copper_grate']},blocks),{targetId:'diamond_block',guesses:['terracotta','copper_grate']});
 assert.deepEqual(restoreState({targetId:'dandelion',guesses:['stone','poppy','gold_ore']},blocks),{targetId:'flower',guesses:['stone','flower']});
 assert.equal(restoreState({targetId:'unknown',guesses:[]},blocks),null);assert.equal(restoreState({targetId:'flower',guesses:[null]},blocks),null);
});
test('部分属性按所有成员汇总，而非随意选一个代表的属性',()=>{
 const template=raw.find(b=>b.id==='stone');const a={...template,id:'a',light:0,renewable:0,tool:'镐'},b={...template,id:'b',light:15,renewable:1,tool:'斧'};
 const result=aggregate([a,b],'example');assert.equal(result.light,'partial');assert.equal(result.renewable,'partial');assert.equal(result.full,1);assert.equal(result.tool,'镐/斧');
 assert.equal(aggregate([{...a,light:7},{...b,light:15}],'example').light,1);assert.equal(aggregate([a,{...b,light:0}],'example').light,0);
});
test('爆炸抗性和硬度按范围中点提示高低，范围相同才匹配',()=>{
 const a={...byId('stairs'),hardness:{min:1,max:3}},b={...a,hardness:{min:4,max:6}};
 const cell=(x,y)=>compare(x,y).find(c=>c.key==='hardness');assert.equal(cell(a,b).direction,'up');assert.equal(cell(b,a).direction,'down');assert.equal(cell(a,{...a,hardness:{min:2,max:4}}).direction,'up');assert.ok(cell(a,{...a,hardness:{min:1,max:3}}).match);assert.equal(cell(a,{...a,hardness:3}).direction,'up');
 assert.equal(cell(a,{...a,hardness:-1}).direction,'up');
 for(const key of ['hardness','resistance']){
  const target={...a,[key]:{min:2,max:6}},get=value=>compare({...a,[key]:value},target).find(c=>c.key===key);
  assert.equal(get(3).direction,'up');assert.equal(get(5).direction,'down');
  assert.equal(get({min:1,max:5}).direction,'up');assert.equal(get({min:3,max:7}).direction,'down');
  assert.equal(get(4).direction,'');assert.equal(get(4).match,false);
  assert.equal(get({min:1,max:7}).direction,'');assert.equal(get({min:1,max:7}).match,false);
  assert.ok(get({min:2,max:6}).match);assert.equal(get({min:2,max:6}).direction,'');
 }
 assert.equal(cell({...a,hardness:-1},a).direction,'down');
 assert.equal(cell({...a,hardness:{min:1,max:-1}},{...a,hardness:-1}).direction,'');
});
test('版本只显示主系列，组别采用最早出现时间',()=>{
 const versions=require('../version-groups.js');assert.equal(versions['20w45a'],'1.17');assert.equal(versions['25w31a'],'1.21');assert.equal(versions['23w07a'],'1.20');
 assert.equal(byId('log').version,'pre-alpha');assert.equal(byId('stairs').version,'pre-alpha');assert.equal(byId('amethyst_block').version,'1.17');assert.equal(byId('ancient_debris').version,'1.16');assert.equal(byId('sulfur').version,'26.2');
 for(const [a,b]of [['alpha','pre-alpha'],['beta','alpha'],['1.0','beta'],['1.17','1.8'],['26.3','1.21']])assert.equal(compareVersion(a,b),1);
});
test('旧分类模式兼容：别名归并、重复变体不占次数、命中结束',()=>{
 const state={targetId:'diamond_block',guesses:[]};const a=findBlock(blocks,'橡木原木'),b=findBlock(blocks,'金合欢原木');assert.equal(submit(state,a.id),'guess');assert.equal(submit(state,b.id),'duplicate');assert.deepEqual(state.guesses,['log']);
 const winning={targetId:'stairs',guesses:[]};assert.equal(submit(winning,findBlock(blocks,'cut_copper_slab').id),'won');assert.equal(submit(winning,'stone'),'finished');
 assert.equal(search(blocks,'原木').filter(b=>b.id==='log').length,1);assert.equal(search(blocks,'black_concrete_slab')[0].id,'stairs');assert.equal(findBlock(blocks,'不存在的原木'),undefined);
});
