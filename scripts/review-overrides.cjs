// 人工核对分组历史、名称变更和 Wiki 的条件属性。原文保存在 sources/wiki/。
const fs=require('node:fs'),path=require('node:path');const out={};
function set(ids,fields){for(const id of ids.split(' '))out[id]={...out[id],...fields};}
for(const wood of ['spruce','birch','jungle','acacia','dark_oak']){
 for(const shape of ['button','pressure_plate','trapdoor'])set(`${wood}_${shape}`,{version:'17w47a'});
 set(`${wood}_fence`,{version:'14w32b'});
}
set('acacia_planks dark_oak_planks',{version:'13w43a'});
set('oak_sign oak_wall_sign',{version:'Infdev 20100607'});
set('attached_melon_stem attached_pumpkin_stem',{version:'Beta 1.8 Pre-release'});
set('stone_bricks',{version:'Beta 1.8 Pre-release'});
set('cobweb',{version:'Beta 1.5'});
set('cobblestone',{version:'rd-20090515'});
set('smooth_stone',{version:'13w04a'});
set('dead_brain_coral_block dead_bubble_coral_block dead_fire_coral_block dead_horn_coral_block dead_tube_coral_block',{version:'18w10b'});
set('chiseled_sandstone cut_sandstone',{version:'1.2.4'});
set('cauldron water_cauldron',{version:'Beta 1.9 Prerelease 3'});
set('cocoa',{version:'12w19a'});
set('wheat',{version:'Indev 20100206-2034'});
set('tripwire',{version:'12w22a'});
set('infested_mossy_stone_bricks infested_cracked_stone_bricks infested_chiseled_stone_bricks',{version:'13w36a'});
for(const p of ['allium','azure_bluet','blue_orchid','orange_tulip','oxeye_daisy','pink_tulip','red_tulip','white_tulip'])set('potted_'+p,{version:'13w36a'});
set('potted_acacia_sapling potted_dark_oak_sapling',{version:'13w43a'});
set('potted_bamboo potted_cornflower potted_lily_of_the_valley potted_wither_rose',{version:'18w43a'});
// Registry renames are not new blocks; experimental features count from their first snapshot.
set('beehive',{version:'19w34a'});
set('cave_vines cave_vines_plant flowering_azalea_leaves',{version:'21w05a'});
set('crimson_fungus warped_fungus soul_torch soul_wall_torch soul_lantern',{version:'20w06a'});
const ids=require('../sources/registry-26.3.json');
for(const id of ids){if(/^(?:stripped_)?cherry_|^potted_cherry_|^(?:pink_petals|decorated_pot|suspicious_sand|torchflower|torchflower_crop|potted_torchflower)$/.test(id))set(id,{version:'23w07a'});}
for(const id of ids){if(/^(?:waxed_)?(?:(?:exposed|weathered|oxidized)_)?(?:copper_block|copper|cut_copper(?:_slab|_stairs)?)$/.test(id))set(id,{version:id.startsWith('waxed_oxidized')?'21w14a':'20w45a'});}
set('crimson_nylium warped_nylium netherrack',{renewable:0});
set('decorated_pot sculk_shrieker',{renewable:1});
for(const id of ids.filter(id=>id.startsWith('infested_')))set(id,{renewable:id==='infested_deepslate'?0:1});
// Portal blocks have no obtainable inventory item. Renewal means recreating the block in the world.
set('nether_portal end_portal',{renewable:1});set('end_gateway light',{renewable:0});
fs.writeFileSync(path.resolve(__dirname,'../sources/overrides.json'),JSON.stringify(out,null,2));
console.log('Reviewed overrides:',Object.keys(out).length);
