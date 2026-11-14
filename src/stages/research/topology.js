import { bennu } from './config.js';

export const wrap = (value, size) => ((value % size) + size) % size;
export const wrappedDelta = (from, to, size) => wrap(to - from + size / 2, size) - size / 2;
export function offsetTo(from, to) {
  return { x: wrappedDelta(from.x, to.x, bennu.width), y: wrappedDelta(from.y, to.y, bennu.height) };
}
export function nearestCopy(point, reference) {
  const delta = offsetTo(reference, point);
  return { x: reference.x + delta.x, y: reference.y + delta.y };
}
export function mapDistance(a, b) {
  const delta = offsetTo(a, b); return Math.hypot(delta.x, delta.y);
}
export function visibleTiles(camera, width, height, zoom) {
  const tiles = [];
  for (let y = Math.floor((camera.y - height / (2 * zoom)) / bennu.height); y <= Math.floor((camera.y + height / (2 * zoom)) / bennu.height); y++) {
    for (let x = Math.floor((camera.x - width / (2 * zoom)) / bennu.width); x <= Math.floor((camera.x + width / (2 * zoom)) / bennu.width); x++) tiles.push({ x: x * bennu.width, y: y * bennu.height });
  }
  return tiles;
}
