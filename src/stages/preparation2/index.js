import { mount as mountBuilder } from './rover-building/index.mjs';
import { prepareResearchEquipment } from '../../data/equipment.js';

export function mount(container, state, onComplete) {
  // Keep the builder's map/graphics, but the mission destination is fixed on Earth.
  function lockDestination(event) {
    const choice = event.target.closest('[data-action="select-destination"]');
    if (choice && choice.dataset.destinationId !== state.selectedDestinationId) {
      event.stopImmediatePropagation(); event.preventDefault();
    }
  }
  container.addEventListener('click', lockDestination, true);
  const cleanup = mountBuilder(container, state, updated => {
    prepareResearchEquipment(updated);
    updated.stageData.preparation2 = { ...updated.stageData.preparation2,
      otherLoadoutMassKg:updated.payloadMass, loadoutLimitKg:20.2,
      antenna:{id:'high-gain-dish',name:'Standard spacecraft radio · high-gain dish',massKg:5.2,maxDataPerContactMb:6},
    };
    onComplete(updated);
  });
  return () => { container.removeEventListener('click', lockDestination, true); cleanup(); };
}
