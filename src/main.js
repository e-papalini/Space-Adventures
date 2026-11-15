import { destinations, getDestination } from './data/destinations.js';
import { stages } from './core/stageRegistry.js';
import { createNavigator } from './core/navigation.js';
import { element, button } from './ui/dom.js';
import { progressStore, canStartDestination } from './core/progression.js';
import { renderMissionResults } from './ui/missionResults.js';

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
  canSelectDestination: id => canStartDestination(id,progressStore.load()),
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
    renderMissionResults(stageContainer,state,()=>navigator.start());
  },
});

stageContainer.append(element('h1', 'Your mission starts on Earth'));
stageContainer.append(element('p', 'Choose Bennu, build your scientific payload, fly to your destination, explore with your installed tools, then send your findings home. Bennu is the complete integrated route; the other destination games remain available for future integration.'));
const list = element('ul');
destinations.forEach(item => list.append(element('li', `${item.name} · ${item.mission.agency} ${item.mission.name}`)));
stageContainer.append(list, button('Start mission', () => navigator.start()));
