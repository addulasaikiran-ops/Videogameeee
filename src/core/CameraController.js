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
  }

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
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.pos.x + 0.6, this.pos.y - 1.1, 0);
  }
}
