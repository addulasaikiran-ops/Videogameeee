import * as THREE from 'three';
import { aabbOverlap } from './CollisionSystem.js';

// "The Doubtwarden" — guardian of the final gate. Three phases:
//  P1 (>2/3 hp): side-to-side charge with a flash telegraph, rest between.
//  P2 (>1/3 hp): adds orb volleys and summons up to 2 wisps.
//  P3: faster charge, shorter rests, denser volleys.
// Vulnerable to the heart-pulse attack at all times; contact hurts the player.
export class Boss {
  constructor(scene, { x = 0, y = 0, minX, maxX, projectilePool, onSpawnWisp }) {
    this.scene = scene;
    this.minX = minX; this.maxX = maxX;
    this.x = x; this.y = y; this.baseY = y;
    this.hp = 12; this.maxHp = 12;
    this.alive = true;
    this.projectilePool = projectilePool;
    this.onSpawnWisp = onSpawnWisp;
    this.state = 'idle';      // idle | telegraph | charging | rest
    this.stateT = 1.2;
    this.dir = -1;
    this.speed = 7;
    this.volleyT = 3;
    this.summonT = 6;
    this.summoned = 0;
    this.flash = 0;
    this._build();
  }

  get phase() { return this.hp > this.maxHp * 2 / 3 ? 1 : this.hp > this.maxHp / 3 ? 2 : 3; }

  _build() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.7, 1.0, 8, 16),
      new THREE.MeshStandardMaterial({ color: '#453256', roughness: 0.6 })
    );
    body.position.y = 1.1; body.castShadow = true;
    this.body = body;
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.7, 6),
      new THREE.MeshStandardMaterial({ color: '#332845', emissive: '#8d78bd', emissiveIntensity: 0.5 })
    );
    crown.position.y = 2.15;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff8fb8' }));
    const eyeR = eyeL.clone();
    eyeL.position.set(0.2, 1.35, 0.6); eyeR.position.set(-0.2, 1.35, 0.6);
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24),
      new THREE.MeshStandardMaterial({ color: '#ff6d9d', emissive: '#ff5d8f', emissiveIntensity: 1.4 })
    );
    core.position.set(0, 1.0, 0.62);
    this.core = core;
    g.add(body, crown, eyeL, eyeR, core);
    g.position.set(this.x, this.y, 0);
    this.mesh = g;
    this.scene.add(g);
  }

  get aabb() {
    return { minX: this.x - 0.8, maxX: this.x + 0.8, bottomY: this.y, topY: this.y + 2.3 };
  }

  hit(dmg = 1) {
    if (!this.alive) return 'miss';
    this.hp -= dmg;
    this.flash = 0.25;
    if (this.hp <= 0) { this.alive = false; this.die(); return 'dead'; }
    return 'hit';
  }

  die() {
    // a soft burst of hearts where the guardian stood
    this.mesh.visible = false;
  }

  update(dt, t, player) {
    if (!this.alive) return;
    this.flash = Math.max(0, this.flash - dt);
    this.body.material.emissive = new THREE.Color(this.flash > 0 ? '#ff8fb8' : '#000000');
    this.stateT -= dt;
    const p = this.phase;
    const rest = p === 3 ? 0.9 : p === 2 ? 1.3 : 1.7;
    const tele = p === 3 ? 0.55 : 0.75;

    if (this.state === 'idle' || this.state === 'rest') {
      // hover & face the player
      this.y = this.baseY + Math.sin(t * 1.6) * 0.15;
      this.mesh.position.y = this.y;
      this.dir = player.position.x < this.x ? -1 : 1;
      if (this.stateT <= 0) { this.state = 'telegraph'; this.stateT = tele; }
    } else if (this.state === 'telegraph') {
      this.mesh.position.x = this.x + Math.sin(t * 60) * 0.06; // tremble
      this.core.material.emissiveIntensity = 2.5;
      if (this.stateT <= 0) { this.state = 'charging'; this.stateT = 3; }
    } else if (this.state === 'charging') {
      this.x += this.dir * this.speed * (p === 3 ? 1.35 : 1) * dt;
      this.mesh.position.x = this.x;
      this.y = this.baseY;
      this.mesh.position.y = this.y;
      if (this.x < this.minX || this.x > this.maxX || this.stateT <= 0) {
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
        this.state = 'rest'; this.stateT = rest;
        this.core.material.emissiveIntensity = 1.4;
      }
    }
    this.mesh.rotation.y += ((this.dir > 0 ? 0.4 : Math.PI - 0.4) - this.mesh.rotation.y) * Math.min(1, dt * 8);

    // phase ≥2: orb volleys
    if (p >= 2) {
      this.volleyT -= dt;
      if (this.volleyT <= 0) {
        this.volleyT = p === 3 ? 2.0 : 3.0;
        for (let i = -1; i <= 1; i++) {
          const fakePlayer = { position: { x: player.position.x + i * 2.4, y: player.position.y } };
          this.projectilePool?.fire(this.x, this.y + 1.4, fakePlayer);
        }
      }
      // summon wisps (max 2 alive at a time overall)
      this.summonT -= dt;
      if (this.summonT <= 0 && this.summoned < 2) {
        this.summonT = 8;
        this.summoned += 1;
        this.onSpawnWisp?.(this.x + this.dir * -2, this.baseY + 2.5);
      }
    }
  }

  wispDied() { this.summoned = Math.max(0, this.summoned - 1); }

  updateHPBar(el) {
    if (el) el.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`;
  }

  dispose() { this.scene.remove(this.mesh); }
}
