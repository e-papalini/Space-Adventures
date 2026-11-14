// TEMPORARY DEVELOPMENT FIXTURE ONLY. Remove this harness injection when
// Preparation supplies selectedEquipment and the real equipment catalogue.
// Research does not import this file. Partial loadouts: &equipment=camera,lidar
import { bennu } from '../src/stages/research/config.js';

export function applyResearchFixture(state, params, { freshDevelopmentState = false } = {}) {
  // Only seed a fresh harness state. Never replace an existing loadout or a
  // catalogue supplied by Preparation, including an intentionally empty one.
  if (!freshDevelopmentState || state.selectedDestinationId !== 'bennu' || state.selectedEquipment.length
    || state.stageData.researchEquipmentDefinitions !== undefined
    || state.stageData.developmentFixture) return;
  const aliases = { camera: 'camera', infrared: 'infrared', lidar: 'lidar', arm: 'sample' };
  const requested = params.has('equipment') ? params.get('equipment').split(',').map(id => aliases[id] ?? id) : null;
  state.selectedEquipment = bennu.instruments.filter(item => requested === null || requested.includes(item.kind) || requested.includes(item.id)).map(item => item.id);
  state.stageData.developmentFixture = true;
}
