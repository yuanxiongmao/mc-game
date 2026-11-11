/* Gameplay categories: every raw registry block belongs to exactly one category. */
(function(root){
const node=typeof module!=='undefined';
const source=node?require('./data.js'):root.BlockData;
const versions=node?require('./version-groups.js'):root.BlockVersionGroups;
const game=node?require('./core.js'):root.BlockGame;
const wood='(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|pale_oak|poplar|bamboo|crimson|warped)';
const woodBlock=new RegExp('^(?:stripped_)?'+wood+'_(.+)$');
const colors='(?:white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)';
const dyed=new RegExp('^'+colors+'_(wool|carpet|bed|candle|candle_cake|concrete|concrete_powder|terracotta|glazed_terracotta|shulker_box|banner|wall_banner|stained_glass|stained_glass_pane)$');
const labels={log:'原木',planks:'木板',stairs:'楼梯',leaves:'树叶',sapling:'树苗',shelf:'置物架',door:'门',trapdoor:'活板门',button:'按钮',pressure_plate:'压力板',fence:'栅栏',fence_gate:'栅栏门',wall:'墙',sign:'告示牌',hanging_sign:'悬挂式告示牌',wool:'羊毛',carpet:'地毯',bed:'床',candle:'蜡烛',candle_cake:'插上蜡烛的蛋糕',concrete:'混凝土',concrete_powder:'混凝土粉末',terracotta:'陶瓦',glazed_terracotta:'带釉陶瓦',shulker_box:'潜影盒',banner:'旗帜',glass:'玻璃',glass_pane:'玻璃板',stone:'石头',cobblestone:'圆石',stone_bricks:'石砖',sandstone:'砂岩',obsidian:'黑曜石',infested_block:'虫蚀方块'};
const stone=new Set('stone smooth_stone granite polished_granite diorite polished_diorite andesite polished_andesite deepslate polished_deepslate blackstone polished_blackstone basalt polished_basalt smooth_basalt tuff polished_tuff calcite end_stone chiseled_polished_blackstone'.split(' '));
const naturalStone=new Set('stone granite diorite andesite deepslate blackstone basalt smooth_basalt tuff calcite end_stone'.split(' '));
labels.worked_stone='加工石材';
const masonry=new Set('stone_bricks mossy_stone_bricks cracked_stone_bricks chiseled_stone_bricks deepslate_bricks cracked_deepslate_bricks chiseled_deepslate deepslate_tiles cracked_deepslate_tiles polished_blackstone_bricks cracked_polished_blackstone_bricks nether_bricks red_nether_bricks cracked_nether_bricks chiseled_nether_bricks end_stone_bricks tuff_bricks chiseled_tuff chiseled_tuff_bricks'.split(' '));
Object.assign(labels,{flower:'花',coral:'珊瑚',coral_block:'珊瑚块',coral_fan:'珊瑚扇'});
const flowers=new Set('dandelion golden_dandelion poppy blue_orchid allium azure_bluet red_tulip orange_tulip white_tulip pink_tulip oxeye_daisy cornflower lily_of_the_valley wither_rose sunflower lilac rose_bush peony torchflower torchflower_crop pitcher_plant pitcher_crop pink_petals wildflowers cactus_flower open_eyeblossom closed_eyeblossom spore_blossom azalea flowering_azalea'.split(' '));
function baseVariant(id){
 if(id.startsWith('potted_'))return ({azalea_bush:'azalea',flowering_azalea_bush:'flowering_azalea'})[id.slice(7)]||id.slice(7);
 let base=id.replace(/(^|_)wall_/g,'$1');
 base=base.replace(/^waxed_/,'').replace(/^(exposed|weathered|oxidized)_/,'');
 base=base.replace(/(^|_)chiseled_/g,'$1');
 if(base==='copper')base='copper_block';
 return base;
}
function category(id){
 if(['air','cave_air','void_air'].includes(id))return 'air';
 if(['command_block','chain_command_block','repeating_command_block'].includes(id))return 'command_block';
 const base=baseVariant(id);if(base!==id)return category(base);
 if(flowers.has(id))return 'flower';
 const coral=id.match(/^(?:dead_)?(?:tube|brain|bubble|fire|horn)_coral(_block|_fan)?$/);if(coral)return 'coral'+(coral[1]||'');
 if(/_(stairs|slab)$/.test(id))return 'stairs';
 if(/^infested_/.test(id))return 'infested_block';
 const w=id.match(woodBlock);
 if(w){if(['log','wood','stem','hyphae','block'].includes(w[1]))return 'log';if(['planks','mosaic'].includes(w[1]))return 'planks';if(w[1]==='wall_hanging_sign')return 'hanging_sign';if(w[1]==='wall_sign')return 'sign';if(labels[w[1]])return w[1];}
 if(/_leaves$/.test(id))return 'leaves';
 if(id==='mangrove_propagule')return 'sapling';
 if(/_fence_gate$/.test(id))return 'fence_gate';
 if(/_fence$/.test(id))return 'fence';
 if(/_wall$/.test(id))return 'wall';
 if(/_pressure_plate$/.test(id))return 'pressure_plate';
 if(/_button$/.test(id))return 'button';
 if(/_trapdoor$/.test(id))return 'trapdoor';
 if(/_door$/.test(id))return 'door';
 const dye=id.match(dyed);if(dye){const type=dye[1];return ({wall_banner:'banner',stained_glass:'glass',stained_glass_pane:'glass_pane',glazed_terracotta:'terracotta'})[type]||type;}
 if(naturalStone.has(id))return id;
 if(stone.has(id))return 'worked_stone';
 if(masonry.has(id))return 'stone_bricks';
 if(/^(?:mossy_cobblestone|cobblestone|cobbled_deepslate)$/.test(id))return 'cobblestone';
 if(/^(?:chiseled_|cut_|smooth_)?(?:red_)?sandstone$/.test(id))return 'sandstone';
 if(['quartz_block','chiseled_quartz_block','quartz_pillar','smooth_quartz','quartz_bricks'].includes(id))return 'quartz_block';
 if(['prismarine','dark_prismarine','prismarine_bricks'].includes(id))return 'prismarine';
 for(const material of ['cinnabar','sulfur'])if([material,'polished_'+material,'chiseled_'+material,material+'_bricks'].includes(id))return material;
 if(id==='crying_obsidian')return 'obsidian';
 return id;
}
const flags=['renewable','full','flammable','spread','transparent'];
const toolOrder=['镐','斧','锹','锄','剪刀','剑','任意','不可挖掘'];
function mixed(values){const unique=[...new Set(values)];return unique.length===1?unique[0]:'partial';}
function range(values,key){const ordered=[...values].sort((a,b)=>(key==='hardness'&&a<0?Infinity:a)-(key==='hardness'&&b<0?Infinity:b));const min=ordered[0],max=ordered.at(-1);return min===max?min:{min,max};}
function aggregate(members,id){
 // Potted plants remain input aliases, but their pots must not alter plant properties.
 const contributors=members.filter(b=>!b.id.startsWith('potted_'));if(!contributors.length)throw Error('没有非盆栽成员：'+id);
 const base=contributors.find(b=>b.id===id)||contributors.find(b=>b.id==='white_'+id)||contributors[0];
 const result={id,name:labels[id]||base.name,color:base.color,members:members.map(b=>b.id),aliases:[...new Set(members.flatMap(b=>[b.id,b.name]))]};
 if(id==='log')result.aliases.push('木头','原木','log','logs');
 if(id==='planks')result.aliases.push('木板','planks');
 if(id==='stairs')result.aliases.push('楼梯','台阶','stairs','slab','slabs','石楼梯','木楼梯','铜楼梯','石台阶','木台阶','铜台阶');
 if(id==='terracotta')result.aliases.push('glazed_terracotta','带釉陶瓦');
 for(const alias of [...result.aliases]){if(alias.includes('雕纹'))result.aliases.push(alias.replaceAll('雕纹','雕文'));}
 for(const key of flags)result[key]=mixed(contributors.map(b=>b[key]));
 result.tool=toolOrder.filter(t=>contributors.some(b=>b.tool===t)).join('/');
 result.light=mixed(contributors.map(b=>Number(b.light>0)));
 for(const key of ['resistance','hardness','stack'])result[key]=range(contributors.map(b=>b[key]),key);
 const allVersions=contributors.map(b=>versions[b.version]);if(allVersions.some(v=>!v))throw Error('Missing grouped version: '+id);
 result.version=allVersions.sort(game.compareVersion)[0];
 return result;
}
function buildCatalog(rawBlocks){const groups=new Map();for(const block of rawBlocks){const id=category(block.id);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(block);}return [...groups].map(([id,members])=>aggregate(members,id));}
const blocks=buildCatalog(source.blocks);
const metadata={...source.metadata,rawBlockCount:source.blocks.length,blockCount:blocks.length,versionCount:new Set(blocks.map(b=>b.version)).size,mode:'categories',versionPolicy:'按类别最早成员的主版本归类，不显示快照或小版本'};
const api={blocks,metadata,baseVariant,category,aggregate,buildCatalog};if(node)module.exports=api;else root.BlockCatalog=api;
})(globalThis);
