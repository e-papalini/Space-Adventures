// Runs inside the isolated original flight page. Original rendering, controls,
// physics, HUD and landing code run unchanged.
let initialized = false;
let destinationId;
window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'flight-init' || initialized) return;
  const id = event.data.destinationId === '67p' ? 'comet-67p' : event.data.destinationId;
  if (!window.GameDestinations[id]) return;
  const select = document.getElementById('destination-select');
  select.value = id; select.dispatchEvent(new Event('change')); select.disabled = true;
  initialized = true;
  destinationId = event.data.destinationId;
});
window.addEventListener('flightstagecomplete', event => {
  if (!initialized) return;
  parent.postMessage({type:'flight-complete', result:{...event.detail,destinationId},
    fuelRemaining:Number(document.getElementById('fuel-value').textContent)}, location.origin);
});
parent.postMessage({type:'flight-ready'}, location.origin);
