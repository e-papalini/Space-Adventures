import { mountPlaceholder } from '../../ui/placeholder.js';

export function mount(container, gameState, onComplete) {
  return mountPlaceholder(container, gameState, onComplete, { id: 'preparation2', title: 'Preparation Part 2' });
}
