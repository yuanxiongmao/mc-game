const {test}=require('node:test'),assert=require('node:assert/strict');
const {blocks}=require('../catalog.js');
const {newGame,isFinished,endGame,submit,submitField,restoreState}=require('../core.js');
const fresh=()=>({targetId:'diamond_block',guesses:[],inputs:[],mode:'free-text'});

test('未猜测也能主动结束，揭晓不计为猜测且不能继续提交',()=>{
 const state=fresh();assert.equal(endGame(state),true);assert.ok(isFinished(state));
 assert.deepEqual(state.guesses,[]);assert.deepEqual(state.inputs,[]);
 assert.equal(submitField(state,blocks,'钻石块').result,'finished');
 assert.equal(submit(state,'stone'),'finished');assert.deepEqual(state.guesses,[]);
 assert.equal(endGame(state),false);
 assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state)),blocks),state);
});

test('主动结束保留全部记录和原始输入，刷新恢复后仍结束',()=>{
 const state=fresh();submitField(state,blocks,'石头');submitField(state,blocks,'石头');
 const before=structuredClone(state);endGame(state);
 assert.deepEqual(state.guesses,before.guesses);assert.deepEqual(state.inputs,before.inputs);
 const restored=restoreState(JSON.parse(JSON.stringify(state)),blocks);
 assert.deepEqual(restored,state);assert.equal(submitField(restored,blocks,'钻石块').result,'finished');
 const next=newGame(blocks,state.targetId);assert.equal(isFinished(next),false);assert.notEqual(next.targetId,state.targetId);
});

test('猜中结束仍为胜利，主动结束不会覆盖胜利状态',()=>{
 const state=fresh();submitField(state,blocks,'钻石块');
 assert.equal(endGame(state),false);assert.equal(state.ended,undefined);
 assert.deepEqual(restoreState({...state,ended:true},blocks),state);
});
