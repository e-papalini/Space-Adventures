(function () {
  const canvas = document.getElementById('scene'); const context = canvas.getContext('2d'); const radarCanvas = document.getElementById('radar');
  const keys = new Set(); const camera = { yaw: 0, pitch: 0 };
  let destination = window.GameDestinations.bennu; let ship = window.FlightPhysics.createShip(); let mission = window.FlightMission.create(destination);
  let lastTime = 0; let message = { text: '', until: 0 }; let particles = []; let completedResult = null; let mouse = { x: 0, y: 0 };
  const input = {
    get forward() { return keys.has('w') || keys.has('arrowup'); }, get reverse() { return keys.has('s') || keys.has('arrowdown'); },
    get left() { return keys.has('a') || keys.has('arrowleft'); }, get right() { return keys.has('d') || keys.has('arrowright'); },
    get rollLeft() { return keys.has('q'); }, get rollRight() { return keys.has('e'); },
    get up() { return keys.has(' ') || keys.has('space'); }, get down() { return keys.has('control') || keys.has('ctrl'); }, get boost() { return keys.has('shift'); }
  };
  function resize() {
    const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
    radarCanvas.width = Math.max(1, Math.round(radarCanvas.clientWidth * dpr)); radarCanvas.height = Math.max(1, Math.round(radarCanvas.clientHeight * dpr));
  }
  function emitExhaust(dt) {
    if (mission.state !== 'flight' || ship.throttle < .05) return;
    const rate = ship.throttle * (input.boost ? 105 : 55); const count = Math.floor(rate * dt + Math.random());
    for (let i = 0; i < count; i++) {
      const angle = ship.yaw + Math.PI + (Math.random() - .5) * .55; const velocity = 22 + Math.random() * 50;
      particles.push({ x: ship.x - Math.cos(ship.yaw) * 26 + (Math.random() - .5) * 4, y: ship.y - Math.sin(ship.yaw) * 26 + (Math.random() - .5) * 4, z: ship.z, vx: Math.cos(angle) * velocity + ship.vx * .25, vy: Math.sin(angle) * velocity + ship.vy * .25, vz: (Math.random() - .5) * 15, life: .24 + Math.random() * .32, size: 1.2 + Math.random() * 2.4, color: Math.random() > .35 ? '#edaa6c' : '#f5d6a2' });
    }
  }
  function updateParticles(dt) { particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt; }); particles = particles.filter((p) => p.life > 0); }
  function notify(text, duration) { message.text = text; message.until = performance.now() + (duration || 2600); }
  function beginLanding() { const result = window.FlightMission.attemptLanding(mission, ship); notify(result.message, 3000); }
  function handleAction() { beginLanding(); }
  function handleKeyDown(event) {
    const key = event.key.toLowerCase(); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault(); keys.add(key);
    if (key === 'f' && mission.state === 'flight' && window.FlightMission.landingReadiness(mission, ship).inRange) beginLanding();
  }
  function handleKeyUp(event) { keys.delete(event.key.toLowerCase()); }
  function render(now) {
    const dt = Math.min(.04, (now - (lastTime || now)) / 1000); lastTime = now;
    camera.yaw += (mouse.x * .17 - camera.yaw) * Math.min(1, dt * 2.5); camera.pitch += (mouse.y * .1 - camera.pitch) * Math.min(1, dt * 2.5);
    if (mission.state === 'flight' && input.boost && ship.fuel > 0) ship.throttle = Math.max(ship.throttle, .38);
    const previousState = mission.state;
    window.FlightMission.update(mission, ship, input, dt);
    if (previousState === 'landing' && mission.state === 'landed' && !completedResult) {
      completedResult = window.FlightMission.complete(mission);
      notify('FLIGHT STAGE COMPLETE / RESEARCH HANDOFF READY', 4200);
      window.dispatchEvent(new CustomEvent('flightstagecomplete', { detail: completedResult }));
    }
    emitExhaust(dt); updateParticles(dt);
    const rect = canvas.getBoundingClientRect(); const logicalWidth = rect.width; const logicalHeight = rect.height;
    const scale = Math.min(window.devicePixelRatio || 1, 2); context.setTransform(scale, 0, 0, scale, 0, 0);
    window.FlightScene.draw(mission.world, context, ship, camera, now, particles, null, []);
    window.FlightHud.update(mission, ship, camera, canvas, message, mission.state === 'flight' ? 'FREE DRIFT' : mission.state.toUpperCase());
    if (mission.state === 'landing') drawSequence('LANDING SEQUENCE', mission.landingProgress / 2.5, logicalWidth, logicalHeight);
    requestAnimationFrame(render);
  }
  function drawSequence(title, progress, width, height) {
    const scale = Math.min(window.devicePixelRatio || 1, 2); context.setTransform(scale, 0, 0, scale, 0, 0);
    const x = width / 2 - 110; const y = height - 62; context.fillStyle = 'rgba(7, 15, 16, .86)'; context.fillRect(x, y, 220, 32); context.strokeStyle = 'rgba(146, 228, 211, .45)'; context.strokeRect(x, y, 220, 32); context.fillStyle = '#92e4d3'; context.font = '8px monospace'; context.fillText(title, x + 12, y + 13); context.fillStyle = '#344642'; context.fillRect(x + 12, y + 20, 196, 3); context.fillStyle = '#92e4d3'; context.fillRect(x + 12, y + 20, 196 * Math.min(1, progress), 3);
  }
  function selectDestination(nextDestination) {
    if (mission.state !== 'flight') { notify('DESTINATION LOCKED AFTER APPROACH BEGINS / RESTART TO CHANGE', 2600); document.getElementById('destination-select').value = destination.id; return; }
    destination = nextDestination; ship = window.FlightPhysics.createShip(); ship.yaw = Math.atan2(-1010, 1750); mission = window.FlightMission.create(destination); particles = []; completedResult = null; window.FlightHud.updateDestination(destination); notify(`DESTINATION UPDATED / ${destination.name.toUpperCase()}`, 2200);
  }
  function restart() { ship = window.FlightPhysics.createShip(); ship.yaw = Math.atan2(-1010, 1750); mission = window.FlightMission.create(destination); particles = []; completedResult = null; notify('FLIGHT RESET / PREP 2 HANDOFF RESTORED', 2200); }
  document.addEventListener('keydown', handleKeyDown); document.addEventListener('keyup', handleKeyUp); window.addEventListener('blur', () => keys.clear()); window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', (event) => { const rect = canvas.getBoundingClientRect(); mouse.x = (event.clientX - rect.left - rect.width / 2) / Math.max(1, rect.width / 2); mouse.y = (event.clientY - rect.top - rect.height / 2) / Math.max(1, rect.height / 2); });
  canvas.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; }); document.getElementById('landing-action').addEventListener('click', handleAction); document.getElementById('reset-button').addEventListener('click', restart);
  window.FlightHud.setupDestinationSelect(document.getElementById('destination-select'), destination.id, selectDestination); window.FlightHud.updateDestination(destination); resize();
  // The host game calls this stage only after Prep 2; the standalone page uses a completed Prep 2 handoff for local play.
  window.FlightStage = {
    id: 'flight',
    canEnter: function (context) { return window.GameStageFlow.canEnter('flight', context) && Boolean(window.GameDestinations[context.destinationId]); },
    getResult: function () { return completedResult; }, getMission: function () { return mission; }, reset: restart
  };
  requestAnimationFrame(render);
})();