import * as THREE from 'three';
import { AmbientParticles } from '../gameplay/Particles.js';

// ── shared material cache ────────────────────────────────────────────────────
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));
  return matCache.get(key);
}

// Vertical-gradient sky via a big backdrop plane with vertex colors.
// fog:false — the scene fog is tuned for gameplay depth (~30-60u) and would
// otherwise wash the backdrop out entirely.
function skyPlane(top, bottom, w = 260, h = 80) {
  const geo = new THREE.PlaneGeometry(w, h, 1, 12);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cTop = new THREE.Color(top), cBot = new THREE.Color(bottom);
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + h / 2) / h;
    const c = cBot.clone().lerp(cTop, t);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, depthWrite: false, fog: false }));
  m.position.set(0, h / 2 - 24, -30);
  m.renderOrder = -10;
  return m;
}

function tree(x, y, { trunk = '#7a5c58', crown = '#f7b8d0', s = 1 } = {}) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 1.6 * s, 7), mat(trunk));
  t.position.y = 0.8 * s;
  g.add(t);
  const blob = new THREE.SphereGeometry(0.9 * s, 12, 9);
  const c1 = new THREE.Mesh(blob, mat(crown, { roughness: 0.9 })); c1.position.set(0, 1.9 * s, 0);
  const c2 = new THREE.Mesh(blob, mat('#ffd2e2', { roughness: 0.9 })); c2.position.set(-0.55 * s, 1.55 * s, 0.1); c2.scale.setScalar(0.7);
  const c3 = new THREE.Mesh(blob, mat('#efa8c8', { roughness: 0.9 })); c3.position.set(0.5 * s, 1.6 * s, -0.1); c3.scale.setScalar(0.72);
  g.add(c1, c2, c3);
  g.position.set(x, y, -2.2);
  return g;
}

function flowers(group, area, y, colors = ['#ff9ec4', '#fff0d6', '#c9b6ff']) {
  const geo = new THREE.SphereGeometry(0.09, 6, 5);
  for (let i = 0; i < 26; i++) {
    const f = new THREE.Mesh(geo, mat(colors[i % colors.length], { emissive: colors[i % colors.length], emissiveIntensity: 0.25 }));
    f.position.set((Math.random() - 0.5) * area, y + 0.08, -0.8 + Math.random() * 0.8);
    f.scale.y = 0.7;
    group.add(f);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.25, 4), mat('#6d8f6a'));
    stem.position.set(f.position.x, y + 0.05, f.position.z);
    group.add(stem);
  }
}

function stars(group, n = 90, w = 200) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * w;
    pos[i * 3 + 1] = 6 + Math.random() * 30;
    pos[i * 3 + 2] = -28;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#fff7d6', size: 0.14, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
  group.add(pts);
}

function moon(group, x, y, r = 2.4, color = '#fff3cf') {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), new THREE.MeshBasicMaterial({ color, fog: false }));
  m.position.set(x, y, -26);
  group.add(m);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 24, 18), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, fog: false }));
  halo.position.copy(m.position);
  group.add(halo);
}

function bridge(x, y, w = 5) {
  const g = new THREE.Group();
  const plank = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, 1.3), mat('#a47c5c'));
  plank.position.y = 0;
  g.add(plank);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.08), mat('#8a6a4f'));
    rail.position.set(0, 0.5, s * 0.6);
    g.add(rail);
    for (let i = 0; i < 5; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), mat('#8a6a4f'));
      post.position.set(-w / 2 + (i + 0.5) * (w / 5), 0.28, s * 0.6);
      g.add(post);
    }
  }
  g.position.set(x, y, -0.4);
  return g;
}

function thornPillar(x, y, h = 3) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.ConeGeometry(0.5, h, 7), mat('#3d3153', { roughness: 0.95 }));
  p.position.y = h / 2;
  g.add(p);
  g.position.set(x, y, -1.8);
  return g;
}

function gate(x, y) {
  // heart-gate prop used at boss/ending arenas
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.18, 12, 44), mat('#c9a0b8', { emissive: '#ff8fb8', emissiveIntensity: 0.35 }));
  ring.position.y = 2.0;
  g.add(ring);
  for (const s of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.6, 8), mat('#8f6d85'));
    pillar.position.set(s * 1.7, 1.3, 0);
    g.add(pillar);
  }
  g.position.set(x, y, -1.6);
  return g;
}

