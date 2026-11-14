import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/core/gameState.js';
import {
  GAMEPLAY_VALUES,
  failResearchExpedition,
  getSignalStatus,
  getTransmissionBlockers,
  transmitScan,
  transmissionCost,
} from '../src/stages/research/index.js';

function stateWithScan(sizeMb = 3.2) {
  const state = createGameState('research');
  state.selectedDestinationId = 'bennu';
  state.remainingStorage -= sizeMb;
  state.stageData.research = {
    scans: [{ id: 'scan-1', name: 'Spectral survey 1', sizeMb }],
    transmittedFindings: [],
    nextScanSequence: 2,
    relayAvailable: true,
    expeditionFailed: false,
  };
  return state;
}

test('signal tuning uses forgiving frequency and phase tolerances', () => {
  assert.equal(getSignalStatus(1.14, 35), 'Locked');
  assert.equal(getSignalStatus(1.21, 50), 'Locked');
  assert.equal(getSignalStatus(1.3, 80), 'Weak signal');
  assert.equal(getSignalStatus(0.5, -180), 'Searching');
});

test('successful transmission spends energy, frees storage, and records the finding once', () => {
  const state = stateWithScan();
  const cost = transmissionCost(state.stageData.research.scans[0]);
  const result = transmitScan(state, 'scan-1', true);

  assert.equal(result.ok, true);
  assert.equal(result.energyCost, cost);
  assert.equal(state.remainingEnergy, 100 - cost);
  assert.equal(state.remainingStorage, 100);
  assert.equal(state.stageData.research.scans.length, 0);
  assert.equal(state.stageData.research.transmittedFindings[0].scanId, 'scan-1');
  assert.equal(state.scientificDiscoveries[0].discoveryId, 'scan-1');
});

test('send-time blockers leave scan, energy, and storage unchanged', () => {
  for (const configure of [
    state => { state.remainingEnergy = 0; },
    state => { state.stageData.research.relayAvailable = false; },
    state => { state.stageData.research.scans[0].sizeMb = GAMEPLAY_VALUES.defaultAntenna.maxDataPerContactMb + 1; },
  ]) {
    const state = stateWithScan();
    configure(state);
    const before = structuredClone(state);
    const blockers = getTransmissionBlockers(state, state.stageData.research.scans[0]);
    assert.ok(blockers.length);
    assert.deepEqual(state, before);
    const result = transmitScan(state, 'scan-1', true);
    assert.equal(result.ok, false);
    assert.deepEqual(state, before);
  }
});

test('unlocked and duplicate sends are rejected without changing shared state', () => {
  const state = stateWithScan();
  assert.equal(transmitScan(state, 'scan-1', false).reason, 'Signal is not locked.');
  assert.equal(transmitScan(state, 'scan-1', true).ok, true);
  const before = structuredClone(state);
  const duplicate = transmitScan(state, 'scan-1', true);
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.reason, /already been transmitted/);
  assert.deepEqual(state, before);
});

test('simulated expedition failure discards unsent scans but keeps transmitted findings', () => {
  const state = stateWithScan();
  transmitScan(state, 'scan-1', true);
  state.stageData.research.scans.push({ id: 'scan-2', name: 'Unsent scan', sizeMb: 5 });
  state.remainingStorage -= 5;
  const finding = structuredClone(state.stageData.research.transmittedFindings);

  assert.equal(failResearchExpedition(state), true);
  assert.deepEqual(state.stageData.research.scans, []);
  assert.deepEqual(state.stageData.research.transmittedFindings, finding);
  assert.equal(state.remainingStorage, GAMEPLAY_VALUES.storageCapacityMb);
});
