import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/core/gameState.js';
import { bennu, instrumentsFor } from '../src/stages/research/config.js';
import { initialize, move, nearbySite, inspectSite, performAction } from '../src/stages/research/model.js';
import { wrap, offsetTo, nearestCopy, mapDistance, visibleTiles } from '../src/stages/research/topology.js';
import { stepMotion } from '../src/stages/research/motion.js';
import { startMission, advanceMission, remainingSeconds } from '../src/stages/research/mission.js';
import { applyResearchFixture } from '../dev/researchFixture.js';

function fixture() {
  const state = createGameState(); state.selectedDestinationId = 'bennu';
  state.selectedEquipment = bennu.instruments.map(item => item.id); initialize(state); return state;
}
test('all four edges and corners wrap with actual distance, without resetting state', () => {
  const state = fixture(), trip = initialize(state); startMission(state); advanceMission(state, 10);
  trip.position = { ...bennu.sites.find(s => s.id === 'sampling') }; performAction(state, 'bennu-sample-arm', 'sampling');
  const saved = structuredClone(state), oldBase = { ...bennu.start };
  for (const [start, delta, expected] of [
    [{x:1799,y:600}, {x:3,y:0}, {x:2,y:600}], [{x:1,y:600}, {x:-3,y:0}, {x:1798,y:600}],
    [{x:900,y:1199}, {x:0,y:3}, {x:900,y:2}], [{x:900,y:1}, {x:0,y:-3}, {x:900,y:1198}],
    [{x:1799,y:1199}, {x:3,y:3}, {x:2,y:2}],
  ]) {
    trip.position = start; trip.tripDistance = 0; move(state, delta.x, delta.y);
    assert.ok(mapDistance(trip.position, expected) < 1e-9);
    assert.ok(Math.abs(trip.tripDistance - Math.hypot(delta.x, delta.y)) < 1e-9);
  }
  for (const key of ['remainingEnergy','remainingStorage','scientificDiscoveries','collectedSamples']) assert.deepEqual(state[key], saved[key]);
  assert.deepEqual(trip.actions, saved.stageData.research.bennu.actions);
  assert.equal(remainingSeconds(state), 290); assert.equal(trip.returns, 0); assert.deepEqual(bennu.start, oldBase);
});
test('a full circuit brings the base back naturally and preserves velocity and heading', () => {
  const state = fixture(), trip = initialize(state);
  move(state, bennu.width, 0); assert.ok(mapDistance(trip.position, bennu.start) < 1e-8);
  move(state, 0, bennu.height); assert.ok(mapDistance(trip.position, bennu.start) < 1e-8);
  trip.position = { x: 1799, y: 100 }; const motion = {vx:100,vy:0,angle:0};
  stepMotion(state, motion, {x:1,y:0}, .05);
  assert.ok(trip.position.x < 10); assert.equal(motion.vx, 100); assert.ok(Math.abs(motion.angle) < 1e-9);
  trip.position = {x:100,y:1199}; motion.vx = 0; motion.vy = 100; motion.angle = Math.PI/2;
  stepMotion(state, motion, {x:0,y:1}, .05);
  assert.ok(trip.position.y < 10); assert.equal(motion.vy, 100); assert.ok(Math.abs(motion.angle-Math.PI/2) < 1e-9);
});
test('nearby inspection and scientific actions use the nearest copy across a seam', () => {
  const state = fixture(), site = bennu.sites[0], original = { x:site.x,y:site.y };
  try {
    site.x = 5; site.y = 600; initialize(state).position = {x:1795,y:600};
    const before = structuredClone(state);
    assert.equal(nearbySite(state).id, site.id);
    const hint = inspectSite(state, site.id);
    assert.ok(hint.recommended.some(item => item.kind === 'camera'));
    assert.deepEqual(state, before, 'looking is free and reveals no discovery');
    assert.ok(performAction(state, 'bennu-camera', site.id).discovery);
    assert.equal(state.remainingStorage, 80);
    move(state, 20, 0); assert.equal(state.scientificDiscoveries.length, 1);
    assert.match(performAction(state, 'bennu-camera', site.id).error, /already/);
    state.selectedEquipment = []; assert.deepEqual(inspectSite(state, site.id).recommended, []);
  } finally { Object.assign(site, original); }
});
test('solid boulders collide across a seam while shallow craters remain traversable', () => {
  const state = fixture(), rock = bennu.obstacles[0], original = {x:rock.x,y:rock.y};
  try {
    rock.x = 5; rock.y = 600; initialize(state).position = {x:1750,y:600};
    move(state, 70, 0);
    assert.ok(mapDistance(initialize(state).position, rock) >= rock.r + bennu.roverRadius - .001);
  } finally { Object.assign(rock, original); }
  const crater = bennu.sites.find(site => site.id === 'crater');
  initialize(state).position = {x:crater.x-10,y:crater.y}; move(state,20,0);
  assert.ok(mapDistance(initialize(state).position, {x:crater.x+10,y:crater.y}) < 1e-8);
});
test('repeating camera geometry covers each viewport edge and uses the closest copy', () => {
  assert.equal(wrap(-1, 1800),1799); assert.equal(offsetTo({x:1799,y:1},{x:1,y:1199}).x, 2);
  assert.deepEqual(nearestCopy({x:1,y:600},{x:1799,y:600}), {x:1801,y:600});
  for (const camera of [{x:0,y:0},{x:1799,y:1199},{x:100,y:600}]) {
    const tiles = visibleTiles(camera, 1280, 850, 1.65);
    for (const x of [-640/1.65,640/1.65]) for (const y of [-425/1.65,425/1.65]) {
      assert.ok(tiles.some(tile => camera.x+x >= tile.x && camera.x+x <= tile.x+bennu.width && camera.y+y >= tile.y && camera.y+y <= tile.y+bennu.height));
    }
  }
});
test('fixture requires a fresh harness state and never replaces Preparation selections', () => {
  const state = createGameState(); state.selectedDestinationId = 'bennu';
  applyResearchFixture(state, new URLSearchParams()); assert.deepEqual(state.selectedEquipment, []);
  state.selectedEquipment = ['real-camera'];
  applyResearchFixture(state, new URLSearchParams(), {freshDevelopmentState:true}); assert.deepEqual(state.selectedEquipment, ['real-camera']);
  state.selectedEquipment = []; state.stageData.researchEquipmentDefinitions = [];
  applyResearchFixture(state, new URLSearchParams(), {freshDevelopmentState:true}); assert.deepEqual(state.selectedEquipment, []);
  delete state.stageData.researchEquipmentDefinitions;
  applyResearchFixture(state, new URLSearchParams('equipment=camera'), {freshDevelopmentState:true});
  assert.deepEqual(instrumentsFor(state).map(item => item.id), ['bennu-camera']);
});
