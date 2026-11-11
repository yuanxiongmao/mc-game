// Windows + Microsoft Edge，无第三方依赖。node tests/browser-check.cjs
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const root=path.resolve(__dirname,'..');
const browser=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless','--disable-gpu','--no-first-run','--disable-extensions','--no-default-browser-check','--remote-debugging-port=19223',`--user-data-dir=${path.join(root,'.qa-browser')}`],{stdio:['ignore','ignore','pipe'],windowsHide:true});
let nextId=0,socket,diagnostics='';const pending=new Map(),errors=[];
browser.stderr.on('data',d=>{diagnostics+=d.toString();});browser.on('error',e=>{console.error(e.message);process.exit(1);});
const ready=(async()=>{for(let attempt=0;attempt<100;attempt++){try{const info=await(await fetch('http://127.0.0.1:19223/json/version')).json();socket=new WebSocket(info.webSocketDebuggerUrl);socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result);}if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});return;}catch{await new Promise(r=>setTimeout(r,100));}}throw Error('无法连接 Edge：'+diagnostics.slice(-2000));})();
async function send(method,params={},sessionId){await ready;return new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
const timeout=setTimeout(()=>{console.error('浏览器检查超时',errors,diagnostics.slice(-1000));browser.kill();process.exit(1);},25000);
(async()=>{try{
 const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const cdp=(method,params)=>send(method,params,sessionId);
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const waitForApp=()=>evaluate(`new Promise(resolve=>{const ready=()=>{if(document.getElementById('dataset-description')?.textContent.includes('原始方块'))resolve(true);else setTimeout(ready,30)};ready()})`);
 const reset=target=>evaluate(`state={targetId:${JSON.stringify(target)},guesses:[],inputs:[],mode:'free-text'};render()`);
 const submit=field=>evaluate(`document.getElementById('guess-input').value=${JSON.stringify(field)};document.getElementById('guess-form').requestSubmit()`);
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:pathToFileURL(path.join(root,'index.html')).href});await waitForApp();
 await evaluate('localStorage.removeItem(storageKey)');await cdp('Page.reload');await waitForApp();
 assert.ok(await evaluate("state===null&&!document.getElementById('start-game').hidden&&document.getElementById('guess-input').disabled&&document.getElementById('guess-button').disabled&&document.getElementById('end-round').hidden"));
 assert.ok(await evaluate("!document.querySelector('#restart,#restart-dialog,#confirm-restart,#play-again')"));
 await evaluate("guess('石头')");await submit('石头');assert.equal(await evaluate('state'),null);
 await cdp('Page.reload');await waitForApp();assert.equal(await evaluate('state'),null);
 for(const width of [1365,390,320]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));}
 await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:1100,deviceScaleFactor:1,mobile:false});
 await evaluate("document.getElementById('start-game').click()");assert.ok(await evaluate("!!state&&!isFinished(state)&&document.getElementById('start-game').hidden&&!document.getElementById('guess-input').disabled&&!document.getElementById('end-round').hidden"));
 const startedTarget=await evaluate('state.targetId');await evaluate('startGame()');assert.equal(await evaluate('state.targetId'),startedTarget);
 await cdp('Page.reload');await waitForApp();assert.equal(await evaluate('state.targetId'),startedTarget);assert.ok(await evaluate("document.getElementById('start-game').hidden&&!document.getElementById('guess-input').disabled"));
 await reset('diamond_block');
 assert.ok(await evaluate(`document.getElementById('history').hidden`));
 assert.ok(await evaluate(`!document.querySelector('#suggestions, [role="listbox"], datalist, [data-guess]')`));
 assert.equal(await evaluate(`document.getElementById('guess-input').getAttribute('autocomplete')`),'off');
 await evaluate("state=null;render();document.getElementById('library-button').click()");
 assert.ok(await evaluate("document.getElementById('library-dialog').open&&state===null&&document.querySelectorAll('.library-card').length===24"));
 assert.ok(await evaluate("[...document.querySelectorAll('.library-properties')].every(e=>e.children.length===11)"));
 await evaluate("document.getElementById('library-next').click()");assert.ok(await evaluate("document.getElementById('library-count').textContent.includes('第 2 /')"));
 await evaluate("document.getElementById('library-prev').click()");assert.ok(await evaluate("document.getElementById('library-prev').disabled"));
 for(const [query,name]of [['洞穴空气','空气'],['minecraft:diamond_block','钻石块'],['斑驳的铜格栅','铜格栅']]){await evaluate(`document.getElementById('library-search').value=${JSON.stringify(query)};document.getElementById('library-search').dispatchEvent(new Event('input'))`);assert.equal(await evaluate("document.querySelector('.library-content h3')?.textContent"),name);}
 await evaluate("document.getElementById('library-search').value='<img src=x>';document.getElementById('library-search').dispatchEvent(new Event('input'))");assert.ok(await evaluate("!document.getElementById('library-empty').hidden&&document.querySelectorAll('.library-card').length===0&&state===null"));
 await evaluate("document.getElementById('library-search').value='';document.getElementById('library-search').dispatchEvent(new Event('input'))");
 for(const width of [1365,700,390,320]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth&&document.getElementById('library-dialog').scrollWidth<=document.getElementById('library-dialog').clientWidth+1&&[...document.querySelectorAll('.library-card')].every(e=>e.scrollWidth<=e.clientWidth+1)"),'library overflow '+width);}
 const libraryShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'preview-library.png'),Buffer.from(libraryShot.data,'base64'));
 await evaluate("document.querySelector('#library-dialog [data-close]').click();document.getElementById('start-game').click();document.getElementById('library-button').click()");assert.ok(await evaluate("document.getElementById('library-button').hidden&&!document.getElementById('library-dialog').open&&state.guesses.length===0"));
 await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:1100,deviceScaleFactor:1,mobile:false});await reset('diamond_block');
 await evaluate(`document.getElementById('guess-input').value='铜';document.getElementById('guess-input').dispatchEvent(new Event('input'));document.getElementById('guess-input').focus()`);
 assert.equal(await evaluate(`state.guesses.length`),0);assert.ok(await evaluate(`!document.querySelector('[role="option"]')`));
 await submit('铜格');assert.deepEqual(await evaluate(`state.guesses`),['copper_grate']);assert.ok(await evaluate(`document.querySelector('#history .submitted-field').textContent.includes('铜格')`));
 await submit('斑驳的铜格栅');assert.deepEqual(await evaluate(`state.guesses`),['copper_grate','copper_grate']);assert.equal(await evaluate(`document.querySelectorAll('#history .guess-card').length`),2);
 await submit('  ');assert.equal(await evaluate(`state.guesses.length`),2);
 await cdp('Page.reload');await waitForApp();assert.deepEqual(await evaluate(`state.guesses`),['copper_grate','copper_grate']);assert.deepEqual(await evaluate(`state.inputs`),['铜格','斑驳的铜格栅']);
 await reset('diorite');await evaluate(`document.getElementById('guess-input').value='闪长';document.getElementById('guess-input').focus()`);
 await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 assert.deepEqual(await evaluate(`state.guesses`),['diorite']);assert.ok(await evaluate(`!document.getElementById('win-panel').hidden&&document.getElementById('guess-input').disabled`));
 await evaluate(`guess('石头')`);assert.equal(await evaluate(`state.guesses.length`),1);
 await cdp('Page.reload');await waitForApp();assert.deepEqual(await evaluate(`state.inputs`),['闪长']);assert.ok(await evaluate(`document.getElementById('win-title').textContent.includes('闪长岩')`));
 await evaluate(`document.getElementById('start-game').click()`);assert.equal(await evaluate(`state.guesses.length`),0);
 await reset('diamond_block');await submit('石头');
 await evaluate(`document.getElementById('end-round').click()`);assert.ok(await evaluate(`document.getElementById('end-dialog').open`));
 await evaluate(`document.querySelector('#end-dialog [data-close]').click()`);assert.ok(await evaluate(`!isFinished(state)&&document.getElementById('win-panel').hidden`));
 await evaluate(`document.getElementById('end-round').click();document.getElementById('confirm-end').click()`);
 assert.ok(await evaluate(`!document.getElementById('library-button').hidden`));assert.deepEqual(await evaluate(`state.guesses`),['stone']);assert.ok(await evaluate(`document.getElementById('win-title').textContent.includes('本局已结束，答案是钻石块')&&document.getElementById('guess-input').disabled&&document.getElementById('guess-button').disabled&&document.getElementById('end-round').hidden`));
 await evaluate(`guess('钻石块')`);assert.equal(await evaluate(`state.guesses.length`),1);
 await cdp('Page.reload');await waitForApp();assert.ok(await evaluate(`state.ended===true&&!document.getElementById('win-panel').hidden&&document.getElementById('win-title').textContent.includes('钻石块')`));
 assert.ok(await evaluate(`!document.getElementById('start-game').hidden&&document.getElementById('guess-input').disabled`));await evaluate(`document.getElementById('start-game').click()`);assert.ok(await evaluate(`!isFinished(state)&&!document.getElementById('guess-input').disabled&&state.guesses.length===0`));
 await reset('diamond_block');await evaluate(`document.getElementById('end-round').click();document.getElementById('confirm-end').click()`);assert.equal(await evaluate(`state.guesses.length`),0);assert.ok(await evaluate(`!document.getElementById('win-panel').hidden`));
 for(const width of [1365,390,320]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'end panel overflow '+width);}
 await evaluate(`document.getElementById('start-game').click()`);assert.ok(await evaluate(`!isFinished(state)&&document.getElementById('win-panel').hidden&&!document.getElementById('end-round').hidden`));
 for(const [target,field]of [['air','洞穴空气'],['air','虚空空气'],['granite','花岗岩'],['worked_stone','磨制花岗岩'],['obsidian','黑曜是'],['flower','虞美人盆栽'],['stairs','black_concrete_slab'],['terracotta','粉红色带釉陶瓦']]){await reset(target);await submit(field);assert.ok(await evaluate(`!document.getElementById('win-panel').hidden`),field);}
 await reset('diamond_block');const unsafe='<img src=x onerror="window.injected=1">';await submit(unsafe);assert.ok(await evaluate(`document.querySelector('.submitted-field').textContent.includes('<img')&&document.querySelectorAll('#history img').length===1&&document.querySelector('#history img').classList.contains('block-icon')&&window.injected===undefined`));
 await evaluate(`localStorage.setItem(storageKey,JSON.stringify({targetId:'dandelion',guesses:['stone','poppy','gold_ore']}))`);await cdp('Page.reload');await waitForApp();assert.deepEqual(await evaluate(`state.guesses`),['stone','flower']);assert.ok(await evaluate(`document.getElementById('guess-input').disabled`));
 await reset('stairs');await submit('石头');assert.ok(await evaluate(`document.querySelector('#history dd[aria-label^=硬度] .direction').textContent==='↑'`));
 await reset('stone');await submit('楼梯');assert.ok(await evaluate(`!document.body.textContent.includes('↕')&&!document.body.textContent.includes('范围重叠')&&[...document.querySelectorAll('#history dd')].filter(e=>/爆炸抗性|硬度/.test(e.getAttribute('aria-label'))).every(e=>e.querySelector('.direction')?.textContent===(e.getAttribute('aria-label').startsWith('硬度')?'↓':'↑'))`));
 await reset('amethyst_block');for(const field of ['原木','铜格','黑曜是','闪长'])await submit(field);
 assert.equal(await evaluate(`document.querySelectorAll('#history .guess-card').length`),4);assert.ok(await evaluate(`document.getElementById('history').textContent.includes('输入：闪长')`));
 for(const width of [1365,1024,768,700,390,320]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'page overflow '+width);
  assert.ok(await evaluate(`[...document.querySelectorAll('.guess-card,.guess-attribute,.submitted-field')].every(e=>e.scrollWidth<=e.clientWidth+1)`),'record overflow '+width);
  assert.ok(await evaluate(`[...document.querySelectorAll('.guess-attributes')].every(e=>e.children.length===11)`));
  if(width>=1024)assert.ok(await evaluate(`[...document.querySelectorAll('.guess-card')].every(e=>e.getBoundingClientRect().height<=110)`),'desktop record density '+width);
  if(width===390)assert.ok(await evaluate(`[...document.querySelectorAll('.guess-card')].every(e=>e.getBoundingClientRect().height<=220)`),'mobile record density');
 }
 await evaluate(`state.guesses=blocks.map(b=>b.id);state.inputs=blocks.map(()=> '很长的输入字段'.repeat(10));render()`);
 assert.deepEqual(await evaluate(`Promise.all([...document.querySelectorAll('#history img')].map(img=>new Promise(resolve=>{if(img.complete)resolve(img.naturalWidth>0);else {img.onload=()=>resolve(true);img.onerror=()=>resolve(false);}}))).then(ok=>ok.map((loaded,i)=>loaded?null:blocks[blocks.length-1-i].id).filter(Boolean))`),[]);
 assert.ok(await evaluate(`[...document.querySelectorAll('.guess-card,.guess-attribute,.submitted-field')].every(e=>e.scrollWidth<=e.clientWidth+1)`),'all records overflow');
 await reset('amethyst_block');for(const field of ['原木','铜格','黑曜是','闪长'])await submit(field);
 await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:1100,deviceScaleFactor:1,mobile:false});
 for(const field of ['石头','玻璃','箱子','火把'])await submit(field);
 await evaluate(`document.querySelector('.results').scrollIntoView()`);
 const categoryShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'preview-categories.png'),Buffer.from(categoryShot.data,'base64'));
 await evaluate(`endGame(state);render();document.getElementById('start-game').click()`);const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'preview-desktop.png'),Buffer.from(shot.data,'base64'));
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate(`document.documentElement.scrollWidth<=390`));
 await reset('amethyst_block');for(const field of ['原木','铜格','玻璃','火把'])await submit(field);await evaluate(`document.querySelector('.results').scrollIntoView()`);
 const mobile=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'preview-mobile.png'),Buffer.from(mobile.data,'base64'));assert.deepEqual(errors,[]);
 console.log('浏览器检查通过：图鉴分页与别名搜索、完整属性、空结果、仅局外可访问、取消重叠提示、开始前不生成目标且禁止提交、点击开始才开局、局中不可换题、移除新局选项、结束停止并揭晓、无补全和分类选择、字段自动匹配、回车直提交、重复计数、原始输入保存、天然石材独立、错别字、猜中结束、存档恢复、安全文本显示、全部方块图片、11 项线索完整显示和 320–1365px 无横向滚动。');
}finally{clearTimeout(timeout);if(socket?.readyState===1){socket.send(JSON.stringify({id:++nextId,method:'Browser.close'}));socket.close();}browser.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
