(function () {
  const MAX_FUEL = 100;
  const ACCELERATION = 94;
  const BOOST_MULTIPLIER = 2.05;
  const TURN_RATE = 1.45;
  function createShip() { return { x: 0, y: 0, z: 92, vx: 0, vy: 0, vz: 0, yaw: -0.49, roll: 0, fuel: MAX_FUEL, throttle: 0 }; }
  function update(ship, input, deltaSeconds) {
    const dt = Math.min(deltaSeconds, 0.04);
    const boost = input.boost && ship.fuel > 0;
    const thrustPower = boost ? BOOST_MULTIPLIER : 1;
    const thrusting = input.forward || input.reverse || input.up || input.down;
    ship.throttle += ((thrusting ? 1 : 0) - ship.throttle) * Math.min(1, dt * 5);
    if (input.left) ship.yaw -= TURN_RATE * dt;
    if (input.right) ship.yaw += TURN_RATE * dt;
    if (input.rollLeft) ship.roll -= 1.2 * dt;
    if (input.rollRight) ship.roll += 1.2 * dt;
    ship.roll *= Math.exp(-1.3 * dt);
    if (ship.fuel > 0) {
      const acceleration = ACCELERATION * thrustPower;
      const forward = Number(input.forward) - Number(input.reverse);
      ship.vx += Math.cos(ship.yaw) * forward * acceleration * dt;
      ship.vy += Math.sin(ship.yaw) * forward * acceleration * dt;
      ship.vz += (Number(input.up) - Number(input.down)) * acceleration * 0.68 * dt;
      if (thrusting) ship.fuel = Math.max(0, ship.fuel - dt * (boost ? 4.7 : 1.45));
    }
    // Gentle drag preserves the long, readable coasting arc of spacecraft motion.
    const drag = Math.exp(-0.026 * dt);
    ship.vx *= drag; ship.vy *= drag; ship.vz *= drag;
    ship.x += ship.vx * dt; ship.y += ship.vy * dt;
    ship.z = Math.max(0, Math.min(400, ship.z + ship.vz * dt));
    if (ship.z === 0 && ship.vz < 0) ship.vz = 0;
    if (ship.z === 400 && ship.vz > 0) ship.vz = 0;
  }
  function speed(ship) { return Math.hypot(ship.vx, ship.vy, ship.vz); }
  function reset(ship) { Object.assign(ship, createShip()); }
  window.FlightPhysics = { createShip: createShip, update: update, speed: speed, reset: reset, maxFuel: MAX_FUEL };
})();