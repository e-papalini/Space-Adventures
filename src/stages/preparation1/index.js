import { renderDestinationMap } from '../preparation2/rover-building/destinationMap.mjs';
import { destinations } from '../preparation2/rover-building/data/destinations.mjs';

export function mount(container, state, onComplete) {
  const root = document.createElement('section'); root.id = 'rover-building-root';
  let selected = state.selectedDestinationId, done = false;
  function render() {
    root.innerHTML = renderDestinationMap(destinations, selected)
      .replace('Every destination is open for selection.', 'Bennu is ready for the complete five-stage mission.')
      .replace('Select any map marker', 'Select Bennu’s map marker');
    for (const button of root.querySelectorAll('[data-action="select-destination"]')) {
      if (button.dataset.destinationId !== 'bennu') {
        button.disabled = true; button.title = 'Full mission integration is currently available for Bennu only.';
      }
    }
    const notice = document.createElement('p'); notice.className = 'earth-integration-note';
    notice.textContent = 'Complete mission: Bennu. Other destinations are preserved in the individual games, but their exploration routes are not integrated yet.';
    root.append(notice);
  }
  function click(event) {
    const action = event.target.closest('[data-action]');
    if (!action || done) return;
    if (action.dataset.action === 'select-destination' && action.dataset.destinationId === 'bennu') { selected = 'bennu'; render(); }
    if (action.dataset.action === 'confirm-destination' && selected === 'bennu') { done = true; state.selectedDestinationId = selected; onComplete(state); }
  }
  root.addEventListener('click', click); container.append(root); render();
  return () => { done = true; root.removeEventListener('click', click); root.remove(); };
}
