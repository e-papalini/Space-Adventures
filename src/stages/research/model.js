import { bennu, actionSeconds, interactionRadius, instrumentsFor } from './config.js';
import { wrap, offsetTo, mapDistance } from './topology.js';

export function initialize(state) {
  state.stageData.research ??= {};
  const research = state.stageData.research;
  research.bennu ??= { position: { ...bennu.start }, tripDistance: 0, actions: [], returns: 0 };
  return research.bennu;
}

export function returnToFlag(state) {
  const trip = initialize(state);
  trip.position = { ...bennu.start };
  trip.tripDistance = 0;
  trip.returns += 1;
}

export function move(state, dx, dy) {
  const trip = initialize(state);
  // Small swept steps prevent tunnelling; tangent projection slides around rocks.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3));
  for (let i = 0; i < steps; i++) {
    let sx = dx / steps, sy = dy / steps;
    for (const rock of bennu.obstacles) {
      const toward = offsetTo(trip.position, rock), ox = -toward.x, oy = -toward.y;
      const distance = Math.hypot(ox, oy), radius = rock.r + bennu.roverRadius;
      if (Math.hypot(ox + sx, oy + sy) < radius) {
        const nx = distance ? ox / distance : 1, ny = distance ? oy / distance : 0;
        const inward = Math.min(0, sx * nx + sy * ny);
        sx -= inward * nx; sy -= inward * ny;
        // A small tangent nudge helps when pressing almost straight into a rock.
        // It only operates at contact; the player still chooses the direction.
        if (inward < 0 && Math.hypot(sx, sy) < Math.abs(inward) * .35) {
          const side = Math.sign(nx * (dy / steps) - ny * (dx / steps)) || 1;
          sx += -ny * side * Math.abs(inward) * .35;
          sy += nx * side * Math.abs(inward) * .35;
        }
      }
    }
    const next = {
      x: wrap(trip.position.x + sx, bennu.width),
      y: wrap(trip.position.y + sy, bennu.height),
    };
    if (bennu.obstacles.some(rock => mapDistance(next, rock) < rock.r + bennu.roverRadius - .001)) continue;
    trip.tripDistance += Math.hypot(sx, sy);
    trip.position = next;
  }
}

export function nearbySite(state) {
  const { position } = initialize(state);
  return bennu.sites.filter(site => mapDistance(position, site) <= interactionRadius)
    .sort((a, b) => mapDistance(position, a) - mapDistance(position, b))[0];
}

export function inspectSite(state, siteId) {
  const site = nearbySite(state);
  if (!site || site.id !== siteId) return { error: 'Move closer to this place to look at it.' };
  return { site, recommended: instrumentsFor(state).filter(item => site.kinds.includes(item.kind)) };
}

export function taskProgress(state, task) {
  return initialize(state).actions.filter(action => action.kind === task.kind).length;
}

export function missionReady(state) {
  const available = bennu.tasks.filter(task => instrumentsFor(state).some(item => item.kind === task.kind));
  return available.length > 0 && available.some(task => taskProgress(state, task) >= task.target);
}

export function actionError(state, instrumentId, siteId) {
  const trip = initialize(state);
  const instrument = instrumentsFor(state).find(item => item.id === instrumentId);
  const site = bennu.sites.find(item => item.id === siteId);
  if (!instrument) return 'This tool was not installed during Preparation.';
  if (!site || nearbySite(state)?.id !== site.id) return 'Move closer to this science marker.';
  if (!site.kinds.includes(instrument.kind)) return 'This tool cannot investigate this place. Try one of the suggested tools.';
  if (instrument.singleUse && trip.actions.some(action => action.instrumentId === instrument.id)) return 'This single-use tool has already been used.';
  if (trip.actions.some(action => action.siteId === site.id && action.kind === instrument.kind)) return 'You already saved this finding. No energy or storage was used.';
  const energy = instrument.watts * actionSeconds / 3600;
  if (state.remainingEnergy < energy) return 'Not enough energy to use this tool.';
  if (state.remainingStorage < instrument.mb) return 'Not enough storage space to save this finding.';
  return null;
}

export function performAction(state, instrumentId, siteId) {
  const error = actionError(state, instrumentId, siteId);
  if (error) return { error };
  const trip = initialize(state);
  const instrument = instrumentsFor(state).find(item => item.id === instrumentId);
  const site = bennu.sites.find(item => item.id === siteId);
  const energy = instrument.watts * actionSeconds / 3600;
  const explanations = {
    camera: `You took a picture of the ${site.name.toLowerCase()}. It shows the shape and surface. A photo alone cannot tell us exactly what the rocks are made of.`,
    infrared: 'In this simulation, the light pattern suggests minerals that hold water. Water may have changed these rocks long ago, in the larger body Bennu came from. This does not mean liquid water is here now. More study is needed to name the minerals.',
    lidar: 'You mapped the height of this patch of dust and rocks. Laser measurements help us choose where to collect samples. They do not tell us what the rocks are made of or prove that a place is safe.',
    sample: 'You picked up a small sample of dust and rock. Scientists can study it in a lab later. It may hold minerals and carbon-based chemicals, called organic compounds. Picking it up does not tell us what is inside. Organic compounds are not proof of life.',
  };
  const discovery = { destinationId: 'bennu', discoveryId: `research-${site.id}-${instrument.kind}`, siteId: site.id, instrumentId, kind: instrument.kind, explanation: explanations[instrument.kind], simulated: true };
  state.remainingEnergy -= energy;
  state.remainingStorage -= instrument.mb;
  state.scientificDiscoveries.push(discovery);
  if (instrument.kind === 'sample') state.collectedSamples.push({ destinationId: 'bennu', materialId: 'unanalysed-regolith', quantity: 1, siteId: site.id });
  trip.actions.push({ siteId: site.id, kind: instrument.kind, instrumentId });
  return { discovery };
}
