export function mount(container, state, onComplete) {
  const frame = document.createElement('iframe');
  frame.className = 'stage-flight'; frame.title = 'Outbound — spacecraft flight and landing';
  frame.src = new URL('./host.html', import.meta.url).href;
  let disposed = false, completed = false;
  function message(event) {
    if (disposed || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'flight-ready') frame.contentWindow.postMessage({type:'flight-init',destinationId:state.selectedDestinationId}, location.origin);
    if (event.data?.type === 'flight-complete' && !completed && event.data.result?.landed && event.data.result.destinationId === state.selectedDestinationId) {
      completed = true; state.stageData.flight = { ...event.data.result, fuelRemaining:event.data.fuelRemaining };
      onComplete(state);
    }
  }
  window.addEventListener('message', message); container.append(frame);
  frame.addEventListener('load', () => { if (!disposed) frame.contentWindow.focus(); }, {once:true});
  return () => { disposed = true; window.removeEventListener('message', message); frame.remove(); };
}
