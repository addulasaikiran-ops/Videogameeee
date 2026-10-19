import * as THREE from 'three';

// Damage zone: visual spikes + an AABB. Contact hurts the player (the player
// handles invincibility so one overlap can't drain HP every frame).
export class Hazard {
  constructor(scene, { x = 0, y = 0, w = 1.6, kind = 'spikes' }) {
    this.kind = kind;
    this.group = new THREE.Group();
    this.w = w;
    if (kind === 'spikes') {
      const n = Math.max(2, Math.round(w / 0.4));
      const mat = new THREE.MeshStandardMaterial({ color: '#6d5b7d', roughness: 0.5, metalness: 0.4 });
      for (let i = 0; i < n; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 6), mat);
        spike.position.set(-w / 2 + (i + 0.5) * (w / n), 0.25, 0);
        this.group.add(spike);
      }
    } else if (kind === 'void') {
      // invisible kill strip (e.g. water/abyss)
      this.group.add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 1.4), new THREE.MeshBasicMaterial({ visible: false })));
    }
    this.group.position.set(x, y, 0);
    scene.add(this.group);
    this.x = x; this.y = y;
  }

  get aabb() {
    const h = this.kind === 'void' ? 0.3 : 0.45;
    return { minX: this.x - this.w / 2, maxX: this.x + this.w / 2, bottomY: this.y, topY: this.y + h };
  }

  dispose(scene) { scene.remove(this.group); }
}
