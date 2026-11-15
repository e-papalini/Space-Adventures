import { bennu, interactionRadius } from './config.js';
import { wrap, offsetTo, nearestCopy, mapDistance, visibleTiles } from './topology.js';

const tau = Math.PI * 2;
function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, tau); ctx.fill();
}
function rock(ctx, x, y, r, seed, solid = false) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#080f1680'; ctx.beginPath(); ctx.ellipse(r * .2, r * .45, r * 1.1, r * .7, 0, 0, tau); ctx.fill();
  ctx.beginPath();
  for (let j = 0; j < 8; j++) {
    const angle = j * tau / 8, radius = r * (.87 + .1 * Math.sin(seed + j * 9));
    const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
    if (!j) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const gradient = ctx.createLinearGradient(-r, -r, r, r);
  gradient.addColorStop(0, solid ? '#8c8a82' : '#64635d'); gradient.addColorStop(.45, '#494a47'); gradient.addColorStop(1, '#262e31');
  ctx.fillStyle = gradient; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#b7ae8d35'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * .6, -r * .4); ctx.lineTo(r * .1, 0); ctx.lineTo(r * .4, r * .6);
  ctx.strokeStyle = '#11191b90'; ctx.stroke(); ctx.restore();
}

function terrain() {
  const layer = document.createElement('canvas'); layer.width = bennu.width; layer.height = bennu.height;
  const ctx = layer.getContext('2d');
  ctx.fillStyle = '#393b38'; ctx.fillRect(0, 0, layer.width, layer.height);
  let seed = 9127;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 240; i++) {
    const x = random() * layer.width, y = random() * layer.height, r = 20 + random() * 85;
    // Paint the other side of any edge-crossing patch into the cached tile too.
    for (const dx of [-layer.width, 0, layer.width]) for (const dy of [-layer.height, 0, layer.height]) {
      const gx = x + dx, gy = y + dy;
      if (gx + r < 0 || gy + r < 0 || gx - r > layer.width || gy - r > layer.height) continue;
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      glow.addColorStop(0, i % 2 ? '#a3956e10' : '#101b2230'); glow.addColorStop(1, '#33333300');
      ctx.fillStyle = glow; ctx.fillRect(gx - r, gy - r, 2 * r, 2 * r);
    }
  }
  for (let i = 0; i < 11000; i++) circle(ctx, random() * layer.width, random() * layer.height, .3 + random() * 1.4, i % 2 ? '#c2b79916' : '#10191c30');
  // Pebbles and shallow crater rims are decorative, not collision objects.
  for (let i = 0; i < 250; i++) rock(ctx, 10 + random() * (layer.width - 20), 10 + random() * (layer.height - 20), 2 + random() * 6, i);
  for (const site of bennu.sites) {
    if (site.feature === 'crater') {
      const g = ctx.createRadialGradient(site.x, site.y, 5, site.x, site.y, 38);
      g.addColorStop(0, '#222c30'); g.addColorStop(.8, '#303631'); g.addColorStop(.9, '#727065'); g.addColorStop(1, '#3a3d37');
      circle(ctx, site.x, site.y, 38, g);
    } else if (site.feature === 'boulder' || site.feature === 'ridge') {
      for (let j = 0; j < 4; j++) rock(ctx, site.x + j * 9 - 14, site.y + Math.sin(j * 3) * 10, 8 + j * 2, j);
    } else {
      ctx.fillStyle = site.feature === 'outcrop' ? '#232b29' : '#79726460';
      ctx.beginPath(); ctx.ellipse(site.x, site.y, 35, 24, -.4, 0, tau); ctx.fill();
      for (let j = 0; j < 14; j++) rock(ctx, site.x + Math.sin(j * 13) * 27, site.y + Math.cos(j * 7) * 18, 2, j);
    }
  }
  for (const item of bennu.obstacles) rock(ctx, item.x, item.y, item.r, item.x, true);
  return layer;
}

