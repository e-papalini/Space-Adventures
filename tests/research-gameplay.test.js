import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../src/core/gameState.js';
import { bennu } from '../src/stages/research/config.js';
import { initialize, move, returnToFlag, performAction, actionError } from '../src/stages/research/model.js';
import { missionFor, startMission, advanceMission, endMission, remainingSeconds, formatTime } from '../src/stages/research/mission.js';
import { direction, stepMotion } from '../src/stages/research/motion.js';
import { bindControls, isTyping } from '../src/stages/research/controls.js';

function fixture() {
  const state = createGameState(); state.selectedDestinationId = 'bennu';
  state.selectedEquipment = bennu.instruments.map(i => i.id); initialize(state); return state;
}
test('five-minute clock waits for briefing and continues across returns; expiry preserves partial findings', () => {
  const state = fixture(), trip = initialize(state), mission = missionFor(state);
  assert.equal(formatTime(remainingSeconds(state)), '05:00');
  advanceMission(state, 45); assert.equal(remainingSeconds(state), 300);
  startMission(state); advanceMission(state, 120); returnToFlag(state);
  assert.equal(remainingSeconds(state), 180);
  trip.position = { x: 255, y: 235 }; performAction(state, 'bennu-camera', 'boulder');
  const saved = structuredClone(state);
  advanceMission(state, 999);
  assert.equal(mission.phase, 'results'); assert.equal(mission.endReason, 'time-limit');
  assert.equal(trip.completed, false); assert.equal(trip.actions.length, 1);
  for (const key of ['scientificDiscoveries', 'collectedSamples', 'remainingEnergy', 'remainingStorage']) assert.deepEqual(state[key], saved[key]);
  assert.equal(formatTime(remainingSeconds(state)), '00:00');
  advanceMission(state, 50); assert.equal(mission.elapsedSeconds, 300);
});
test('configurable mission duration and early completion retain actual task progress', () => {
  const state = fixture(); state.stageData.researchSettings = { missionDurationSeconds: 12 };
  startMission(state); advanceMission(state, 2.2);
  initialize(state).position = { ...bennu.sites.find(s => s.id === 'sampling') };
  performAction(state, 'bennu-sample-arm', 'sampling'); endMission(state, 'objectives-achieved');
  assert.equal(initialize(state).completed, true); assert.equal(initialize(state).actions.length, 1);
  assert.equal(missionFor(state).elapsedSeconds, 2.2); assert.equal(formatTime(remainingSeconds(state)), '00:10');
});
test('single-use definitions cannot be reused and preserve resources on rejection', () => {
  const state = fixture();
  state.stageData.researchEquipmentDefinitions = [{ ...bennu.instruments[0], singleUse: true }];
  initialize(state).position = { x: 255, y: 235 };
  assert.equal(actionError(state, 'bennu-camera', 'boulder'), null);
  performAction(state, 'bennu-camera', 'boulder'); initialize(state).position = { ...bennu.sites.find(s => s.id === 'crater') };
  const before = structuredClone(state);
  assert.match(performAction(state, 'bennu-camera', 'crater').error, /single-use/);
  assert.deepEqual(state, before);
});
test('normalized input supports simultaneous keys, opposition and equal diagonal speed', () => {
  assert.deepEqual(direction(new Set(['w', 's'])), { x: 0, y: 0 });
  assert.deepEqual(direction(new Set(['arrowright', 'd'])), { x: 1, y: 0 });
  assert.ok(Math.abs(Math.hypot(...Object.values(direction(new Set(['w', 'd'])))) - 1) < 1e-12);
});
test('motion accelerates, brakes, and behaves consistently at different frame rates', () => {
  const simulate = rate => {
    const state = fixture(), motion = { vx: 0, vy: 0, angle: 0 };
    initialize(state).position = { x: 70, y: 70 };
    for (let i = 0; i < rate; i++) stepMotion(state, motion, { x: 1, y: 0 }, 1 / rate);
    return { state, motion };
  };
  const slow = simulate(30), fast = simulate(120);
  assert.ok(Math.abs(initialize(slow.state).position.x - initialize(fast.state).position.x) < .1);
  assert.ok(slow.motion.vx > 95 && slow.motion.vx < 100);
  stepMotion(slow.state, slow.motion, { x: 0, y: 0 }, .5);
  assert.ok(slow.motion.vx < 1);
});
test('rover slides along a boulder without tunnelling or entering it', () => {
  const state = fixture(), trip = initialize(state), rock = bennu.obstacles[0], radius = rock.r + bennu.roverRadius;
  trip.position = { x: rock.x - radius, y: rock.y };
  move(state, 20, -20);
  assert.ok(trip.position.y < rock.y - 5);
  assert.ok(Math.hypot(trip.position.x - rock.x, trip.position.y - rock.y) >= radius - .001);
  trip.position = { x: rock.x - radius - 40, y: rock.y }; move(state, 140, 0);
  assert.ok(Math.hypot(trip.position.x - rock.x, trip.position.y - rock.y) >= radius - .001);
});
test('keyboard works without canvas focus, blocks arrow scrolling, ignores typing, and cleans up', () => {
  const target = new EventTarget(), doc = new EventTarget(), pad = new EventTarget();
  let active = true, interactions = 0, selection = -1;
  const controls = bindControls({ host: { ownerDocument: doc }, pad, target, active: () => active,
    interact: () => interactions++, select: index => { selection = index; } });
  const send = (key, type = 'keydown') => {
    const event = new Event(type, { cancelable: true }); Object.assign(event, { key }); target.dispatchEvent(event); return event;
  };
  assert.ok(send('ArrowUp').defaultPrevented); send('d'); assert.equal(controls.keys().size, 2);
  send('e'); send('3'); assert.equal(interactions, 1); assert.equal(selection, 2);
  send('d', 'keyup'); assert.equal(controls.keys().size, 1);
  target.dispatchEvent(new Event('blur')); assert.equal(controls.keys().size, 0);
  active = false; assert.equal(send('ArrowUp').defaultPrevented, false);
  assert.ok(isTyping({ tagName: 'SELECT' })); assert.ok(isTyping({ isContentEditable: true }));
  active = true; controls.destroy(); send('w'); assert.equal(controls.keys().size, 0);
});
test('touch pad supports simultaneous pointers and cancellation', () => {
  const pad = new EventTarget(), doc = new EventTarget(), target = new EventTarget();
  const controls = bindControls({ host: { ownerDocument: doc }, pad, target, active: () => true, interact() {}, select() {} });
  // Pointer events bubble from a control in browsers; emulate their target here.
  const touch = (id, key, type) => {
    const control = { dataset: { direction: key }, setPointerCapture() {} };
    const event = new Event(type, { cancelable: true });
    Object.defineProperty(event, 'target', { value: { closest: () => control } });
    Object.assign(event, { pointerId: id }); pad.dispatchEvent(event);
  };
  touch(1, 'arrowup', 'pointerdown'); touch(2, 'arrowright', 'pointerdown');
  assert.equal(controls.keys().size, 2);
  touch(1, 'arrowup', 'pointercancel'); assert.deepEqual([...controls.keys()], ['arrowright']);
  controls.destroy(); assert.equal(controls.keys().size, 0);
});
