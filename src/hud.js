(function () {
  const byId = (id) => document.getElementById(id);
  const destinations = window.GameDestinations;
  function setupDestinationSelect(select, initialId, onChange) {
    Object.values(destinations).forEach((destination) => { const option = document.createElement('option'); option.value = destination.id; option.textContent = destination.name; select.appendChild(option); });
    select.value = destinations[initialId] ? initialId : 'bennu';
    select.addEventListener('change', () => onChange(destinations[select.value]));
  }
  function updateDestination(destination) { byId('destination-mission').textContent = destination.mission; byId('destination-year').textContent = destination.year; byId('destination-fact').textContent = destination.fact; byId('target-label').textContent = destination.targetName; }
  function update(mission, ship, camera, canvas, message, phaseText) {
    const target = mission.world.target; const range = window.FlightMission.distanceToTarget(mission, ship); const speed = window.FlightPhysics.speed(ship); const readiness = window.FlightMission.landingReadiness(mission, ship);
    const bearing = Math.atan2(target.y - ship.y, target.x - ship.x); const bearingDegrees = ((bearing - ship.yaw) * 180 / Math.PI + 360) % 360;
    byId('speed-value').textContent = String(Math.round(speed)).padStart(3, '0'); byId('speed-meter').style.width = `${Math.min(100, speed / 2.1)}%`;
    byId('fuel-value').textContent = String(Math.round(ship.fuel)).padStart(3, '0'); byId('fuel-percent').textContent = `${Math.round(ship.fuel)}%`; byId('fuel-meter').style.width = `${ship.fuel}%`;
    byId('range-value').innerHTML = `${(range / 1000).toFixed(2)} <small>km</small>`; byId('altitude-value').innerHTML = `${Math.round(ship.z)} <small>m</small>`;
    byId('bearing-value').textContent = `${String(Math.round(bearingDegrees)).padStart(3, '0')}°`; byId('guidance-arrow').style.transform = `rotate(${bearingDegrees}deg)`;
    byId('guidance-text').textContent = range < 255 ? 'Landing envelope acquired' : 'Follow bearing to target'; byId('target-signal').textContent = range < 255 ? 'LOCKED' : range < 900 ? 'TRACKING' : 'SEARCHING'; byId('target-signal').style.color = range < 255 ? 'var(--lime)' : 'var(--orange)';
    const stability = Math.min(100, Math.max(0, 50 + (readiness.speed - 20) * 1.1 + readiness.alignment * 11));
    byId('stability-meter').style.left = `${stability}%`; byId('stability-label').textContent = readiness.stable ? 'SAFE WINDOW' : readiness.inRange ? 'ADJUST VECTOR' : 'NOMINAL'; byId('stability-label').style.color = readiness.stable ? 'var(--lime)' : readiness.inRange ? 'var(--orange)' : 'var(--lime)';
    byId('flight-mode').textContent = phaseText; byId('mission-state').textContent = mission.state === 'landed' ? 'TOUCHDOWN CONFIRMED' : mission.state === 'flight' ? 'MISSION ACTIVE' : mission.state.toUpperCase();
    byId('scene-kicker').textContent = 'FLIGHT OPERATIONS / 01';
    byId('scene-title').textContent = mission.state === 'landed' ? 'Touchdown' : mission.state === 'flight' ? 'Outbound' : mission.state === 'landing' ? 'Landing' : 'Rendezvous';
    byId('scene-subtitle').textContent = mission.state === 'landed' ? 'Flight stage complete. Research handoff ready.' : mission.state === 'flight' ? 'Rendezvous with your assigned target.' : mission.state === 'landing' ? 'Automated descent guidance engaged.' : 'Controlled approach to the landing zone.';
    byId('progress-detail').textContent = mission.state === 'flight' ? 'TARGET ACQUISITION' : mission.state === 'landing' ? 'CONTROLLED DESCENT' : mission.state === 'landed' ? 'FLIGHT STAGE COMPLETE' : 'TARGET ACQUISITION';
    byId('progress-label').textContent = mission.state === 'landed' ? '03 / 04' : mission.state === 'flight' ? '01 / 04' : '02 / 04';
    byId('flight-node').classList.toggle('active', mission.state === 'flight' || mission.state === 'landing'); byId('flight-node').classList.toggle('done', mission.state === 'landed'); byId('research-node').classList.toggle('active', mission.state === 'landed');
    const marker = window.FlightScene.project(target, ship, camera, canvas.clientWidth, canvas.clientHeight); const tag = byId('target-tag');
    tag.style.left = `${Math.max(8, Math.min(92, marker.x / canvas.clientWidth * 100))}%`; tag.style.top = `${Math.max(15, Math.min(83, marker.y / canvas.clientHeight * 100))}%`;
    drawRadar(mission, ship); drawLandingOverlay(mission, readiness); drawMessage(message);
  }
  function drawRadar(mission, ship) {
    const canvas = byId('radar'); const ctx = canvas.getContext('2d'); const width = canvas.clientWidth; const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height); ctx.strokeStyle = 'rgba(146, 228, 211, .12)';
    [24, 48, 72].forEach((radius) => { ctx.beginPath(); ctx.ellipse(width / 2, height, radius, radius * .49, 0, Math.PI, Math.PI * 2); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(146, 228, 211, .08)'; ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.moveTo(0, height - 1); ctx.lineTo(width, height - 1); ctx.stroke();
    const range = 2200;
    mission.world.asteroids.forEach((asteroid) => { const dx = asteroid.x - ship.x; const dy = asteroid.y - ship.y; if (Math.hypot(dx, dy) > range) return; const px = width / 2 + dx / range * width * .46; const py = height - 5 - Math.abs(dy / range) * height * .8; ctx.fillStyle = asteroid.target ? '#e69b68' : 'rgba(180, 196, 184, .58)'; ctx.beginPath(); ctx.arc(px, py, asteroid.target ? 3.2 : 1.5, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#92e4d3'; ctx.beginPath(); ctx.moveTo(width / 2, height - 7); ctx.lineTo(width / 2 - 4, height - 1); ctx.lineTo(width / 2 + 4, height - 1); ctx.closePath(); ctx.fill();
  }
  function drawLandingOverlay(mission, readiness) {
    const overlay = byId('landing-overlay'); const nearLanding = mission.state === 'flight' && readiness.inRange; const resultVisible = mission.state === 'landed';
    overlay.hidden = !(nearLanding || resultVisible); if (overlay.hidden) return;
    byId('landing-title').textContent = resultVisible ? 'Touchdown confirmed' : 'Landing approach';
    byId('landing-copy').textContent = resultVisible ? 'Touchdown is secure. Flight stage complete; the Research handoff is ready.' : readiness.stable ? 'Approach vector is stable. Confirm the landing sequence when ready.' : 'Reduce velocity, descend, and align with the target before committing.';
    byId('landing-speed').textContent = `${Math.round(readiness.speed)} m/s`; byId('landing-altitude').textContent = `${Math.round(readiness.altitude)} m`;
    const action = byId('landing-action'); action.textContent = resultVisible ? 'Flight complete' : 'Attempt landing'; action.disabled = resultVisible; action.dataset.action = resultVisible ? 'complete' : 'land';
  }
  function drawMessage(message) { const banner = byId('message-banner'); banner.textContent = message.text; banner.classList.toggle('visible', performance.now() < message.until); }
  window.FlightHud = { setupDestinationSelect: setupDestinationSelect, updateDestination: updateDestination, update: update };
})();