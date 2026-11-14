(function () {
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function createWorld(destination) {
    let seed = destination.seed;
    const random = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const asteroids = [{ x: 1750, y: -1010, z: 0, radius: destination.radius, target: true, color: destination.color }];
    for (let i = 0; i < 32; i++) {
      const angle = random() * TAU;
      const distance = 320 + random() * 2850;
      asteroids.push({ x: 1750 + Math.cos(angle) * distance, y: -1010 + Math.sin(angle) * distance, z: random() * 300 - 80, radius: 12 + random() * 78, color: ['#555d58', '#7a7161', '#696d63', '#8a755e'][Math.floor(random() * 4)], target: false });
    }
    const debris = [];
    for (let i = 0; i < 36; i++) debris.push({ x: (random() - .5) * 6200, y: (random() - .5) * 5200, z: random() * 360, radius: 1 + random() * 3 });
    return { asteroids: asteroids, debris: debris, target: asteroids[0], seed: destination.seed };
  }
  function project(point, ship, camera, width, height) {
    const dx = point.x - ship.x; const dy = point.y - ship.y;
    const angle = -(camera.yaw || 0); const cos = Math.cos(angle); const sin = Math.sin(angle);
    const horizontal = dx * cos - dy * sin;
    const vertical = dx * sin + dy * cos - (point.z - ship.z) * .82;
    const range = Math.hypot(horizontal, vertical);
    const scale = clamp(650 / (760 + range * .2 + Math.abs(point.z - ship.z) * .5), .34, 1.12);
    return { x: width / 2 + horizontal * scale, y: height / 2 + vertical * scale, scale: scale, range: range };
  }
  function drawNebula(ctx, width, height) {
    ctx.save(); ctx.globalAlpha = .1; ctx.fillStyle = '#40655f'; ctx.beginPath();
    ctx.moveTo(width * .05, height * .34);
    ctx.bezierCurveTo(width * .21, height * .11, width * .3, height * .49, width * .48, height * .28);
    ctx.bezierCurveTo(width * .64, height * .06, width * .75, height * .35, width * .98, height * .16);
    ctx.lineTo(width, height * .3);
    ctx.bezierCurveTo(width * .78, height * .48, width * .61, height * .19, width * .44, height * .45);
    ctx.bezierCurveTo(width * .25, height * .63, width * .17, height * .25, width * .05, height * .48);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawStars(ctx, width, height, ship, time, seed) {
    let state = seed + Math.floor(ship.x * .08) + Math.floor(ship.y * .09);
    const random = () => { state = (state * 48271) % 2147483647; return (state - 1) / 2147483646; };
    for (let i = 0; i < 250; i++) {
      const x = (random() * width - ship.x * (.008 + random() * .03) + width) % width;
      const y = (random() * height - ship.y * (.008 + random() * .03) + height) % height;
      const radius = random() > .97 ? 1.4 : .65;
      const alpha = .22 + random() * .62 + (Math.sin(time * .001 + i) + 1) * .06;
      ctx.fillStyle = `rgba(218, 231, 220, ${Math.min(alpha, .9)})`; ctx.fillRect(x, y, radius, radius);
    }
    ctx.fillStyle = 'rgba(230, 155, 104, .68)'; ctx.fillRect(width * .77, height * .22, 1.6, 1.6);
  }
  function drawPlanet(ctx, width, height, time) {
    const x = width * .82; const y = height * .22; const radius = Math.max(22, Math.min(55, width * .052));
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.24 + time * .00001);
    const light = ctx.createRadialGradient(-radius * .42, -radius * .38, radius * .05, 0, 0, radius);
    light.addColorStop(0, '#bd9e79'); light.addColorStop(.54, '#665d4f'); light.addColorStop(1, '#1a2625');
    ctx.fillStyle = light; ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(183, 199, 183, .16)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.65, radius * .33, -.19, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function drawAsteroid(ctx, x, y, radius, color, target, time) {
    if (radius < 2 || x < -radius - 20 || y < -radius - 20 || x > ctx.canvas.width + radius + 20 || y > ctx.canvas.height + radius + 20) return;
    ctx.save(); ctx.translate(x, y);
    if (target) { ctx.strokeStyle = 'rgba(230, 155, 104, .54)'; ctx.setLineDash([3, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, radius * 1.55 + Math.sin(time * .002) * 2, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    const glow = ctx.createRadialGradient(-radius * .38, -radius * .46, radius * .03, 0, 0, radius * 1.05);
    glow.addColorStop(0, target ? '#d2a47a' : '#9d927c'); glow.addColorStop(.38, color); glow.addColorStop(1, '#252c2a');
    ctx.fillStyle = glow; ctx.beginPath();
    const points = 11;
    for (let i = 0; i <= points; i++) { const a = i / points * TAU; const r = radius * (.84 + Math.sin(a * 3 + radius) * .1 + Math.cos(a * 5) * .06); if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * .78); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * .78); }
    ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(26, 29, 27, .33)';
    for (let i = 0; i < Math.min(8, Math.floor(radius / 8)); i++) { const a = i * 2.37 + radius; const crater = radius * (.05 + (i % 3) * .025); ctx.beginPath(); ctx.ellipse(Math.cos(a) * radius * .55, Math.sin(a) * radius * .44, crater, crater * .65, a, 0, TAU); ctx.fill(); }
    if (target) { ctx.strokeStyle = 'rgba(237, 193, 139, .53)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.06, radius * .43, -.17, 0, TAU); ctx.stroke(); ctx.fillStyle = '#e5c28e'; ctx.beginPath(); ctx.arc(-radius * .19, -radius * .19, Math.max(2, radius * .035), 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function drawShip(ctx, width, height, ship, camera, particles) {
    particles.forEach((particle) => { const point = project(particle, ship, camera, width, height); ctx.globalAlpha = clamp(particle.life / .55, 0, 1); ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(point.x, point.y, particle.size * point.scale, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1; ctx.save(); ctx.translate(width / 2, height / 2); ctx.rotate(ship.yaw - (camera.yaw || 0)); ctx.rotate(ship.roll * .25);
    if (ship.throttle > .04) { const flicker = 14 + Math.random() * 15 * ship.throttle; ctx.fillStyle = 'rgba(226, 146, 88, .22)'; ctx.beginPath(); ctx.ellipse(-22, 0, flicker * .95, 10, Math.PI, 0, TAU); ctx.fill(); ctx.fillStyle = '#e69b68'; ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(-20 - flicker, 0); ctx.lineTo(-20, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffe4ae'; ctx.beginPath(); ctx.moveTo(-20, -1.5); ctx.lineTo(-20 - flicker * .55, 0); ctx.lineTo(-20, 1.5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#c9ded3'; ctx.strokeStyle = '#6f988e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(8, -8); ctx.lineTo(-17, -8); ctx.lineTo(-26, -4); ctx.lineTo(-22, 0); ctx.lineTo(-26, 4); ctx.lineTo(-17, 8); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#527b77'; ctx.beginPath(); ctx.moveTo(11, -5); ctx.lineTo(19, 0); ctx.lineTo(11, 5); ctx.lineTo(2, 3); ctx.lineTo(2, -3); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e69b68'; ctx.fillRect(-18, -10, 5, 2); ctx.fillRect(-18, 8, 5, 2);
    // The small underslung capsule is the rover carrier, visible in the flight silhouette.
    ctx.fillStyle = '#d2a36e'; ctx.fillRect(-7, 8, 12, 6); ctx.strokeStyle = '#735c45'; ctx.strokeRect(-7, 8, 12, 6); ctx.fillStyle = '#94a39a'; ctx.fillRect(-8, 14, 3, 2); ctx.fillRect(3, 14, 3, 2); ctx.restore();
  }
  function drawRover(ctx, width, height, rover, camera) {
    const point = project({ x: rover.x, y: rover.y, z: 0 }, { x: rover.x, y: rover.y, z: 0 }, camera, width, height);
    ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(rover.yaw); ctx.fillStyle = '#e0b17a'; ctx.fillRect(-16, -8, 32, 16); ctx.fillStyle = '#31413d'; ctx.fillRect(-12, -11, 7, 3); ctx.fillRect(5, -11, 7, 3); ctx.fillRect(-12, 8, 7, 3); ctx.fillRect(5, 8, 7, 3); ctx.fillStyle = '#bfe5d6'; ctx.fillRect(-2, -5, 10, 5); ctx.restore();
  }
  function draw(world, ctx, ship, camera, time, particles, rover, surveySites) {
    const width = ctx.canvas.clientWidth || ctx.canvas.width; const height = ctx.canvas.clientHeight || ctx.canvas.height;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#071011'; ctx.fillRect(0, 0, width, height);
    drawNebula(ctx, width, height); drawStars(ctx, width, height, ship, time, world.seed); drawPlanet(ctx, width, height, time);
    world.debris.forEach((item, index) => { const point = project(item, ship, camera, width, height); if (point.x > 0 && point.x < width && point.y > 0 && point.y < height) { ctx.fillStyle = index % 8 === 0 ? 'rgba(230, 155, 104, .7)' : 'rgba(180, 193, 184, .55)'; ctx.fillRect(point.x, point.y, Math.max(1, item.radius * point.scale), Math.max(1, item.radius * point.scale)); } });
    world.asteroids.forEach((asteroid) => { const point = project(asteroid, ship, camera, width, height); drawAsteroid(ctx, point.x, point.y, asteroid.radius * point.scale, asteroid.color, asteroid.target, time); });
    surveySites.forEach((site) => { const point = project({ x: site.x, y: site.y, z: 0 }, ship, camera, width, height); ctx.strokeStyle = site.done ? 'rgba(191, 216, 144, .5)' : 'rgba(146, 228, 211, .85)'; ctx.beginPath(); ctx.arc(point.x, point.y, 7, 0, TAU); ctx.stroke(); ctx.fillStyle = site.done ? '#bfd890' : '#92e4d3'; ctx.fillRect(point.x - 1, point.y - 1, 2, 2); });
    if (rover) drawRover(ctx, width, height, rover, camera); else drawShip(ctx, width, height, ship, camera, particles);
  }
  window.FlightScene = { createWorld: createWorld, project: project, draw: draw };
})();