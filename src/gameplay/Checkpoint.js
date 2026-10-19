import * as THREE from 'three';

// A lantern checkpoint: lights up when activated, sets the player respawn.
export class Checkpoint {
  constructor(scene, { id, x = 0, y = 0 }) {
    this.id = id;
    this.activated = false;
    this.x = x; this.y = y;
    this.group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: '#7a5c58', roughness: 0.8 })
    );
    pole.position.y = 0.8;
    this.lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshStandardMaterial({ color: '#fff0d6', emissive: '#e7c88e', emissiveIntensity: 0.25 })
    );
    this.lamp.position.y = 1.72;
    this.group.add(pole, this.lamp);
    this.group.position.set(x, y, 0);
    scene.add(this.group);
  }

  get aabb() {
    return { minX: this.x - 0.9, maxX: this.x + 0.9, bottomY: this.y - 0.5, topY: this.y + 2 };
  }

  activate() {
    if (this.activated) return false;
    this.activated = true;
    this.lamp.material.emissiveIntensity = 1.6;
    return true;
  }

  update(dt, t) {
    if (this.activated) this.lamp.material.emissiveIntensity = 1.4 + Math.sin(t * 4) * 0.35;
  }

  dispose(scene) { scene.remove(this.group); }
}
