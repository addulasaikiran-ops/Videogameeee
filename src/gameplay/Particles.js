import * as THREE from 'three';

// Lightweight ambient particle field (stars, petals, fireflies, snow…)
// One THREE.Points per level — cheap on mobile.
export class AmbientParticles {
  constructor(scene, { count = 140, area = 40, color = '#ffffff', size = 0.12, yBase = 0, yRange = 8, drift = 0.4, opacity = 0.8 }) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area;
      pos[i * 3 + 1] = yBase + Math.random() * yRange;
      pos[i * 3 + 2] = -1 - Math.random() * 4;
      this.speeds[i] = 0.3 + Math.random() * 0.9;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false,
    }));
    this.area = area; this.yBase = yBase; this.yRange = yRange; this.drift = drift;
    scene.add(this.points);
  }

  update(dt, t, centerX = 0) {
    const pos = this.points.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - this.speeds[i] * dt * 0.5;
      let x = pos.getX(i) + Math.sin(t * 0.8 + i) * this.drift * dt;
      if (y < this.yBase) { y = this.yBase + this.yRange; x = centerX + (Math.random() - 0.5) * this.area; }
      pos.setXYZ(i, x, y, pos.getZ(i));
    }
    pos.needsUpdate = true;
    // keep the field roughly around the camera
    this.points.position.x += (centerX - this.points.position.x) * Math.min(1, dt * 1.5);
  }

  dispose(scene) { scene.remove(this.points); this.points.geometry.dispose(); this.points.material.dispose(); }
}

// One-shot burst of small sprites for pickups/hits.
export class BurstEmitter {
  constructor(scene) {
    this.scene = scene;
    this.bursts = [];
  }

  burst(x, y, { color = '#ff8fb8', count = 10, speed = 3.5, size = 0.14, life = 0.6 } = {}) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = 0.3;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      vels.push([Math.cos(a) * s, Math.sin(a) * s + 1.5]);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 1, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    this.bursts.push({ pts, vels, life, age: 0 });
  }

  update(dt) {
    for (const b of this.bursts) {
      b.age += dt;
      const pos = b.pts.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(i, pos.getX(i) + b.vels[i][0] * dt, pos.getY(i) + b.vels[i][1] * dt, pos.getZ(i));
        b.vels[i][1] -= 6 * dt;
      }
      pos.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.age / b.life);
    }
    const dead = this.bursts.filter((b) => b.age >= b.life);
    for (const b of dead) { this.scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); }
    this.bursts = this.bursts.filter((b) => b.age < b.life);
  }

  dispose() { for (const b of this.bursts) { this.scene.remove(b.pts); } this.bursts = []; }
}