export function createWorldRenderer(canvas) {
  const ctx = canvas.getContext('2d'), surface = terrain();
  const camera = { x: bennu.start.x, y: bennu.start.y };
  const tracks = []; let lastTrack = { ...bennu.start };
  let width = 900, height = 640, zoom = 1.6;
  function resize() {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    zoom = width < 600 ? 1.25 : 1.65;
  }
  resize();
  function draw(trip, visual, dt, now) {
    const blend = 1 - Math.exp(-5 * dt);
    const delta = offsetTo(camera, trip.position);
    camera.x = wrap(camera.x + delta.x * blend, bennu.width);
    camera.y = wrap(camera.y + delta.y * blend, bennu.height);
    const dpr = canvas.width / width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a131e'; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.translate(width / 2, height / 2); ctx.scale(zoom, zoom); ctx.translate(-camera.x, -camera.y);
    if (mapDistance(trip.position, lastTrack) > 9 && !visual.returning) {
      tracks.push({ ...trip.position, angle: visual.angle }); lastTrack = { ...trip.position };
      if (tracks.length > 400) tracks.shift();
    }
    for (const tile of visibleTiles(camera, width, height, zoom)) {
    ctx.save(); ctx.translate(tile.x, tile.y); ctx.drawImage(surface, 0, 0);
    ctx.fillStyle = '#111a1e55';
    for (const track of tracks) { ctx.save(); ctx.translate(track.x, track.y); ctx.rotate(track.angle); ctx.fillRect(-2, -12, 4, 3); ctx.fillRect(-2, 9, 4, 3); ctx.restore(); }
    for (const site of bennu.sites) {
      const near = visual.siteId === site.id, done = trip.actions.some(a => a.siteId === site.id);
      ctx.strokeStyle = done ? '#8bdbb4' : near ? '#fff1ab' : '#e8bb6b'; ctx.lineWidth = near ? 2 : 1;
      ctx.beginPath(); ctx.arc(site.x, site.y, near ? 43 + Math.sin(now / 250) * 2 : 41, 0, tau); ctx.stroke();
      if (near) { ctx.fillStyle = '#e8bb6b0c'; ctx.beginPath(); ctx.arc(site.x, site.y, interactionRadius, 0, tau); ctx.fill(); }
      ctx.font = '600 10px system-ui'; ctx.textAlign = 'center';
      ctx.fillStyle = '#101b23d9'; ctx.fillRect(site.x - 71, site.y - 64, 142, 20);
      ctx.fillStyle = done ? '#a3e9c6' : '#ffe5ad'; ctx.fillText(`${done ? '✓' : '◇'} ${site.name}`, site.x, site.y - 50);
    }
    const base = bennu.start;
    ctx.strokeStyle = '#d7e4e8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(base.x, base.y + 9); ctx.lineTo(base.x, base.y - 36); ctx.stroke();
    ctx.fillStyle = '#ff526a'; ctx.beginPath(); ctx.moveTo(base.x, base.y - 36); ctx.lineTo(base.x + 28, base.y - 30 + Math.sin(now / 250) * 2); ctx.lineTo(base.x, base.y - 20); ctx.fill();
    ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#ffb4bf'; ctx.textAlign = 'center'; ctx.fillText('BASE / RED FLAG', base.x, base.y + 29);
    ctx.restore();
    }
    const p = nearestCopy(trip.position, camera);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(visual.angle);
    ctx.shadowColor = '#0009'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#12202a';
    for (const x of [-9, 9]) for (const y of [-13, 13]) { ctx.fillRect(x - 5, y - 3, 10, 6); ctx.strokeStyle = '#8097a1'; ctx.lineWidth = 1; ctx.strokeRect(x - 5, y - 3, 10, 6); }
    ctx.fillStyle = '#dce3da'; ctx.fillRect(-15, -9, 30, 18); ctx.shadowBlur = 0;
    ctx.fillStyle = '#35b3c5'; ctx.fillRect(-8, -7, 14, 14);
    ctx.strokeStyle = '#99e5e5'; ctx.lineWidth = .6;
    for (let i = -4; i <= 3; i += 4) { ctx.beginPath(); ctx.moveTo(i, -7); ctx.lineTo(i, 7); ctx.stroke(); }
    ctx.fillStyle = '#f9da8b'; ctx.fillRect(11, -7, 4, 4); ctx.fillRect(11, 3, 4, 4);
    ctx.fillStyle = '#ed6573'; ctx.fillRect(-16, -5, 2, 10);
    ctx.strokeStyle = '#becbd0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(13, 0); ctx.stroke();
    circle(ctx, 6, 0, 3, '#142731'); ctx.restore();
    if (visual.operation) {
      const { kind, progress, siteId } = visual.operation, site = nearestCopy(bennu.sites.find(s => s.id === siteId), p);
      if (kind === 'lidar') {
        for (let i = 0; i < 3; i++) { ctx.strokeStyle = '#6cf8da88'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, ((progress * 90 + i * 28) % 90) + 5, 0, tau); ctx.stroke(); }
      } else if (kind === 'infrared') {
        ctx.strokeStyle = '#ba99ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(site.x + Math.sin(now / 70) * 18, site.y); ctx.stroke();
        circle(ctx, site.x, site.y, 18 + Math.sin(now / 100) * 4, '#ad8aff35');
      } else if (kind === 'sample') {
        ctx.strokeStyle = '#ffcb79'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo((p.x + site.x) / 2, (p.y + site.y) / 2 - Math.sin(progress * Math.PI) * 16); ctx.lineTo(site.x, site.y); ctx.stroke();
        for (let i = 0; i < 8; i++) circle(ctx, site.x + Math.sin(i * 13) * progress * 20, site.y - progress * 25 + Math.cos(i) * 6, 1.5, '#d5bc88');
      } else if (kind === 'camera') { ctx.strokeStyle = '#e5f6ff'; ctx.lineWidth = 1; ctx.strokeRect(site.x - 29, site.y - 23, 58, 46); }
    }
    ctx.restore();
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height / 4, width / 2, height / 2, width * .8);
    vignette.addColorStop(0, '#070e1400'); vignette.addColorStop(1, '#050e16a0'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
    // Small world overview keeps offscreen destinations and the base discoverable.
    const mw = Math.min(155, width * .28), mh = mw * bennu.height / bennu.width, mx = width - mw - 16, my = height - mh - 166;
    ctx.fillStyle = '#091823d9'; ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
    ctx.strokeStyle = '#92cbd34d'; ctx.strokeRect(mx, my, mw, mh);
    const point = (x, y, color, r) => circle(ctx, mx + x / bennu.width * mw, my + y / bennu.height * mh, r, color);
    for (const s of bennu.sites) point(s.x, s.y, '#f4c777', 2);
    point(bennu.start.x, bennu.start.y, '#ff526a', 3); point(trip.position.x, trip.position.y, '#66eff1', 3);
    if (visual.flash > 0) { ctx.fillStyle = `rgba(225,245,255,${visual.flash * .65})`; ctx.fillRect(0, 0, width, height); }
    if (visual.returnFade > 0) { ctx.fillStyle = `rgba(8,22,33,${visual.returnFade})`; ctx.fillRect(0, 0, width, height); }
  }
  function photograph(siteId, target) {
    const site = bennu.sites.find(s => s.id === siteId), photo = target.getContext('2d');
    photo.drawImage(surface, site.x - 55, site.y - 38, 110, 76, 0, 0, target.width, target.height);
  }
  function siteAtScreen(x, y) {
    const point = { x: camera.x + (x - width / 2) / zoom, y: camera.y + (y - height / 2) / zoom };
    return bennu.sites.filter(site => mapDistance(site, point) <= 46)
      .sort((a, b) => mapDistance(a, point) - mapDistance(b, point))[0];
  }
  return { draw, resize, photograph, siteAtScreen };
}
