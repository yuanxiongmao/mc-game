const {get}=require('./download.cjs');const {blocks,versionDates}=require('../data.js');
const missing=[...new Set(blocks.map(b=>b.version))].filter(v=>/^\d\dw\d\d[a-z]$/.test(v)&&!versionDates[v]);
get('wiki-snapshot-dates.json','https://minecraft.wiki/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'revisions',rvprop:'content',rvslots:'main',titles:missing.map(v=>'Java Edition '+v).join('|')})).catch(e=>{console.error(e);process.exitCode=1;});
