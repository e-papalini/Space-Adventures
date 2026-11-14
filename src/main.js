import { destinations, getDestination } from './data/destinations.js';
import { stages } from './core/stageRegistry.js';
import { createNavigator } from './core/navigation.js';
import { element, button } from './ui/dom.js';

// Stage-local styles live with their stage. URLs remain relative on GitHub Pages.
for (const stage of stages.filter(item => item.stylesheet)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = stage.stylesheet;
  document.head.append(link);
}

const app = document.querySelector('#app');
const status = element('p', 'On Earth · ready to begin', 'app-status');
status.setAttribute('aria-live', 'polite');
const error = element('p', '', 'app-error');
error.setAttribute('role', 'alert');
const stageContainer = element('div', undefined, 'app-stage');
const debug = element('details', undefined, 'app-debug');
const snapshot = element('pre');
debug.append(element('summary', 'Inspect shared state'), snapshot);
app.append(status, error, stageContainer, debug);

const navigator = createNavigator({
  container: stageContainer, stages, destinationIds: destinations.map(item => item.id),
  onStateChange(state) {
    error.textContent = '';
    const stage = stages.find(item => item.id === state.currentStage);
    const location = state.currentLocation === 'earth' ? 'Earth' : getDestination(state.currentLocation)?.name;
    status.textContent = `${location} · ${stage?.title ?? 'Mission complete'}`;
    snapshot.textContent = JSON.stringify(state, null, 2);
  },
  onError(problem) { error.textContent = problem.message; },
  onFinish(state) {
    stageContainer.append(element('h1', 'Integration sequence complete'));
    stageContainer.append(element('p', `The mission to ${getDestination(state.selectedDestinationId).name} completed all registered stages.`));
    stageContainer.append(button('Return to Earth · start a new mission', () => navigator.start()));
  },
});

stageContainer.append(element('h1', 'Begin on Earth'));
stageContainer.append(element('p', 'Test the foundation: choose a destination, build a rover payload, then enter Research.'));
const list = element('ul');
destinations.forEach(item => list.append(element('li', `${item.name} · ${item.mission.agency} ${item.mission.name}`)));
stageContainer.append(list, button('Start test mission', () => navigator.start()));
