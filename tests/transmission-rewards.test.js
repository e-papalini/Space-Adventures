import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../src/core/gameState.js';
import {prepareResearchEquipment} from '../src/data/equipment.js';
import {initialize,performAction} from '../src/stages/research/model.js';
import {bennu} from '../src/stages/research/config.js';
import {prepareTransmission} from '../src/stages/transmission/handoff.js';
import {prepareFinding,transmissionRewards,alignmentReward} from '../src/stages/transmission/rewards.js';
import {alignmentAccuracy,transmitScan,failResearchExpedition} from '../src/stages/transmission/index.js';
import {scoreMission,awardMission,emptyProgress,createProgressStore} from '../src/core/progression.js';

function mission(){
  const state=createGameState();state.selectedDestinationId='bennu';state.selectedEquipment=['bennu-ir-spectrometer','bennu-camera'];prepareResearchEquipment(state);
  const site=bennu.sites.find(site=>site.id==='mineral');initialize(state).position={x:site.x,y:site.y};performAction(state,'bennu-ir-spectrometer','mineral');
  prepareTransmission(state);state.stageData.transmission.requiresPreparation=true;return state;
}
test('live accuracy matches the displayed reference, handles circular phase, and is bounded',()=>{
  assert.equal(alignmentAccuracy(1.14,35),100);assert.equal(alignmentAccuracy(1.14,395),100);
  assert.ok(alignmentAccuracy(.72,-42)<50);assert.ok(alignmentAccuracy(1.14,75)<alignmentAccuracy(1.14,45));
  assert.equal(alignmentAccuracy(NaN,0),0);
  for(const [value,points] of [[100,30],[90,30],[89,20],[75,20],[74,10],[50,10],[49,0]])assert.equal(alignmentReward(value).points,points);
});
test('onboard scan uses a real finding and its installed tool exactly once without duplicating stored data',()=>{
  const state=mission(),id=state.scientificDiscoveries[0].discoveryId, before=structuredClone(state);
  assert.equal(prepareFinding(state,'invented','bennu-ir-spectrometer').ok,false);
  assert.equal(prepareFinding(state,id,'bennu-camera').ok,false);assert.deepEqual(state,before);
  const result=prepareFinding(state,id,'bennu-ir-spectrometer');assert.equal(result.points,5);
  assert.equal(state.remainingEnergy,before.remainingEnergy-2);assert.equal(state.remainingStorage,88);
  assert.deepEqual(state.scientificDiscoveries,before.scientificDiscoveries);assert.deepEqual(state.stageData.research.scans,before.stageData.research.scans);
  const saved=structuredClone(state);assert.equal(prepareFinding(state,id,'bennu-ir-spectrometer').ok,false);assert.deepEqual(state,saved);
});
test('failed preparation, weak alignment and missing preparation consume no resources',()=>{
  const state=mission(),scan=state.stageData.research.scans[0],before=structuredClone(state);
  assert.equal(transmitScan(state,scan.id,100).ok,false);assert.equal(transmitScan(state,scan.id,49).ok,false);assert.deepEqual(state,before);
  state.remainingEnergy=1;const low=structuredClone(state);
  assert.equal(prepareFinding(state,state.scientificDiscoveries[0].discoveryId,'bennu-ir-spectrometer').ok,false);assert.deepEqual(state,low);
});
test('packet rewards are earned only once per whole finding and connection bonus is not multiplied',()=>{
  const state=mission(),data=state.stageData.research,id=state.scientificDiscoveries[0].discoveryId;
  prepareFinding(state,id,'bennu-ir-spectrometer');assert.equal(transmissionRewards(state).total,5);
  const first=transmitScan(state,data.scans[0].id,94);assert.equal(first.ok,true);assert.equal(first.points,0);assert.equal(transmissionRewards(state).dataPoints,0);
  const second=transmitScan(state,data.scans[0].id,98);assert.equal(second.ok,true);assert.equal(second.points,45);
  assert.deepEqual(transmissionRewards(state),{scanPoints:5,signalPoints:30,dataPoints:10,valuablePoints:5,total:50,findings:1,valuable:1,accuracy:94});
  const saved=structuredClone(state);assert.equal(transmitScan(state,first.finding.scanId,100).ok,false);assert.deepEqual(state,saved);
  assert.equal(state.remainingStorage,100);assert.equal(state.remainingEnergy,75.75);
  state.missionStatus='complete';state.completedStages=['preparation1','preparation2','flight','research','transmission'];
  assert.equal(scoreMission(state).score,105,'stage rewards replace the old data bonus instead of adding it twice');
  const award=awardMission(emptyProgress(),state);assert.equal(award.earned,105);assert.deepEqual(award.newlyUnlocked,['itokawa']);
  assert.equal(awardMission(award.profile,state).earned,0);
  state.missionId='same-score-replay';assert.equal(awardMission(award.profile,state).earned,0);
  const memory=new Map(),storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
  createProgressStore(storage).save(award.profile);assert.equal(createProgressStore(storage).load().totalPoints,105);
});
test('weak and good connections succeed at lower rewards, with weakest packet quality determining each finding',()=>{
  for(const [accuracy,expected] of [[50,10],[75,20],[90,30]]){
    const state=mission(),data=state.stageData.research;prepareFinding(state,state.scientificDiscoveries[0].discoveryId,'bennu-ir-spectrometer');
    transmitScan(state,data.scans[0].id,accuracy);transmitScan(state,data.scans[0].id,100);
    assert.equal(transmissionRewards(state).signalPoints,expected);
  }
});
test('discarding unsent packets cannot turn a partial finding into a complete data reward',()=>{
  const state=mission(),data=state.stageData.research;prepareFinding(state,state.scientificDiscoveries[0].discoveryId,'bennu-ir-spectrometer');
  transmitScan(state,data.scans[0].id,100);failResearchExpedition(state);
  const reward=transmissionRewards(state);assert.equal(reward.findings,0);assert.equal(reward.dataPoints,0);assert.equal(reward.signalPoints,0);
});
