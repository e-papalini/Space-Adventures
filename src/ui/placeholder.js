import { element, button } from './dom.js';
import { getDestination } from '../data/destinations.js';

/** Temporary integration UI; stages may replace this completely. */
export function mountPlaceholder(container, state, onComplete, { id, title, setup }) {
  const root = element('section', undefined, `stage-${id}`);
  root.append(element('p', 'Integration placeholder'), element('h1', title));
  root.append(element('p', 'This screen tests the shared contract. Gameplay will be built by the stage owner.'));
  const destination = getDestination(state.selectedDestinationId);
  root.append(element('p', `Location: ${state.currentLocation === 'earth' ? 'Earth' : destination?.name}. Destination: ${destination?.name ?? 'not selected'}.`));
  const controls = element('div');
  const finish = button('Simulate stage completion', () => onComplete(state));
  if (setup) setup(controls, state, finish);
  root.append(controls, finish);
  container.append(root);
  return () => root.remove();
}
