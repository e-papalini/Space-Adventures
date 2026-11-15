import { equipment } from '../stages/preparation2/rover-building/data/equipment.mjs';

// Preparation IDs are authoritative. Preserve them in selectedEquipment.
const researchKinds = {
  'bennu-camera': 'camera', 'bennu-ir-spectrometer': 'infrared',
  'bennu-lidar': 'lidar', 'bennu-sample-arm': 'sample',
};
export { equipment };
export function prepareResearchEquipment(state) {
  state.stageData.researchEquipmentDefinitions = equipment
    .filter(item => item.destinationId === state.selectedDestinationId && researchKinds[item.id])
    .map(item => ({ id: item.id, name: item.name, kind: researchKinds[item.id], watts: item.power, mb: item.data }));
}
