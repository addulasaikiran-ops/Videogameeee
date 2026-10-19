import * as THREE from 'three';

// The glowing gate at the end of a level. Touching it completes the level.
export class Goal {
  constructor(scene, { x = 0, y = 0, label = 'Goal' }) {
    this.x = x; this.y = y; this.label = label;
    this.reached = false;
    this.group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.12, 12, 40),
      new THREE.MeshStandardMaterial({ color: '#ffd7e8', emissive: '#ff8fb8', emissiveIntensity: 0.9, roughness: 0.4 })
    );
    ring.position.y = 1.2;
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.3);
    heartShape.bezierCurveTo(0, 0.46, -0.24, 0.56, -0.4, 0.4);
    heartShape.bezierCurveTo(-0.6, 0.18, -0.4, -0.08, 0, -0.4);
    heartShape.bezierCurveTo(0.4, -0.08, 0.6, 0.18, 0.4, 0.4);
    heartShape.bezierCurveTo(0.24, 0.56, 0, 0.46, 0, 0.3);
    const heart = new THREE.Mesh(
      new THREE.ExtrudeGeometry(heartShape, { depth: 0.1, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({ color: '#ff5d8f', emissive: '#ff5d8f', emissiveIntensity: 1.2 })
    );
    heart.position.set(0, 1.25, 0);
    this.heart = heart;
    this.group.add(ring, heart);
    this.group.position.set(x, y, 0);
    scene.add(this.group);
  }

  get aabb() {
    return { minX: this.x - 1.0, maxX: this.x + 1.0, bottomY: this.y - 0.3, topY: this.y + 2.4 };
  }

  update(dt, t) {
    this.heart.position.y = 1.25 + Math.sin(t * 2.2) * 0.08;
    this.heart.rotation.y = Math.sin(t * 1.4) * 0.4;
    this.group.rotation.z = Math.sin(t * 0.9) * 0.03;
  }

  dispose(scene) { scene.remove(this.group); }
}
