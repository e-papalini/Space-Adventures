(function () {
  // Integration-only assistance. The original Flight game stays unchanged.
  const radius = 450, holdSeconds = 4, approaches = new WeakMap(), holds = new WeakMap();
  const originalUpdate = window.FlightMission.update;
  window.FlightMission.update = function (mission, ship, input, dt) {
    originalUpdate(mission, ship, input, dt);
    if (mission.state === 'flight') {
      const inside = window.FlightMission.distanceToTarget(mission, ship) <= radius;
      const held = inside ? Math.min(holdSeconds, (holds.get(mission) ?? 0) + Math.max(0, Math.min(dt,.1))) : 0;
      holds.set(mission, held);
      mission.approachSeconds = held;
      if (held >= holdSeconds) {
      approaches.set(mission, { x:ship.x, y:ship.y, z:ship.z, vx:ship.vx, vy:ship.vy, vz:ship.vz });
      mission.state = 'landing'; mission.landingProgress = 0;
      document.getElementById('scene-subtitle').textContent = 'You made it! Automatic landing is taking you in.';
      }
    }
    const from = approaches.get(mission);
    if (from && (mission.state === 'landing' || mission.state === 'landed')) {
      const t = Math.min(1, mission.landingProgress / 2.5), ease = t * t * (3 - 2 * t), target = mission.world.target;
      ship.x = from.x + (target.x-from.x)*ease;
      ship.y = from.y + (target.y-from.y)*ease;
      ship.z = from.z + (8-from.z)*ease;
      ship.vx = from.vx*(1-t)*(1-t); ship.vy = from.vy*(1-t)*(1-t); ship.vz = from.vz*(1-t)*(1-t);
      ship.throttle *= Math.exp(-5*dt);
    }
  };
  // The original F-key/button path must not bypass the new approach challenge.
  window.FlightMission.attemptLanding = function () {
    return {ok:false,message:'Stay in the landing zone for four seconds. Landing starts by itself!'};
  };
  const originalHud = window.FlightHud.update;
  window.FlightHud.update = function (...args) {
    originalHud(...args);
    const mission = args[0];
    document.getElementById('landing-action').hidden = true;
    document.getElementById('landing-action').style.display = 'none';
    const held=holds.get(mission)??0, inside=window.FlightMission.distanceToTarget(mission,args[1])<=radius;
    const text=mission.state==='flight' ? inside ? `Landing approach: ${Math.max(0,Math.ceil(holdSeconds-held))}… Stay nearby!` : 'Fly within 450 m, then stay nearby for 4 seconds.' : 'You made it! Automatic landing is taking you in.';
    document.getElementById('guidance-text').textContent=text;
    document.getElementById('scene-subtitle').textContent=text;
    let indicator=document.getElementById('auto-landing-progress');
    if (!indicator) {
      indicator=document.createElement('progress');indicator.id='auto-landing-progress';indicator.max=holdSeconds;
      indicator.setAttribute('aria-label','Time held inside the landing zone');
      indicator.style.cssText='display:block;width:100%;height:8px;margin-top:10px;accent-color:#92e4d3';
      const guidance=document.getElementById('guidance-text');
      (guidance.parentElement??guidance).after(indicator);
    }
    indicator.value=held;indicator.hidden=mission.state!=='flight'||!inside;
    indicator.style.display=indicator.hidden?'none':'block';
  };
  window.FlightAutoLanding = { radius, holdSeconds };
})();
