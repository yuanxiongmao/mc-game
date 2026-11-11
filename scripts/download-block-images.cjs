// Save upstream images locally; gameplay never needs a network connection.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),{blocks}=require('../catalog.js');
const tree=require('../sources/icon-tree.json');
const icons=new Map(tree.tree.filter(x=>/^public\/assets\/(20-blocks|10-items)\//.test(x.path)&&/\.png$/.test(x.path)).map(x=>[path.basename(x.path,'.png').replaceAll('-','_'),x.path]));
const preferred={button:'oak_button',door:'oak_door',fence:'oak_fence',fence_gate:'oak_fence_gate',hanging_sign:'oak_hanging_sign',leaves:'oak_leaves',log:'oak_log',planks:'oak_planks',pressure_plate:'oak_pressure_plate',sapling:'oak_sapling',sign:'oak_sign',stairs:'oak_stairs',trapdoor:'oak_trapdoor',wall:'cobblestone_wall',flower:'poppy',bed:'red_bed',banner:'white_banner',carpet:'white_carpet',concrete:'white_concrete',concrete_powder:'white_concrete_powder',wool:'white_wool',worked_stone:'smooth_stone',infested_block:'infested_stone',coral:'tube_coral',coral_block:'tube_coral_block',coral_fan:'tube_coral_fan',iron_chain:'chain'};
const technical=new Set(['air','cave_air','void_air','moving_piston']);
const textureAliases={water:'water_still',lava:'lava_still',bubble_column:'water_still',end_gateway:'end_portal',fire:'fire_0',soul_fire:'soul_fire_0',nether_portal:'nether_portal',cave_vines_plant:'cave_vines',kelp_plant:'kelp',twisting_vines_plant:'twisting_vines',weeping_vines_plant:'weeping_vines',carrots:'carrots_stage3',potatoes:'potatoes_stage3',beetroots:'beetroots_stage3',cocoa:'cocoa_stage2',sweet_berry_bush:'sweet_berry_bush_stage3',tall_seagrass:'tall_seagrass_top',shelf:'oak_shelf',redstone_wire:'redstone_dust_dot',sulfur:'sulfur',potent_sulfur:'potent_sulfur',copper_chest:'copper_block',copper_golem_statue:'copper_block',straw_bed:'hay_block_top',candle_cake:'cake_top',lava_cauldron:'lava_still',water_cauldron:'water_still',powder_snow_cauldron:'powder_snow'};
fs.mkdirSync(path.join(root,'assets/blocks'),{recursive:true});
async function download(url,dest){
 if(fs.existsSync(dest))return true;
 const r=await fetch(url,{signal:AbortSignal.timeout(25000)});
 if(!r.ok)return false;
 const b=Buffer.from(await r.arrayBuffer());if(b.readUInt32BE(0)!==0x89504e47)return false;
 fs.writeFileSync(dest,b);return true;
}
const manifestPath=path.join(root,'sources/block-images.json');
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{};
(async()=>{
 let cursor=0;
 await Promise.all(Array.from({length:5},async()=>{while(cursor<blocks.length){const block=blocks[cursor++],id=block.id;
  const saved=manifest[id];if(saved&&(saved.kind==='invisible'||fs.existsSync(path.join(root,`assets/blocks/${id}.${saved.ext||'png'}`))))continue;
  if(technical.has(id)){manifest[id]={kind:'invisible'};continue;}
  const candidates=[preferred[id],id,...block.members].filter(Boolean),representative=candidates.find(x=>icons.has(x));
  const dest=path.join(root,`assets/blocks/${id}.png`);
  try{
   if(representative&&await download(`https://raw.githubusercontent.com/Webisso/minecraft-item-icons/${tree.sha}/${icons.get(representative)}`,dest)){manifest[id]={kind:'render',representative,source:icons.get(representative)};continue;}
   if(await download(`https://blockrender.dev/render/block/${preferred[id]||id}.png?size=128`,dest)){manifest[id]={kind:'render',representative:preferred[id]||id,source:'https://blockrender.dev/'};continue;}
   const texture=textureAliases[id]||id;
   if(await download(`https://raw.githubusercontent.com/misode/mcmeta/26.3-assets/assets/minecraft/textures/block/${texture}.png`,dest)){manifest[id]={kind:'texture',representative:texture,source:'misode/mcmeta/26.3-assets'};continue;}
   console.error('Missing:',id);
  }catch(e){console.error(id,e.message);}
 }}));
 fs.writeFileSync(path.join(root,'sources/block-images.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(root,'block-images.js'),'/* Local Minecraft image metadata. See SOURCES.md. */\nconst BlockImages='+JSON.stringify(manifest)+';\n');
 console.log('Images:',Object.keys(manifest).length,'/',blocks.length);
})();