// ── atmosphere helpers (shared scenery, decal-only) ─────────────────────────
function hills(group, area, { color = '#1d1638', y = 0, z = -24, h = 7, step = 26 } = {}) {
  // distant rolling-hill silhouette — one lumpy mesh strip
  const geo = new THREE.PlaneGeometry(step, h, 8, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i) / step + 0.5;           // 0..1 across
    if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) + Math.sin(px * Math.PI * 2 + z) * h * 0.35);
  }
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, fog: false }));
  for (let i = 0; i < Math.ceil(area / step); i++) {
    const inst = m.clone();
    inst.position.set(-area / 2 + step / 2 + i * step, y + h / 2, z);
    group.add(inst);
  }
}

function treeline(group, area, { color = '#241a45', z = -20, step = 8 } = {}) {
  // far treeline of soft dark cones — reads as a distant forest edge
  for (let i = 0; i < Math.ceil(area / step); i++) {
    const h = 3.5 + Math.sin(i * 2.7) * 1.5 + (i % 3) * 0.8;
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.4 + h * 0.18, h, 7), new THREE.MeshBasicMaterial({ color, fog: false }));
    c.position.set(-area / 2 + i * step + Math.sin(i * 1.3) * 1.2, h / 2 - 0.4, z);
    group.add(c);
  }
}

function mistBand(group, area, { color = '#d9b6e8', y = 0.6, z = -8, h = 1.1, op = 0.14 } = {}) {
  // low drifting fog sheet hugging the ground
  const m = new THREE.Mesh(new THREE.PlaneGeometry(area * 1.3, h),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, fog: false }));
  m.position.set(0, y, z);
  group.add(m);
  return m;
}

function lightShafts(group, x0, count, { color = '#ffe9c9', z = -18 } = {}) {
  // soft diagonal moonlight shafts
  for (let i = 0; i < count; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6 + i * 0.9, 30),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06 - i * 0.012, depthWrite: false, fog: false }));
    s.position.set(x0 + i * 3.4, 8, z - i * 0.5);
    s.rotation.z = 0.38;
    group.add(s);
  }
}

