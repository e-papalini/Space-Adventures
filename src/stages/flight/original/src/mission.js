(function () {
  const LANDING_RADIUS = 255;
  const SURVEY_RADIUS = 58;
  const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  function create(destination) {
    const world = window.FlightScene.createWorld(destination);
    return {
      destination: destination, world: world, state: 'flight', landingProgress: 0, attemptedLandings: 0
    };
  }
  function distanceToTarget(mission, ship) { const target = mission.world.target; return Math.hypot(target.x - ship.x, target.y - ship.y, target.z - ship.z); }
  function update(mission, ship, input, dt) {
    if (mission.state === 'flight') window.FlightPhysics.update(ship, input, dt);
    if (mission.state === 'landing') { mission.landingProgress += dt; if (mission.landingProgress >= 2.5) { mission.state = 'landed'; ship.x = mission.world.target.x; ship.y = mission.world.target.y; ship.z = 8; ship.vx = 0; ship.vy = 0; ship.vz = 0; } }
  }
  function landingReadiness(mission, ship) {
    const target = mission.world.target; const range = distanceToTarget(mission, ship); const speed = window.FlightPhysics.speed(ship);
    const bearing = Math.atan2(target.y - ship.y, target.x - ship.x); const alignment = Math.abs(angleDifference(ship.yaw, bearing));
    return { inRange: range <= LANDING_RADIUS, range: range, speed: speed, altitude: ship.z, alignment: alignment, stable: speed < 40 && ship.z < 65 && alignment < 1.15 };
  }
  function attemptLanding(mission, ship) {
    const readiness = landingReadiness(mission, ship); mission.attemptedLandings += 1;
    if (mission.state !== 'flight') return { ok: false, message: 'LANDING SEQUENCE UNAVAILABLE' };
    if (!readiness.inRange) return { ok: false, message: 'LANDING ABORTED / TARGET OUTSIDE LANDING ENVELOPE' };
    if (readiness.speed >= 40) return { ok: false, message: 'LANDING ABORTED / REDUCE RELATIVE VELOCITY BELOW 40 M/S' };
    if (readiness.altitude >= 65) return { ok: false, message: 'LANDING ABORTED / DESCEND TO THE SURFACE ENVELOPE' };
    if (readiness.alignment >= 1.15) return { ok: false, message: 'LANDING ABORTED / ALIGN WITH THE APPROACH VECTOR' };
    mission.state = 'landing'; mission.landingProgress = 0; return { ok: true, message: 'LANDING SEQUENCE INITIATED' };
  }
  function complete(mission) { return { destinationId: mission.destination.id, landed: mission.state === 'landed', roverDeployed: false, surveys: [], nextStage: 'research' }; }
  window.FlightMission = { create: create, update: update, distanceToTarget: distanceToTarget, landingReadiness: landingReadiness, attemptLanding: attemptLanding, complete: complete };
})();