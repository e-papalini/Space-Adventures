import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/core/gameState.js';
import { stages } from '../src/core/stageRegistry.js';
import { advanceState } from '../src/core/navigation.js';
import { destinations } from '../src/data/destinations.js';
import { prepareResearchEquipment } from '../src/data/equipment.js';
import { initialize, performAction } from '../src/stages/research/model.js';
import { bennu, instrumentsFor } from '../src/stages/research/config.js';
import { prepareTransmission } from '../src/stages/transmission/handoff.js';
import { transmitScan, failResearchExpedition } from '../src/stages/transmission/index.js';

test('integrated mission has all five stages and matching Preparation instrument IDs', () => {
  assert.deepEqual(stages.map(stage => stage.id), ['preparation1','preparation2','flight','research','transmission']);
  const state = createGameState(); state.selectedDestinationId = 'bennu';
  state.selectedEquipment = ['bennu-ir-spectrometer']; prepareResearchEquipment(state);
  assert.equal(instrumentsFor(state)[0].id, 'bennu-ir-spectrometer');
  const mineral = bennu.sites.find(site => site.id === 'mineral');
  initialize(state).position = {x:mineral.x,y:mineral.y};
  assert.ok(performAction(state, 'bennu-ir-spectrometer', mineral.id).discovery);
  assert.equal(state.remainingStorage, 88);
  assert.deepEqual(state.selectedEquipment, ['bennu-ir-spectrometer']);
});
test('exploration packets preserve data size, are imported once, and are transmitted without recollection', () => {
  const state = createGameState(); state.selectedDestinationId = 'bennu'; state.selectedEquipment = ['bennu-camera'];
  prepareResearchEquipment(state);
  const site = bennu.sites[0]; initialize(state).position = {x:site.x,y:site.y};
  performAction(state, 'bennu-camera', site.id);
  const original = structuredClone(state.scientificDiscoveries[0]), energy = state.remainingEnergy;
  prepareTransmission(state); prepareTransmission(state);
  const data = state.stageData.research;
  assert.deepEqual(data.scans.map(scan => scan.sizeMb), [6,6,6,2]);
  assert.equal(state.remainingEnergy, energy); assert.equal(state.remainingStorage, 80);
  for (const scan of [...data.scans]) assert.ok(transmitScan(state, scan.id, true).ok);
  assert.equal(state.remainingStorage, 100); assert.equal(state.remainingEnergy, energy-38);
  assert.deepEqual(state.scientificDiscoveries[0], original);
  prepareTransmission(state); assert.equal(data.scans.length, 0);
});
test('failure releases only queued packet storage and preserves other data and samples', () => {
  const state = createGameState(); state.remainingStorage = 60;
  state.collectedSamples.push({destinationId:'bennu',materialId:'regolith',quantity:1});
  state.stageData.research = {scans:[{id:'packet',sizeMb:6}],transmittedFindings:[]};
  failResearchExpedition(state);
  assert.equal(state.remainingStorage, 66); assert.equal(state.collectedSamples.length, 1);
});
test('destination, selected equipment, discoveries and balances survive every registered transition', () => {
  let state = createGameState(); state.selectedDestinationId = 'bennu'; state.selectedEquipment=['bennu-ir-spectrometer'];
  state.remainingEnergy=75; state.remainingStorage=88;
  state.scientificDiscoveries=[{destinationId:'bennu',discoveryId:'test'}];
  for (let i=0;i<stages.length;i++) {
    state = advanceState(state,state,stages,destinations.map(d=>d.id));
    assert.equal(state.selectedDestinationId,'bennu'); assert.equal(state.remainingEnergy,75); assert.equal(state.remainingStorage,88);
    assert.deepEqual(state.selectedEquipment,['bennu-ir-spectrometer']); assert.equal(state.scientificDiscoveries.length,1);
  }
  assert.equal(state.missionStatus,'complete');
});
