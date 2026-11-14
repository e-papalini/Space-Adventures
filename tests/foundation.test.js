import test from 'node:test';
import assert from 'node:assert/strict';
import { destinations, getDestination } from '../src/data/destinations.js';
import { createGameState } from '../src/core/gameState.js';
import { advanceState, createNavigator } from '../src/core/navigation.js';
import { stages } from '../src/core/stageRegistry.js';

const ids = destinations.map(item => item.id);
test('catalogue has five unique, sourced destinations and material IDs', () => {
  assert.equal(new Set(ids).size, 5);
  for (const item of destinations) {
    assert.ok(item.sources.length && item.discoveries.length && item.materials.length);
    assert.equal(new Set(item.materials.map(material => material.id)).size, item.materials.length);
    assert.equal(getDestination(item.id), item);
    assert.ok(Object.isFrozen(item.materials));
  }
  assert.equal(getDestination('unknown'), null);
});

test('each destination follows Earth preparation, research, completion and a fresh replay', () => {
  for (const id of ids) {
    let state = createGameState();
    assert.equal(state.currentLocation, 'earth');
    state = advanceState(state, { ...state, selectedDestinationId: id }, stages, ids);
    assert.equal(state.currentStage, 'preparation2');
    assert.equal(state.currentLocation, 'earth');
    state.selectedEquipment.push('camera');
    state.stageData.preparation2 = { customChoice: 'test' };
    state = advanceState(state, state, stages, ids);
    assert.equal(state.currentStage, 'research');
    assert.equal(state.currentLocation, id);
    state.collectedSamples.push({ destinationId: id, materialId: 'test', quantity: 1 });
    state = advanceState(state, state, stages, ids);
    assert.equal(state.missionStatus, 'complete');
    assert.equal(state.selectedEquipment[0], 'camera');
    assert.equal(state.collectedSamples.length, 1);
    assert.equal(state.stageData.preparation2.customChoice, 'test');
    assert.throws(() => advanceState(state, state, stages, ids), /already complete/);
    const fresh = createGameState();
    assert.equal(fresh.selectedDestinationId, null);
    assert.equal(fresh.currentLocation, 'earth');
    assert.equal(fresh.collectedSamples.length, 0);
  }
});

test('missing destinations, skipped preparation, invalid resources and mid-mission destination swaps fail', () => {
  const fresh = createGameState();
  assert.throws(() => advanceState(fresh, fresh, stages, ids), /destination/);
  assert.throws(() => advanceState({ ...fresh, currentStage: 'research' }, { ...fresh, selectedDestinationId: 'bennu' }, stages, ids), /preceding/);
  assert.throws(() => advanceState(fresh, { ...fresh, selectedDestinationId: 'unknown' }, stages, ids), /valid destination/);
  assert.throws(() => advanceState(fresh, { ...fresh, selectedDestinationId: 'bennu', remainingEnergy: -1 }, stages, ids), /non-negative/);
  const second = advanceState(fresh, { ...fresh, selectedDestinationId: 'bennu', currentStage: 'research', completedStages: ['research'] }, stages, ids);
  assert.equal(second.currentStage, 'preparation2');
  assert.deepEqual(second.completedStages, ['preparation1']);
  assert.throws(() => advanceState(second, { ...second, selectedDestinationId: 'ryugu' }, stages, ids), /fixed/);
});

test('a future stage needs only a registry entry', () => {
  const expanded = [...stages, { id: 'communication', location: 'destination', requiresDestination: true }];
  let state = { ...createGameState(), selectedDestinationId: 'bennu' };
  for (let i = 0; i < 3; i++) state = advanceState(state, state, expanded, ids);
  assert.equal(state.currentStage, 'communication');
  assert.equal(state.missionStatus, 'active');
  state = advanceState(state, state, expanded, ids);
  assert.equal(state.missionStatus, 'complete');
});

test('navigator cleans up stages and ignores duplicate and stale callbacks', async () => {
  let firstCallback, secondCallback, cleaned = 0, finishes = 0;
  const registry = [
    { id: 'one', location: 'earth', mount(root, state, done) { firstCallback = done; return () => cleaned++; } },
    { id: 'two', location: 'earth', mount(root, state, done) { secondCallback = done; return () => cleaned++; } },
  ];
  const nav = createNavigator({ container: { replaceChildren() {} }, stages: registry, destinationIds: ids,
    onStateChange() {}, onFinish() { finishes++; }, onError(error) { throw error; } });
  nav.start();
  const first = nav.getState();
  firstCallback(first); firstCallback(first);
  await new Promise(resolve => queueMicrotask(resolve));
  assert.equal(nav.getState().currentStage, 'two');
  assert.equal(cleaned, 1);
  firstCallback(first);
  secondCallback(nav.getState());
  await new Promise(resolve => queueMicrotask(resolve));
  assert.equal(finishes, 1);
  assert.equal(cleaned, 2);
  nav.start();
  assert.equal(nav.getState().currentStage, 'one');
  nav.destroy();
});
