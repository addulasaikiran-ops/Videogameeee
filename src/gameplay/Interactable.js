import * as THREE from 'three';

// Interactable: signpost (shows dialogue), switch (toggles a door), or trigger.
// `action` is dispatched to the game: {type:'dialogue',key} | {type:'door',id}
export class Interactable {
  constructor(scene, { id, x = 0, y = 0, kind = 'sign', label = null, action = null, once = false }) {
    this.id = id;
    this.kind = kind;
    this.action = action;
    this.once = once;
    this.used = false;
    this.x = x; this.y = y;
    this.group = new THREE.Group();
    if (kind === 'sign') {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 8), new THREE.MeshStandardMaterial({ color: '#8a6f5c' }));
      post.position.y = 0.5;
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), new THREE.MeshStandardMaterial({ color: '#d9b98c', roughness: 0.85 }));
      board.position.y = 1.1;
      this.group.add(post, board);
    } else if (kind === 'switch') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.18, 10), new THREE.MeshStandardMaterial({ color: '#5b4b63' }));
      base.position.y = 0.09;
      this.orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: '#8fd8ff', emissive: '#5fbfff', emissiveIntensity: 0.4 }));
      this.orb.position.y = 0.42;
      this.group.add(base, this.orb);
    } else {
      // invisible trigger area (auto-fire when entered)
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
      this.group.add(marker);
    }
    if (label) this.label = label;
    this.group.position.set(x, y, 0);
    scene.add(this.group);
  }

  get aabb() {
    const r = this.kind === 'trigger' ? 1.1 : 1.2;
    return { minX: this.x - r, maxX: this.x + r, bottomY: this.y - 0.5, topY: this.y + 1.6 };
  }

  fire() {
    if (this.once && this.used) return null;
    this.used = true;
    if (this.orb) this.orb.material.emissiveIntensity = 1.6;
    return this.action;
  }

  update(dt, t) {
    if (this.orb && !this.used) this.orb.material.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.2;
  }

  dispose(scene) { scene.remove(this.group); }
}
