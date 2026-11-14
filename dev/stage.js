import { stages } from '../src/core/stageRegistry.js';
import { destinations } from '../src/data/destinations.js';
import { createGameState } from '../src/core/gameState.js';
import { element } from '../src/ui/dom.js';
import { applyResearchFixture } from './researchFixture.js';

const params = new URLSearchParams(location.search);
const stage = stages.find(item => item.id === params.get('stage')) ?? stages[0];
const destination = destinations.find(item => item.id === params.get('destination')) ?? destinations[0];
for (const [id, entries, selected] of [
  ['stage', stages, stage.id], ['destination', destinations, destination.id],
]) {
  const select = document.getElementById(id);
  entries.forEach(item => {
    const option = element('option', item.title ?? item.name);
    option.value = item.id;
    select.append(option);
  });
  select.value = selected;
}
if (stage.stylesheet) {
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = stage.stylesheet;
  document.head.append(link);
}
const state = createGameState(stage.id);
state.selectedDestinationId = destination.id;
state.currentLocation = stage.location === 'destination' ? destination.id : stage.location;
state.completedStages = stages.slice(0, stages.indexOf(stage)).map(item => item.id);
if (stage.id === 'research') applyResearchFixture(state, params, { freshDevelopmentState: true });
const cleanup = stage.mount(document.getElementById('stage-root'), state, updated => {
  document.getElementById('result').textContent = JSON.stringify(updated, null, 2);
});
window.addEventListener('pagehide', () => cleanup?.(), { once: true });
