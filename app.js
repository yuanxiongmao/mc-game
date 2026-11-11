'use strict';
const {blocks,metadata}=BlockCatalog;
const {fields,compare,search,newGame,isFinished,endGame,submitField,restoreState}=BlockGame;
const $=id=>document.getElementById(id);
const storageKey='block-detective-categories-v1';
let state;
try{state=restoreState(JSON.parse(localStorage.getItem(storageKey)),blocks);}catch{}
if(!state)state=null;
if(state){state.mode='free-text';if(!Array.isArray(state.inputs))state.inputs=state.guesses.map(()=> '');}

function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{$('notice').textContent='浏览器无法保存进度，本局仍可正常游玩。';}}
function icon(block){
 const info=BlockImages[block.id],frame=document.createElement('div');frame.className='block-preview';
 const img=document.createElement('img');img.className='block-icon';img.width=64;img.height=64;
 img.src=info.kind==='invisible'?'assets/blocks/invisible.svg':`assets/blocks/${block.id}.${info.ext||'png'}`;
 img.alt=info.kind==='invisible'?`${block.name}：无可见外观`:info.kind==='texture'?`${block.name}的纹理预览`:`${block.name}的方块外观`;
 frame.append(img);
 const caption=document.createElement('small');caption.textContent=info.kind==='invisible'?'无可见外观':info.kind==='texture'?'纹理预览':block.members.length>1?'代表外观':'';
 if(caption.textContent)frame.append(caption);return frame;
}
function blockLabel(block,order,input){
 const wrap=document.createElement('div');wrap.className='guess-identity';const n=document.createElement('span');n.className='guess-order';n.textContent=String(order).padStart(2,'0');wrap.append(n,icon(block));
 const text=document.createElement('div');text.className='guess-name';const heading=document.createElement('h3');heading.textContent=block.name;text.append(heading);
 const en=document.createElement('small');en.className='block-en';en.textContent=block.id+(block.members.length>1?` · ${block.members.length} 个变体`:'');text.append(en);
 if(input){const submitted=document.createElement('small');submitted.className='submitted-field';submitted.textContent=`输入：${input}`;submitted.title=input;text.append(submitted);}
 wrap.append(text);return wrap;
}
function format(key,value){if(value==='partial')return '部分';if(value&&typeof value==='object')return `${format(key,value.min)} ～ ${format(key,value.max)}`;if(['renewable','full','flammable','spread','transparent'].includes(key))return value?'是':'否';if(key==='light')return value===0?'不发光':'发光';if(key==='stack')return value===0?'无物品形态':`${value} 个`;if(key==='hardness'&&value<0)return '不可破坏';return String(value);}
function render(){
 const target=state?blocks.find(b=>b.id===state.targetId):null,guesses=state?.guesses||[],won=!!target&&guesses.includes(target.id);$('history').replaceChildren();
 [...guesses].reverse().forEach((id,i)=>{
  const index=state.guesses.length-1-i,block=blocks.find(b=>b.id===id),row=document.createElement('article');row.className='guess-card';
  row.setAttribute('aria-label',`第 ${index+1} 次猜测：${block.name}`);row.append(blockLabel(block,index+1,state.inputs?.[index]));
  const attributes=document.createElement('dl');attributes.className='guess-attributes';row.append(attributes);
  for(const cell of compare(block,target)){
   const attribute=document.createElement('div');attribute.className='guess-attribute';const label=document.createElement('dt');label.textContent=cell.label;
   const td=document.createElement('dd');td.className=cell.match?'match-text':'miss-text';const status=document.createElement('span');status.className='cell-status';status.textContent=cell.match?'✓':'×';td.append(status,format(cell.key,cell.value));
   let direction='';if(cell.direction){direction=cell.direction==='up'?'答案更高 / 更新':'答案更低 / 更早';const arrow=document.createElement('span');arrow.className='direction';arrow.textContent=cell.direction==='up'?'↑':'↓';td.append(arrow);}
   td.setAttribute('aria-label',`${cell.label}：${format(cell.key,cell.value)}，${cell.match?'匹配':'不匹配'}${direction?'，'+direction:''}`);td.title=td.getAttribute('aria-label');attribute.append(label,td);attributes.append(attribute);
  }
  $('history').append(row);
 });
 $('empty-state').hidden=guesses.length>0;$('history').hidden=guesses.length===0;$('guess-count').textContent=`${guesses.length} 次猜测`;
 const finished=!!state&&isFinished(state),active=!!state&&!finished;
 $('library-button').hidden=active;if(active&&$('library-dialog').open)$('library-dialog').close();
 $('win-panel').hidden=!finished;$('guess-input').disabled=!active;$('guess-button').disabled=!active;$('end-round').hidden=!active;$('start-game').hidden=active;
 $('empty-title').textContent=state?'第一个线索，等你发现':'准备好探索方块世界了吗？';
 $('empty-description').textContent=state?'输入一个字段，提交后查看系统选中的方块。':'点击“开始游戏”，系统才会选定目标方块。';
 $('round-label').textContent=finished?'本局已结束':!state?'等待开始游戏':state.guesses.length?`已提交 ${state.guesses.length} 个字段`:'输入字段，直接提交';
 if(won){$('win-title').textContent=`找到了！是${target.name}`;$('win-description').textContent=`你用了 ${state.guesses.length} 次猜测。`;}
 else if(finished){$('win-title').textContent=`本局已结束，答案是${target.name}`;$('win-description').textContent=`本局共 ${state.guesses.length} 次猜测，记录已保留。`;}
 save();
}
function guess(field){
 if(!state||isFinished(state))return;
 const outcome=submitField(state,blocks,field);
 if(outcome.result==='empty'){$('notice').textContent='请输入字段后再提交。';return;}
 if(outcome.result==='too-long'){$('notice').textContent='字段最多输入 80 个字符。';return;}
 if(outcome.result==='finished')return;
 $('notice').textContent=outcome.result==='won'?'':`“${outcome.field}”已匹配为“${outcome.block.name}”，记为第 ${state.guesses.length} 次猜测。`;
 $('guess-input').value='';render();if(outcome.result!=='won')$('guess-input').focus();
}
$('guess-input').addEventListener('input',()=>{$('notice').textContent='';});
$('guess-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.isComposing)e.preventDefault();});
$('guess-form').addEventListener('submit',e=>{e.preventDefault();guess($('guess-input').value);});
function startGame(){if(state&&!isFinished(state))return;state={...newGame(blocks,state?.targetId),mode:'free-text',inputs:[]};$('guess-input').value='';$('notice').textContent='';render();$('guess-input').focus();}
$('start-game').addEventListener('click',startGame);
$('end-round').addEventListener('click',()=>{if(state&&!isFinished(state))$('end-dialog').showModal();});
$('confirm-end').addEventListener('click',()=>{$('end-dialog').close();if(state&&endGame(state)){$('notice').textContent='';$('guess-input').value='';render();$('start-game').focus();}});

let libraryPage=0;
const libraryPageSize=24;
function renderLibrary(){
 const matches=search(blocks,$('library-search').value),pages=Math.max(1,Math.ceil(matches.length/libraryPageSize));
 libraryPage=Math.max(0,Math.min(libraryPage,pages-1));$('library-grid').replaceChildren();
 for(const block of matches.slice(libraryPage*libraryPageSize,(libraryPage+1)*libraryPageSize)){
  const card=document.createElement('article');card.className='library-card';
  const content=document.createElement('div');content.className='library-content';
  const heading=document.createElement('h3');heading.textContent=block.name;
  const id=document.createElement('small');id.textContent=block.id+(block.members.length>1?` · ${block.members.length} 个变体`:'');
  const properties=document.createElement('dl');properties.className='library-properties';
  for(const [key,label]of fields){const item=document.createElement('div'),term=document.createElement('dt'),value=document.createElement('dd');term.textContent=label;value.textContent=format(key,block[key]);item.append(term,value);properties.append(item);}
  content.append(heading,id,properties);card.append(icon(block),content);$('library-grid').append(card);
 }
 $('library-empty').hidden=matches.length>0;
 $('library-count').textContent=`共 ${matches.length} 类 · 第 ${libraryPage+1} / ${pages} 页`;
 $('library-prev').disabled=libraryPage===0;$('library-next').disabled=libraryPage>=pages-1;
 $('library-grid').scrollTop=0;
}
$('library-button').addEventListener('click',()=>{if(state&&!isFinished(state))return;libraryPage=0;$('library-search').value='';renderLibrary();$('library-dialog').showModal();$('library-search').focus();});
$('library-search').addEventListener('input',()=>{libraryPage=0;renderLibrary();});
$('library-prev').addEventListener('click',()=>{libraryPage--;renderLibrary();});
$('library-next').addEventListener('click',()=>{libraryPage++;renderLibrary();});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
$('rules-button').addEventListener('click',()=>$('rules-dialog').showModal());

$('dataset-description').textContent=`题库基于 Java ${metadata.gameVersion}，将 ${metadata.rawBlockCount} 个原始方块归并为 ${blocks.length} 个猜测类别。输入具体变体名称时，也会识别为对应类别。`;
render();
