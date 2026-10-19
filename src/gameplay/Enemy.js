import * as THREE from 'three';
import { aabbOverlap } from './CollisionSystem.js';

// Reusable enemy behaviours. Types:
//  patroller — walks back and forth between minX..maxX, hurts on contact, dies to 1 hit
//  wisp      — floats, periodically launches a slow orb at the player
//  shadow    — tougher/faster patroller (hp 2)
export class Enemy {
  constructor(scene, { id, type = 'patroller', x = 0, y = 0, minX = null, maxX = null, hp = null, projectilePool = null }) {
    this.id = id;
    this.type = type;
    this.scene = scene;
    this.projectilePool = projectilePool;
    this.hp = hp ?? (type === 'shadow' ? 2 : 1);
    this.alive = true;
    this.minX = minX ?? x - 3;
    this.maxX = maxX ?? x + 3;
    this.dir = 1;
    this.speed = type === 'shadow' ? 3.2 : type === 'wisp' ? 0 : 1.8;
    this.baseY = y;
    this.x = x; this.y = y;
    this.shootTimer = 2 + Math.random() * 2;
    this.flash = 0;
    this._build();
  }

  _build() {
    const g = new THREE.Group();
    if (this.type === 'wisp') {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshStandardMaterial({ color: '#b9a8ff', emissive: '#8d78bd', emissiveIntensity: 0.7, transparent: true, opacity: 0.85 }));
      body.position.y = 0.3;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#2d2440' }));
      eye.position.set(0, 0.32, 0.26);
      g.add(body, eye);
    } else {
      const dark = this.type === 'shadow';
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.4, 6, 12), new THREE.MeshStandardMaterial({ color: dark ? '#4a3d5c' : '#7d6b8f', roughness: 0.7 }));
      body.position.y = 0.45;
      body.castShadow = true;
      const spikeMat = new THREE.MeshStandardMaterial({ color: dark ? '#332845' : '#5e4f70' });
      for (let i = -1; i <= 1; i++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), spikeMat);
        s.position.set(i * 0.16, 0.85, 0);
        g.add(s);
      }
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: dark ? '#ff8fb8' : '#ffd7e8' }));
      const eyeR = eyeL.clone();
      eyeL.position.set(0.1, 0.55, 0.26); eyeR.position.set(-0.1, 0.55, 0.26);
      g.add(body, eyeL, eyeR);
    }
    g.position.set(this.x, this.y, 0);
    this.mesh = g;
    this.scene.add(g);
  }

  get aabb() {
    const w = 0.62, h = this.type === 'wisp' ? 0.7 : 0.85;
    return { minX: this.x - w / 2, maxX: this.x + w / 2, bottomY: this.y, topY: this.y + h };
  }

  hit(dmg = 1) {
    if (!this.alive) return false;
    this.hp -= dmg;
    this.flash = 0.2;
    if (this.hp <= 0) { this.die(); return 'dead'; }
    return 'hit';
  }

  die() {
    this.alive = false;
    this.mesh.visible = false;
  }

  update(dt, t, player) {
    if (!this.alive) return;
    this.flash = Math.max(0, this.flash - dt);
    if (this.flash > 0) this.mesh.traverse((o) => { if (o.material?.emissive) o.material.emissiveIntensity = 2; });
    if (this.type === 'patroller' || this.type === 'shadow') {
      this.x += this.dir * this.speed * dt;
      if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
      if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
      this.mesh.position.x = this.x;
      this.mesh.rotation.y = this.dir > 0 ? 0.3 : Math.PI - 0.3;
    } else if (this.type === 'wisp') {
      this.y = this.baseY + Math.sin(t * 1.8 + this.x) * 0.35;
      this.mesh.position.y = this.y;
      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && player && Math.abs(player.position.x - this.x) < 9) {
        this.shootTimer = 3.2;
        this.projectilePool?.fire(this.x, this.y + 0.3, player);
      }
    }
  }

  dispose() { this.scene.remove(this.mesh); }
}

// Shared slow-moving enemy orbs, pooled per level.
export class ProjectilePool {
  constructor(scene, size = 10) {
    this.scene = scene;
    this.pool = [];
    const geo = new THREE.SphereGeometry(0.16, 10, 8);
    const mat = new THREE.MeshStandardMaterial({ color: '#c9b6ff', emissive: '#8d78bd', emissiveIntensity: 1.1 });
    for (let i = 0; i < size; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      scene.add(m);
      this.pool.push({ mesh: m, active: false, vel: new THREE.Vector2(), ttl: 0 });
    }
  }

  fire(x, y, player) {
    const p = this.pool.find((o) => !o.active);
    if (!p) return;
    const dx = player.position.x - x;
    const dy = player.position.y + 0.7 - y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 4.2;
    p.vel.set((dx / len) * speed, (dy / len) * speed);
    p.mesh.position.set(x, y, 0);
    p.mesh.visible = true;
    p.active = true;
    p.ttl = 5;
  }

  // returns true if any orb overlapped the player
  update(dt, player, onHit) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.ttl -= dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      if (p.ttl <= 0) { p.active = false; p.mesh.visible = false; continue; }
      const a = { minX: p.mesh.position.x - 0.2, maxX: p.mesh.position.x + 0.2, bottomY: p.mesh.position.y - 0.2, topY: p.mesh.position.y + 0.2 };
      if (player && aabbOverlap(player.position.x - player.width / 2, player.position.y, player.width, player.height, a)) {
        p.active = false; p.mesh.visible = false;
        onHit?.(p.mesh.position.x);
      }
    }
  }

  dispose() { for (const p of this.pool) this.scene.remove(p.mesh); }
}
