import { destinations } from '../../data/destinations.js';
import { element } from '../../ui/dom.js';
import { mountPlaceholder } from '../../ui/placeholder.js';

export function mount(container, gameState, onComplete) {
  return mountPlaceholder(container, gameState, onComplete, {
    id: 'preparation1', title: 'Preparation Part 1',
    setup(controls, state, finish) {
      const label = element('label', 'Test destination selection ');
      const select = element('select');
      const prompt = element('option', 'Choose any destination');
      prompt.value = '';
      select.append(prompt);
      for (const destination of destinations) {
        const option = element('option', `${destination.name} · ${destination.mission.name}`);
        option.value = destination.id;
        select.append(option);
      }
      select.value = state.selectedDestinationId ?? '';
      finish.disabled = !state.selectedDestinationId;
      select.addEventListener('change', () => {
        state.selectedDestinationId = select.value || null;
        finish.disabled = !state.selectedDestinationId;
      });
      label.append(select);
      controls.append(label);
    },
  });
}
