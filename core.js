(function(root){
const versionDates=(typeof module!=='undefined'?require('./data.js'):root.BlockData).versionDates||{};
const fields = [
['renewable','可再生'],['tool','挖掘工具'],['light','发光性质'],['full','完整方块'],['flammable','可燃'],['spread','火焰传播'],['transparent','透明'],['stack','堆叠数量'],['resistance','爆炸抗性'],['hardness','硬度'],['version','初始版本']
];
function versionRank(v) {
  if(['pre-alpha','alpha','beta'].includes(v))return [{'pre-alpha':0,alpha:4,beta:5}[v],0];
  if(/^rd-/.test(v)){const digits=v.slice(3);return [0,Number(digits.length===6?'200905'+digits.slice(0,2)+digits.slice(2):digits+'0000')];}
  if(v==='Classic'||v==='Indev'||v==='Infdev'||v==='Alpha')return [{Classic:1,Indev:2,Infdev:3,Alpha:4}[v],0];
  if(/^Classic /.test(v))return [1,...(v.match(/\d+/g)||[]).map(Number)];
  if(/^(Indev|Infdev) /.test(v))return [v.startsWith('Indev')?2:3,Number(v.match(/\d{8}/)?.[0]||0),Number(v.match(/-(\d{4})/)?.[1]||0)];
  if(/^(Alpha|Beta) /.test(v)){const nums=v.match(/(?:\d+\.)*\d+/g)?.[0].split('.').map(Number)||[];const pre=v.match(/(?:Prerelease|Pre-release|Test Build|preview)\s*(\d*)/i);const suffix=pre?-100+Number(pre[1]||0):Number(v.match(/_(\d+)/)?.[1]||0);return [v.startsWith('Alpha')?4:5,...[nums[0]||0,nums[1]||0,nums[2]||0],suffix];}
  if(Number.isFinite(versionDates[v]))return [6,versionDates[v]];
  const snapshot=v.match(/^(\d{2})w(\d{2})([a-z])$/);
  if(snapshot){const year=2000+Number(snapshot[1]);const jan4=new Date(Date.UTC(year,0,4));const monday=+jan4-((jan4.getUTCDay()+6)%7)*86400000;return [6,monday+((Number(snapshot[2])-1)*7+3)*86400000+(snapshot[3].charCodeAt(0)-97)*3600000];}
  const release=v.match(/^(\d+(?:\.\d+)*?)(?:-(?:pre|rc|snapshot-)(\d+))?$/);
  if(release&&Number.isFinite(versionDates[release[1]]))return [6,versionDates[release[1]]-(release[2]?86400000-Number(release[2])*1000:0)];
  throw new Error('无法排序的版本：'+v);
}
function compareVersion(a,b) { const ax=a.match(/^(\d{2}w\d{2})([a-z])$/),bx=b.match(/^(\d{2}w\d{2})([a-z])$/);if(ax&&bx&&ax[1]===bx[1])return Math.sign(ax[2].charCodeAt(0)-bx[2].charCodeAt(0));const x=versionRank(a),y=versionRank(b); for(let i=0;i<Math.max(x.length,y.length);i++) if((x[i]||0)!==(y[i]||0)) return Math.sign((x[i]||0)-(y[i]||0)); return 0; }
function numericRank(key,value){return key==='hardness'&&value<0?Infinity:value;}
function bounds(key,value){const values=value&&typeof value==='object'?[value.min,value.max]:[value,value];const ranks=values.map(v=>numericRank(key,v));return [Math.min(...ranks),Math.max(...ranks)];}
function midpoint(bounds){const [min,max]=bounds;return min===max||max===Infinity?max:min+(max-min)/2;}
function compare(guess,target) {
  return fields.map(([key,label])=>{
    const numeric=['stack','resistance','hardness'].includes(key);
    const a=numeric?bounds(key,guess[key]):null,b=numeric?bounds(key,target[key]):null;
    const match=key==='version'?compareVersion(guess[key],target[key])===0:numeric?a[0]===b[0]&&a[1]===b[1]:guess[key]===target[key];
    let direction='';
    if(!match && ['resistance','hardness','version'].includes(key)) {
      if(key==='version')direction=compareVersion(target[key],guess[key])>0?'up':'down';
      else {const reference=midpoint(b),guessed=midpoint(a);direction=reference>guessed?'up':reference<guessed?'down':'';}
    }
    return {key,label,value:guess[key],match,direction};
  });
}
function normalize(s){return s.trim().toLowerCase().replace(/^minecraft:/,'').replace(/[\s_-]/g,'');}
function findBlock(blocks,s){const n=normalize(s);return blocks.find(b=>normalize(b.id)===n||normalize(b.name)===n)||blocks.find(b=>(b.aliases||[]).some(alias=>normalize(alias)===n));}
function search(blocks,s){const n=normalize(s);const exact=findBlock(blocks,s);const found=blocks.filter(b=>[b.id,b.name,...(b.aliases||[])].some(alias=>normalize(alias).includes(n)));return exact?[exact,...found.filter(b=>b.id!==exact.id)]:found;}
function editDistance(a,b){
 const x=Array.from(a),y=Array.from(b);let prev=Array.from({length:y.length+1},(_,i)=>i),before;
 for(let i=1;i<=x.length;i++){const row=[i];for(let j=1;j<=y.length;j++){row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+Number(x[i-1]!==y[j-1]));if(i>1&&j>1&&x[i-1]===y[j-2]&&x[i-2]===y[j-1])row[j]=Math.min(row[j],before[j-2]+1);}before=prev;prev=row;}
 return prev[y.length];
}
function textScore(query,label){
 if(query===label)return 1;
 const ratio=Math.min(query.length,label.length)/Math.max(query.length,label.length);
 if(label.startsWith(query))return .90+.05*ratio;
 if(label.includes(query))return .80+.05*ratio;
 if(query.includes(label))return .70+.05*ratio;
 return .60*(1-editDistance(query,label)/Math.max(query.length,label.length));
}
function bestMatch(blocks,input){
 const query=normalize(input.normalize('NFKC'));if(!query||!blocks.length)return null;
 let best=null;
 for(const block of blocks){const primary=new Set([normalize(block.name),normalize(block.id)]);const names=[...new Set([...primary,...(block.aliases||[]).map(normalize)])].filter(Boolean);
  for(const label of names){const candidate={block,score:textScore(query,label),primary:Number(primary.has(label)),label};
   if(!best||candidate.score>best.score||candidate.score===best.score&&(candidate.primary>best.primary||candidate.primary===best.primary&&(candidate.label.length<best.label.length||candidate.label.length===best.label.length&&candidate.block.id<best.block.id)))best=candidate;
  }
 }
 return best;
}
function newGame(blocks,previousId,random=Math.random){const pool=blocks.filter(b=>b.id!==previousId);return {targetId:pool[Math.floor(random()*pool.length)].id,guesses:[]};}
function isFinished(state){return state.ended===true||state.guesses.includes(state.targetId);}
function endGame(state){if(isFinished(state))return false;state.ended=true;return true;}
function submit(state,id,{allowDuplicate=false}={}){if(isFinished(state))return 'finished';if(!allowDuplicate&&state.guesses.includes(id))return 'duplicate';state.guesses.push(id);return id===state.targetId?'won':'guess';}
function submitField(state,blocks,input){
 if(isFinished(state))return {result:'finished'};
 const field=input.trim();if(!field||!normalize(field))return {result:'empty'};if(field.length>80)return {result:'too-long'};
 const selected=bestMatch(blocks,field);if(!selected)return {result:'empty'};
 const result=submit(state,selected.block.id,{allowDuplicate:true});
 if(!Array.isArray(state.inputs))state.inputs=Array.from({length:state.guesses.length-1},()=> '');
 state.inputs.push(field);state.mode='free-text';return {result,block:selected.block,field};
}
function restoreState(saved,blocks){
 if(!saved||typeof saved.targetId!=='string'||!Array.isArray(saved.guesses)||saved.guesses.some(id=>typeof id!=='string'))return null;
 const free=saved.mode==='free-text';if(free&&(!Array.isArray(saved.inputs)||saved.inputs.length!==saved.guesses.length||saved.inputs.some(s=>typeof s!=='string'||s.length>80)))return null;
 const target=findBlock(blocks,saved.targetId);const guesses=saved.guesses.map(id=>findBlock(blocks,id));if(!target||guesses.some(b=>!b))return null;
 const state={targetId:target.id,guesses:[]};if(free){state.mode='free-text';state.inputs=[];}
 for(let i=0;i<guesses.length;i++){const result=submit(state,guesses[i].id,{allowDuplicate:free});if(free)state.inputs.push(saved.inputs[i]);if(result==='won')break;}
 if(saved.ended===true)endGame(state);
 return state;
}
const api={fields,versionRank,compareVersion,compare,normalize,findBlock,search,editDistance,bestMatch,newGame,isFinished,endGame,submit,submitField,restoreState};
if(typeof module!=='undefined')module.exports=api;else root.BlockGame=api;
})(globalThis);
