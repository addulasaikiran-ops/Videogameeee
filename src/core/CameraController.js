import * as THREE from 'three';

// Side-view follow camera: leads the player in their facing direction,
// clamps to level bounds, and can be overridden by cutscenes.
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.lookAhead = 2.6;
    this.height = 3.4;
    this.distance = 11.5;
    this.smooth = 5.5;
    this.target = new THREE.Vector3(0, 3, 0);
    this.bounds = { minX: -8, maxX: 40 };
    this.override = null; // {x,y,dist}
    this.pos = new THREE.Vector3(0, this.height, this.distance);
    this.trauma = 0;  // 0..1 screen-shake energy, decays quadratically
    this.kick = 0;    // landing dip
  }

  shake(amount = 0.5) { this.trauma = Math.min(1, Math.max(this.trauma, amount)); }
  dip(amount = 0.45) { this.kick = Math.min(1, this.kick + amount); }

  snap(x, y) {
    this.pos.set(x + this.lookAhead, y + this.height, this.distance);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.pos.x + 0.8, this.pos.y - 0.6, 0);
  }

  update(dt, player) {
    let tx, ty, dist = this.distance;
    if (this.override) {
      tx = this.override.x; ty = this.override.y ?? 3;
      dist = this.override.dist ?? this.distance;
    } else if (player) {
      tx = player.position.x + player.facing * this.lookAhead;
      ty = player.position.y + 1.6;
    } else return;
    tx = Math.max(this.bounds.minX + 6, Math.min(this.bounds.maxX - 6, tx));
    ty = Math.max(2.6, ty);
    const k = Math.min(1, dt * this.smooth);
    this.pos.x += (tx - this.pos.x) * k;
    this.pos.y += (ty + this.height - 1.6 - this.pos.y) * k;
    this.pos.z += (dist - this.pos.z) * k;
    // trauma shake + landing dip — applied as a render offset, pos stays clean
    const s = this.trauma * this.trauma;
    const ox = s > 0.0001 ? (Math.random() * 2 - 1) * s * 0.5 : 0;
    const oy = (s > 0.0001 ? (Math.random() * 2 - 1) * s * 0.32 : 0) - this.kick * 0.4;
    this.camera.position.set(this.pos.x + ox, this.pos.y + oy, this.pos.z);
    this.camera.lookAt(this.pos.x + ox * 0.5 + 0.6, this.pos.y + oy * 0.5 - 1.1, 0);
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.kick = Math.max(0, this.kick - dt * 4);
  }
}
