import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/core/gameState.js';
import { bennu, instrumentsFor } from '../src/stages/research/config.js';
import { initialize, performAction, returnToFlag, move, missionReady } from '../src/stages/research/model.js';

function fixture() {
  const state = createGameState(); state.selectedDestinationId = 'bennu';
  state.selectedEquipment = bennu.instruments.map(item => item.id); initialize(state); return state;
}
test('Research never installs equipment; real catalogue IDs can replace provisional IDs', () => {
  const state = fixture(); state.selectedEquipment = [];
  assert.deepEqual(instrumentsFor(state), []);
  assert.match(performAction(state, 'bennu-camera', 'boulder').error, /not installed/);
  state.stageData.researchEquipmentDefinitions = [{ id: 'prep-real-camera', kind: 'camera', name: 'Real camera', watts: 8, mb: 20 }];
  state.selectedEquipment = ['prep-real-camera']; initialize(state).position = { x: 255, y: 235 };
  assert.ok(performAction(state, 'prep-real-camera', 'boulder').discovery);
});
test('actions enforce proximity, suitability, resources, and duplicate protection', () => {
  const state = fixture();
  assert.match(performAction(state, 'bennu-camera', 'boulder').error, /closer/);
  initialize(state).position = { x: 255, y: 235 };
  assert.match(performAction(state, 'bennu-infrared', 'boulder').error, /cannot investigate/);
  state.remainingStorage = 19;
  assert.match(performAction(state, 'bennu-camera', 'boulder').error, /storage/);
  assert.equal(state.remainingEnergy, 100);
  state.remainingStorage = 100; state.remainingEnergy = 0;
  assert.match(performAction(state, 'bennu-camera', 'boulder').error, /energy/);
  state.remainingEnergy = 100;
  assert.ok(performAction(state, 'bennu-camera', 'boulder').discovery);
  assert.equal(state.remainingStorage, 80);
  assert.equal(state.remainingEnergy, 100 - 8 / 60);
  const before = structuredClone(state);
  assert.match(performAction(state, 'bennu-camera', 'boulder').error, /already/);
  assert.deepEqual(state, before);
});
test('return preserves results, samples and resource consumption across trips', () => {
  const state = fixture(); const trip = initialize(state);
  trip.position = { ...bennu.sites.find(s => s.id === 'sampling') }; trip.tripDistance = 400;
  assert.ok(performAction(state, 'bennu-sample-arm', 'sampling').discovery);
  assert.ok(missionReady(state));
  const saved = structuredClone(state);
  returnToFlag(state);
  for (const key of ['remainingEnergy', 'remainingStorage', 'collectedSamples', 'scientificDiscoveries']) assert.deepEqual(state[key], saved[key]);
  assert.deepEqual(trip.actions, saved.stageData.research.bennu.actions);
  assert.equal(trip.tripDistance, 0); assert.deepEqual(trip.position, bennu.start);
});
test('distance accumulates without a cap and does not block further science', () => {
  const state = fixture(), trip = initialize(state);
  move(state, 10, 0); move(state, -10, 0); assert.equal(trip.tripDistance, 20);
  trip.tripDistance = 649; move(state, 5, 0); assert.equal(trip.tripDistance, 654);
  move(state, 5, 0); assert.equal(trip.tripDistance, 659);
  trip.position = { x: 255, y: 235 };
  assert.ok(performAction(state, 'bennu-camera', 'boulder').discovery);
  returnToFlag(state); move(state, 5, 0); assert.equal(trip.tripDistance, 5);
});
test('collision permits approach and nudges around the visible boundary without penetration', () => {
  const state = fixture(), trip = initialize(state);
  const rock = bennu.obstacles[0], radius = rock.r + bennu.roverRadius;
  trip.position = { x: rock.x - radius - 5, y: rock.y }; move(state, 10, 0);
  assert.ok(trip.tripDistance > 0);
  assert.ok(Math.hypot(trip.position.x - rock.x, trip.position.y - rock.y) >= radius - .001);
  for (let i = 0; i < 100; i++) move(state, 1, 0);
  assert.ok(Math.abs(trip.position.y - rock.y) > 5);
  assert.ok(Math.hypot(trip.position.x - rock.x, trip.position.y - rock.y) >= radius - .001);
});
