import { equipment } from '../../data/equipment.js';
import { bennu } from '../research/config.js';

// Convert already-stored observations into antenna-sized packets. No scans are
// recollected, and no storage/energy is charged a second time at stage entry.
export function prepareTransmission(state, packetLimit = 6) {
  const data = state.stageData.research ??= {};
  data.scans ??= []; data.transmittedFindings ??= [];
  const imported = data.packetizedDiscoveries ??= [];
  const definitions = [...(state.stageData.researchEquipmentDefinitions ?? []), ...equipment.map(item => ({ id:item.id, mb:item.data })), ...bennu.instruments];
  for (const discovery of state.scientificDiscoveries.filter(item => item.destinationId === state.selectedDestinationId && item.instrumentId)) {
    if (imported.includes(discovery.discoveryId)) continue;
    const size = definitions.find(item => item.id === discovery.instrumentId)?.mb;
    if (!Number.isFinite(size) || size <= 0) continue;
    let remaining = size, sequence = 0;
    while (remaining > .000001) {
      const sizeMb = Math.min(packetLimit, remaining);
      data.scans.push({ id:`${discovery.destinationId}-${discovery.discoveryId}-packet-${++sequence}`, name:`${discovery.siteId} · ${discovery.kind} · packet ${sequence}`,
        sizeMb, sourceDiscoveryId:discovery.discoveryId, explanation:discovery.explanation });
      remaining -= sizeMb;
    }
    imported.push(discovery.discoveryId);
  }
  state.stageData.transmission ??= { enteredWithEnergy:state.remainingEnergy, enteredWithStorage:state.remainingStorage };
}
