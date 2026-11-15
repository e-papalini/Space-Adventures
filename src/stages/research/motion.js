import { bennu } from './config.js';
import { move, initialize } from './model.js';
import { offsetTo } from './topology.js';

export function direction(keys) {
  const x = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
  const y = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

export function stepMotion(state, motion, input, dt) {
  // Exponential response is stable at different refresh rates. Integrate in small
  // steps so acceleration, collisions and distance behave consistently as well.
  let remaining = dt;
  while (remaining > 0) {
    const step = Math.min(remaining, 1 / 120); remaining -= step;
    const response = input.x || input.y ? bennu.acceleration : bennu.braking;
    const blend = 1 - Math.exp(-response * step);
    motion.vx += (input.x * bennu.speed - motion.vx) * blend;
    motion.vy += (input.y * bennu.speed - motion.vy) * blend;
    const previous = { ...initialize(state).position };
    move(state, motion.vx * step, motion.vy * step);
    const position = initialize(state).position;
    const deltaPosition = offsetTo(previous, position);
    if (Math.hypot(deltaPosition.x, deltaPosition.y) > .001) {
      const target = Math.atan2(deltaPosition.y, deltaPosition.x);
      const delta = Math.atan2(Math.sin(target - motion.angle), Math.cos(target - motion.angle));
      motion.angle += delta * (1 - Math.exp(-12 * step));
    }
  }
}
