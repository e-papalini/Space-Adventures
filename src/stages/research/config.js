// Gameplay IDs are a provisional integration contract, not a fixture import.
// Preparation can emit these IDs or supply matching definitions through
// stageData.researchEquipmentDefinitions. Research never installs instruments.
export const bennu = {
  id: 'bennu', width: 1800, height: 1200, start: { x: 110, y: 310 },
  speed: 100,
  missionDurationSeconds: 300, roverRadius: 11, acceleration: 7, braking: 10,
  actionDurationSeconds: 1.4, returnAnimationSeconds: 1.2,
  instruments: [
    { id: 'bennu-camera', name: 'High-resolution camera', watts: 8, mb: 20, kind: 'camera' },
    { id: 'bennu-infrared', name: 'Infrared spectrometer', watts: 15, mb: 12, kind: 'infrared' },
    { id: 'bennu-lidar', name: 'LiDAR', watts: 20, mb: 15, kind: 'lidar' },
    { id: 'bennu-sample-arm', name: 'Sample collection arm', watts: 30, mb: 5, kind: 'sample' },
  ],
  sites: [
    { id: 'boulder', name: 'Cracked rock', x: 255, y: 235, kinds: ['camera'], feature: 'boulder', hint: 'Cracks and shapes can tell us how a rock has changed.', question: 'Take a close look at the cracks and surface.', why: 'A camera records shape and texture. A picture cannot tell us exactly what a rock is made of.' },
    { id: 'crater', name: 'Shallow crater', x: 740, y: 420, kinds: ['camera'], feature: 'crater', hint: 'This low, round dip is a crater. You can drive across this shallow one.', question: 'Record the shape of the crater.', why: 'A camera shows its shape and the rocks around it.' },
    { id: 'ridge', name: 'Rocky ridge', x: 1280, y: 270, kinds: ['camera'], feature: 'ridge', hint: 'A ridge is a raised strip of ground.', question: 'Look at how rocks are spread along the ridge.', why: 'A camera helps us compare the ground in different places.' },
    { id: 'mineral', name: 'Dark rock patch', x: 540, y: 880, kinds: ['infrared'], feature: 'outcrop', hint: 'These dark rocks may hold clues about Bennu’s past.', question: 'Look for clues that water once changed these rocks.', why: 'A spectrometer studies light from rocks. Some patterns can point to minerals that hold water.' },
    { id: 'sampling', name: 'Loose dust and rocks', x: 1260, y: 930, kinds: ['lidar', 'sample'], feature: 'regolith', hint: 'Loose dust and small rocks cover this patch of ground.', question: 'Map the ground or pick up a small sample to study later.', why: 'LiDAR uses laser measurements to map the ground. The collection arm picks up pieces for later study.' },
  ],
  obstacles: [ { x: 420, y: 350, r: 24 }, { x: 950, y: 650, r: 30 }, { x: 235, y: 730, r: 20 }, { x: 1490, y: 480, r: 34 } ],
  tasks: [
    { id: 'photos', kind: 'camera', label: 'Take pictures of three rocky places', target: 3 },
    { id: 'hydration', kind: 'infrared', label: 'Look for minerals with signs of water', target: 1 },
    { id: 'mapping', kind: 'lidar', label: 'Map a place to collect rocks', target: 1 },
    { id: 'sample', kind: 'sample', label: 'Pick up a small rock or dust sample', target: 1 },
  ],
};

export const actionSeconds = 60;
export const interactionRadius = 65;

// Names/IDs come from the installed catalogue. Only explanations are local.
export const toolGuides = {
  camera: { description: 'Take pictures of interesting rocks and places.', example: 'Try it at a cracked rock, a crater or a ridge.' },
  infrared: { description: 'Study light from rocks to find clues about what they are made of.', example: 'Try it at the dark rock patch to look for signs of water.' },
  lidar: { description: 'Use laser measurements to map the ground.', example: 'Try it where loose dust and rocks could be collected.' },
  sample: { description: 'Pick up small pieces of rock or dust to study later.', example: 'Try it at the loose dust and rocks patch.' },
};

export function instrumentsFor(state) {
  const definitions = state.stageData.researchEquipmentDefinitions ?? bennu.instruments;
  return definitions.filter(item => state.selectedEquipment.includes(item.id)
    && bennu.tasks.some(task => task.kind === item.kind)
    && Number.isFinite(item.watts) && item.watts >= 0
    && Number.isFinite(item.mb) && item.mb >= 0);
}