function shootingStar(group, x, y, z = -26) {
  // a faint diagonal streak in the sky
  const s = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.06),
    new THREE.MeshBasicMaterial({ color: '#fff3cf', transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
  s.position.set(x, y, z);
  s.rotation.z = -0.5;
  group.add(s);
}

function fireflies(group, area, { color = '#ffe9a8', count = 26, z = -2.5 } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * area;
    pos[i * 3 + 1] = 0.4 + Math.random() * 2.8;
    pos[i * 3 + 2] = z + (Math.random() - 0.5) * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  group.add(pts);
}

// ── theme builders ───────────────────────────────────────────────────────────
// Each returns { objects:[...disposeable meshes/groups], particles }
export function buildDecor(scene, theme, length) {
  const group = new THREE.Group();
  let particles = null;
  const area = Math.max(50, length + 30);

  if (theme === 'dawnGarden') {
    // luminous first-light: indigo zenith over a rose horizon, moonlit hills,
    // far treeline, low mist, light shafts, stars + fireflies
    group.add(skyPlane('#241c4a', '#b5678a'));
    stars(group, 140);
    shootingStar(group, length * 0.18, 22);
    shootingStar(group, -length * 0.32, 27);
    moon(group, -length / 2 + 8, 14, 2.6, '#ffdf9e');
    lightShafts(group, -length / 2 + 10, 3);
    hills(group, area, { color: '#2a2050', z: -26, h: 8 });
    hills(group, area, { color: '#32285e', z: -23, h: 6, step: 19 });
    treeline(group, area, { z: -19 });
    mistBand(group, area, { y: 0.9, z: -10, op: 0.16 });
    mistBand(group, area, { color: '#f4c9dd', y: 0.4, z: -5, h: 0.8, op: 0.10 });
    for (let i = 0; i < Math.ceil(area / 14); i++) group.add(tree(-area / 2 + 6 + i * 14 + Math.sin(i) * 3, 0, { s: 0.9 + (i % 3) * 0.25, trunk: '#5b4258', crown: '#e890b4' }));
    flowers(group, area, 0, ['#ff9ec4', '#ffe9c9', '#8fe3d6']);
    fireflies(group, area, { z: -2.5 });
    group.add(bridge(length * 0.45, 0.7, 5));
    particles = new AmbientParticles(scene, { count: 110, area, color: '#ffc7dd', size: 0.13, yBase: 0, yRange: 9, drift: 0.7, opacity: 0.8 });
  } else if (theme === 'memoryGarden') {
    group.add(skyPlane('#3a2d5c', '#8f6d9e'));
    moon(group, -length / 2 + 10, 17, 2.8, '#e8dcff');
    stars(group, 120);
    for (let i = 0; i < Math.ceil(area / 16); i++) group.add(tree(-area / 2 + 7 + i * 16 + Math.cos(i) * 3, 0, { crown: '#9d7bd8', s: 1 + (i % 2) * 0.3 }));
    flowers(group, area, 0, ['#c9b6ff', '#8fd8ff', '#e8dcff']);
    particles = new AmbientParticles(scene, { count: 130, area, color: '#bfe9ff', size: 0.11, yBase: 0.2, yRange: 8, drift: 0.5, opacity: 0.85 });
  } else if (theme === 'memoryVoid') {
    group.add(skyPlane('#2b2440', '#5f4a78'));
    stars(group, 60);
    // floating memory frames
    for (let i = 0; i < 6; i++) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshStandardMaterial({ color: '#fff6e9', emissive: '#f6d9bd', emissiveIntensity: 0.5, side: THREE.DoubleSide }));
      f.position.set(-length / 2 + 6 + i * (length / 6), 2.5 + Math.sin(i * 2) * 0.8, -3 - (i % 3));
      group.add(f);
    }
    particles = new AmbientParticles(scene, { count: 80, area, color: '#fff0d6', size: 0.1, yBase: 0, yRange: 7, drift: 0.3, opacity: 0.6 });
  } else if (theme === 'nightSea') {
    group.add(skyPlane('#141c38', '#3d4d7d'));
    moon(group, -length / 2 + 10, 16, 3.0, '#fff3cf');
    stars(group, 160);
    // ocean — animated in update
    const water = new THREE.Mesh(new THREE.PlaneGeometry(area * 1.4, 8, 40, 1), new THREE.MeshStandardMaterial({ color: '#3d6d8f', roughness: 0.35, metalness: 0.3, transparent: true, opacity: 0.9 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -1.55, -6);
    group.add(water);
    group.userData.water = water;
    // distant shells/stones
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 8, 6), mat('#e8d9c0'));
      s.position.set((Math.random() - 0.5) * area, 0.1, -0.9);
      s.scale.y = 0.5;
      group.add(s);
    }
    particles = new AmbientParticles(scene, { count: 90, area, color: '#cfe9ff', size: 0.1, yBase: 0, yRange: 7, drift: 0.9, opacity: 0.6 });
  } else if (theme === 'shadowRealm') {
    group.add(skyPlane('#120e1f', '#3a2d5c'));
    stars(group, 40);
    for (let i = 0; i < Math.ceil(area / 12); i++) group.add(thornPillar(-area / 2 + 5 + i * 12 + Math.sin(i * 3) * 2, 0, 2 + (i % 3)));
    // dim floating lanterns
    for (let i = 0; i < 8; i++) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat('#8fd8ff', { emissive: '#5fbfff', emissiveIntensity: 1.2 }));
      l.position.set((Math.random() - 0.5) * area, 2 + Math.random() * 4, -2);
      group.add(l);
    }
    particles = new AmbientParticles(scene, { count: 70, area, color: '#9d7bd8', size: 0.1, yBase: 0, yRange: 8, drift: 0.35, opacity: 0.5 });
  } else if (theme === 'bossArena') {
    group.add(skyPlane('#241a3d', '#6d3d6e'));
    moon(group, 0, 20, 3.4, '#ffd7e8');
    stars(group, 100);
    group.add(gate(0, 0));
    for (let i = 0; i < 10; i++) group.add(thornPillar(-area / 2 + 4 + i * (area / 10), 0, 2.5 + (i % 2)));
    particles = new AmbientParticles(scene, { count: 100, area, color: '#ff9ec4', size: 0.12, yBase: 0, yRange: 9, drift: 0.5, opacity: 0.6 });
  } else if (theme === 'endingGlade') {
    group.add(skyPlane('#ffb98a', '#ffeef0'));
    moon(group, -8, 15, 2.6, '#ffdf9e');
    for (let i = 0; i < Math.ceil(area / 13); i++) group.add(tree(-area / 2 + 5 + i * 13 + Math.cos(i) * 2.5, 0, { crown: '#ffb8c9', s: 1 + (i % 3) * 0.2 }));
    flowers(group, area, 0);
    // the big heart tree
    const big = tree(0, 0, { s: 2.4, crown: '#ff9ec4' });
    big.position.z = -3;
    group.add(big);
    particles = new AmbientParticles(scene, { count: 150, area, color: '#ffc7dd', size: 0.14, yBase: 0, yRange: 10, drift: 0.6, opacity: 0.8 });
  }

  scene.add(group);
  return { group, particles };
}
