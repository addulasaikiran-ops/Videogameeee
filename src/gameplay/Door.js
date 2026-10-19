import * as THREE from 'three';

// A vertical barrier opened by a linked switch. Solid while closed.
export class Door {
  constructor(scene, { id, x = 0, y = 0, h = 3 }) {
    this.id = id;
    this.h = h;
    this.baseY = y;
    this.open = false;
    this.t = 0; // open animation 0..1
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, h, 1.4),
      new THREE.MeshStandardMaterial({ color: '#8b6276', roughness: 0.6, emissive: '#b6436e', emissiveIntensity: 0.15 })
    );
    this.mesh.position.set(x, y + h / 2, 0);
    scene.add(this.mesh);
    this.x = x;
    this._solidAabb = { minX: x - 0.3, maxX: x + 0.3, topY: y + h, bottomY: y };
    this._openAabb = { minX: x - 0.3, maxX: x + 0.3, topY: y - 200, bottomY: y - 200.01 };
    this.aabb = this._solidAabb;
  }

  openDoor() { this.open = true; }

  update(dt) {
    const target = this.open ? 1 : 0;
    this.t += (target - this.t) * Math.min(1, dt * 3);
    this.mesh.position.y = this.baseY + this.h / 2 - this.t * (this.h + 0.4);
    // CollisionSystem reads plat.aabb — swap to a far-away box when open.
    this.aabb = this.t < 0.7 ? this._solidAabb : this._openAabb;
  }

  get deltaX() { return 0; }
  get deltaY() { return 0; }

  dispose(scene) { scene.remove(this.mesh); this.mesh.geometry.dispose(); }
}
