const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);

// No canvas-focus gate. Ignore typing, modifiers and the harness's form controls.
export function isTyping(target) {
  return Boolean(target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName));
}

export function bindControls({ host, pad, active, interact, select, onBlur, target = window }) {
  const keyboard = new Set(), touches = new Map();
  function clear() { keyboard.clear(); touches.clear(); onBlur?.(); }
  function down(event) {
    if (!active() || isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (movementKeys.has(key)) { event.preventDefault(); keyboard.add(key); }
    if (key === 'e' && !event.repeat) { event.preventDefault(); interact(); }
    if (/^[1-9]$/.test(key) && !event.repeat) select(Number(key) - 1);
  }
  function up(event) { keyboard.delete(event.key.toLowerCase()); }
  function pointerDown(event) {
    const control = event.target.closest('[data-direction]');
    if (!control || !active()) return;
    event.preventDefault(); control.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, control.dataset.direction);
  }
  function pointerUp(event) { touches.delete(event.pointerId); }
  target.addEventListener('keydown', down); target.addEventListener('keyup', up); target.addEventListener('blur', clear);
  pad.addEventListener('pointerdown', pointerDown);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, pointerUp);
  function visibility() { if (host.ownerDocument.hidden) clear(); }
  host.ownerDocument.addEventListener('visibilitychange', visibility);
  return {
    keys: () => new Set([...keyboard, ...touches.values()]), clear,
    destroy() {
      clear(); target.removeEventListener('keydown', down); target.removeEventListener('keyup', up); target.removeEventListener('blur', clear);
      pad.removeEventListener('pointerdown', pointerDown);
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.removeEventListener(type, pointerUp);
      host.ownerDocument.removeEventListener('visibilitychange', visibility);
    },
  };
}
