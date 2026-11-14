import { cloneState, createGameState, validateState } from './gameState.js';

/** Only the core writes progression fields. A stage cannot jump ahead via its result. */
export function advanceState(current, proposed, stages, destinationIds) {
  if (current.missionStatus !== 'active') throw new Error('This mission is already complete.');
  const index = stages.findIndex(stage => stage.id === current.currentStage);
  if (index < 0) throw new Error('Unknown stage.');
  const expected = stages.slice(0, index).map(stage => stage.id);
  if (JSON.stringify(current.completedStages) !== JSON.stringify(expected)) {
    throw new Error('Complete the preceding stages first.');
  }
  const nextState = cloneState(proposed);
  validateState(nextState, destinationIds);
  if (current.selectedDestinationId && nextState.selectedDestinationId !== current.selectedDestinationId) {
    throw new Error('The destination is fixed after Preparation Part 1. Start a new mission to change it.');
  }
  if (stages[index].requiresDestination && !nextState.selectedDestinationId) {
    throw new Error('Select a destination before continuing.');
  }
  const next = stages[index + 1];
  if (next?.location === 'destination' && !nextState.selectedDestinationId) {
    throw new Error('Select a destination before departing Earth.');
  }
  nextState.completedStages = [...expected, stages[index].id];
  nextState.currentStage = next?.id ?? null;
  nextState.currentLocation = next
    ? (next.location === 'destination' ? nextState.selectedDestinationId : next.location)
    : current.currentLocation;
  nextState.missionStatus = next ? 'active' : 'complete';
  return nextState;
}

/** Stale callbacks are ignored. Cleanup runs before mounting another stage. */
export function createNavigator({ container, stages, destinationIds, onStateChange, onFinish, onError }) {
  if (!stages.length || new Set(stages.map(stage => stage.id)).size !== stages.length) {
    throw new Error('Stage registry must contain unique IDs.');
  }
  let state;
  let cleanup;
  let generation = 0;
  function unmount() {
    generation += 1;
    cleanup?.();
    cleanup = undefined;
    container.replaceChildren();
  }
  function render() {
    unmount();
    const token = generation;
    onStateChange(cloneState(state));
    if (state.missionStatus === 'complete') {
      onFinish(cloneState(state));
      return;
    }
    const stage = stages.find(item => item.id === state.currentStage);
    cleanup = stage.mount(container, cloneState(state), updated => {
      if (token !== generation) return;
      // Defer transition so even synchronous onComplete calls finish mounting first.
      queueMicrotask(() => {
        if (token !== generation) return;
        try {
          state = advanceState(state, updated, stages, destinationIds);
        } catch (error) {
          onError(error);
          return;
        }
        render();
      });
    });
  }
  return {
    start() { state = createGameState(stages[0].id); render(); },
    getState() { return cloneState(state); },
    destroy: unmount,
  };
}
