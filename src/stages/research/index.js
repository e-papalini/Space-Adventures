import { mountPlaceholder } from '../../ui/placeholder.js';

export function mount(container, gameState, onComplete) {
  return mountPlaceholder(container, gameState, onComplete, { id: 'research', title: 'Research' });
}
