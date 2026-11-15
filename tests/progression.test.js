import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../src/core/gameState.js';
import {createNavigator} from '../src/core/navigation.js';
import {scoreMission,awardMission,emptyProgress,createProgressStore,unlockedDestinations,canStartDestination,levels} from '../src/core/progression.js';
function complete() {
  const state=createGameState();state.selectedDestinationId='bennu';state.missionStatus='complete';
  state.completedStages=['preparation1','preparation2','flight','research','transmission'];
  state.selectedEquipment=['bennu-ir-spectrometer'];
  state.stageData.research={bennu:{actions:[{siteId:'mineral',kind:'infrared',instrumentId:'bennu-ir-spectrometer'}]},scans:[],transmittedFindings:[{sourceDiscoveryId:'water'}]};
  state.scientificDiscoveries=[{discoveryId:'water',destinationId:'bennu',siteId:'mineral',kind:'infrared',instrumentId:'bennu-ir-spectrometer'}];
  return state;
}
test('simple mission scores 65 and unlocks Itokawa without needing every task',()=>{
  const state=complete(), result=awardMission(emptyProgress(),state);
  assert.equal(scoreMission(state).score,65);assert.equal(result.earned,65);
  assert.deepEqual(result.newlyUnlocked,['itokawa']);assert.equal(result.profile.bestScores.bennu,65);
  assert.ok(canStartDestination('bennu',result.profile));
  assert.equal(canStartDestination('itokawa',result.profile),false,'unfinished worlds never open placeholders');
});
test('duplicate callbacks, repeat findings, synthetic scans and equal-score replays cannot farm points',()=>{
  const state=complete(), first=awardMission(emptyProgress(),state);
  state.scientificDiscoveries.push(...state.scientificDiscoveries,{discoveryId:'generated-relay-scan',destinationId:'bennu'});
  assert.equal(scoreMission(state).score,65);
  assert.equal(awardMission(first.profile,state).earned,0);
  const replay=complete();assert.notEqual(replay.missionId,state.missionId);
  const second=awardMission(first.profile,replay);
  assert.equal(second.earned,0);assert.equal(second.profile.totalPoints,65);assert.equal(second.profile.completedMissions.length,2);
  replay.missionId='improved-replay';replay.selectedEquipment.push('bennu-camera');
  replay.stageData.research.bennu.actions.push({siteId:'rock',kind:'camera',instrumentId:'bennu-camera'});
  replay.scientificDiscoveries.push({discoveryId:'rock-photo',destinationId:'bennu',siteId:'rock',kind:'camera',instrumentId:'bennu-camera'});
  const improved=awardMission(second.profile,replay);assert.equal(improved.earned,10);assert.equal(improved.profile.totalPoints,75);
});
test('unfinished missions and uninstalled tools score no points',()=>{
  const state=complete();state.missionStatus='active';assert.equal(scoreMission(state).score,0);
  state.missionStatus='complete';state.selectedEquipment=[];assert.equal(scoreMission(state).score,0);
});
test('all five unlock thresholds advance in the requested order',()=>{
  assert.deepEqual(levels.map(l=>l.id),['bennu','itokawa','ryugu','wild2','67p']);
  for(let i=0;i<levels.length;i++){
    assert.deepEqual(unlockedDestinations(levels[i].points),levels.slice(0,i+1).map(l=>l.id));
    if(i)assert.equal(unlockedDestinations(levels[i].points-1).includes(levels[i].id),false);
  }
});
test('local save restores totals, unlocks, completed missions and best scores across store instances',()=>{
  const memory=new Map(),storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
  const first=createProgressStore(storage),earned=awardMission(first.load(),complete());first.save(earned.profile);
  const restored=createProgressStore(storage).load();assert.equal(restored.totalPoints,65);
  assert.deepEqual(restored.unlockedDestinations,['bennu','itokawa']);assert.equal(restored.completedMissions.length,1);assert.equal(restored.bestScores.bennu,65);
  const tampered=JSON.parse([...memory.values()][0]);tampered.totalPoints=99999;tampered.unlockedDestinations=['67p'];storage.setItem([...memory.keys()][0],JSON.stringify(tampered));
  assert.equal(createProgressStore(storage).load().totalPoints,65,'derive totals from best scores');
});
test('blocked or corrupt browser storage does not crash gameplay',()=>{
  const blocked=createProgressStore({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
  assert.equal(blocked.load().totalPoints,0);blocked.save(awardMission(emptyProgress(),complete()).profile);
  assert.match(blocked.warning,/could not save/);assert.equal(blocked.load().totalPoints,65);
  const corrupt=createProgressStore({getItem:()=>'{bad json'});assert.equal(corrupt.load().totalPoints,0);assert.ok(corrupt.warning);
});
test('shared controller guard rejects a forged locked destination before leaving Earth',async()=>{
  let finish, nextMounted=false, message;
  const nav=createNavigator({container:{replaceChildren(){}},destinationIds:levels.map(level=>level.id),
    stages:[{id:'preparation1',location:'earth',requiresDestination:true,mount(root,state,done){finish=done;return()=>{};}},
      {id:'preparation2',location:'earth',mount(){nextMounted=true;return()=>{};}}],
    canSelectDestination:id=>canStartDestination(id,emptyProgress()),onStateChange(){},onFinish(){},onError(error){message=error.message;}});
  nav.start();const state=nav.getState();state.selectedDestinationId='ryugu';finish(state);
  await new Promise(resolve=>queueMicrotask(resolve));
  assert.equal(nextMounted,false);assert.match(message,/locked/);assert.equal(nav.getState().currentStage,'preparation1');nav.destroy();
});
