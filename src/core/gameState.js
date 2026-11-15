export const STATE_VERSION = 1;

/** Fresh arrays and objects for every mission; no browser persistence yet. */
export function createGameState(firstStage = 'preparation1') {
  return {
    missionId: globalThis.crypto?.randomUUID?.() ?? `mission-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    schemaVersion: STATE_VERSION,
    selectedDestinationId: null,
    currentLocation: 'earth',
    currentStage: firstStage,
    missionStatus: 'active',
    completedStages: [],
    selectedEquipment: [],
    remainingEnergy: 100,
    remainingStorage: 100,
    collectedSamples: [],
    scientificDiscoveries: [],
    stageData: {},
  };
}

export function cloneState(state) {
  return structuredClone(state);
}

/** Validate shared fields; stages can add JSON-compatible fields under stageData. */
export function validateState(state, destinationIds) {
  if (!state || state.schemaVersion !== STATE_VERSION) throw new Error('Unsupported game state version.');
  if (state.selectedDestinationId !== null && !destinationIds.includes(state.selectedDestinationId)) {
    throw new Error('Choose a valid destination.');
  }
  for (const key of ['selectedEquipment', 'collectedSamples', 'scientificDiscoveries']) {
    if (!Array.isArray(state[key])) throw new Error(`${key} must be an array.`);
  }
  for (const key of ['remainingEnergy', 'remainingStorage']) {
    if (!Number.isFinite(state[key]) || state[key] < 0) throw new Error(`${key} must be a non-negative number.`);
  }
  if (!state.stageData || typeof state.stageData !== 'object' || Array.isArray(state.stageData)) {
    throw new Error('stageData must be an object.');
  }
}
