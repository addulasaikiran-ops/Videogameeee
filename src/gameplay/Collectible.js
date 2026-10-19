import * as THREE from 'three';

const shared = {};
function geoms() {
  if (!shared.heart) {
    // A simple stylized heart built from two spheres + a cone-ish bottom.
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.22);
    shape.bezierCurveTo(0, 0.34, -0.18, 0.42, -0.3, 0.3);
    shape.bezierCurveTo(-0.46, 0.14, -0.3, -0.06, 0, -0.3);
    shape.bezierCurveTo(0.3, -0.06, 0.46, 0.14, 0.3, 0.3);
    shape.bezierCurveTo(0.18, 0.42, 0, 0.34, 0, 0.22);
    shared.heart = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    shared.heart.center();
    shared.fragment = new THREE.OctahedronGeometry(0.24);
    shared.star = new THREE.OctahedronGeometry(0.3, 1);
  }
  return shared;
}

const STYLES = {
  heart:    { color: '#ff6d9d', emissive: '#ff8fb8', scale: 1,    scoreLabel: 'heart' },
  fragment: { color: '#8fd8ff', emissive: '#5fbfff', scale: 1,    scoreLabel: 'memory fragment' },
  star:     { color: '#ffe27a', emissive: '#ffd75e', scale: 1,    scoreLabel: 'keepsake star' },
};

export class Collectible {
  constructor(scene, { id, type = 'heart', x = 0, y = 1, scene: sceneKey = null }) {
    this.id = id;
    this.type = type;
    this.sceneKey = sceneKey;
    this.collected = false;
    const style = STYLES[type] || STYLES.heart;
    const geo = geoms()[type === 'star' ? 'star' : type === 'fragment' ? 'fragment' : 'heart'];
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: style.color, emissive: style.emissive, emissiveIntensity: 0.85, roughness: 0.35, metalness: 0.1,
    }));
    this.mesh.position.set(x, y, 0);
    this.baseY = y;
    this.phase = Math.random() * Math.PI * 2;
    this.mesh.scale.setScalar(style.scale);
    scene.add(this.mesh);
  }

  get aabb() {
    const p = this.mesh.position;
    return { minX: p.x - 0.45, maxX: p.x + 0.45, bottomY: p.y - 0.45, topY: p.y + 0.45 };
  }

  collect() {
    this.collected = true;
    this.mesh.visible = false;
    return this.type;
  }

  update(dt, t) {
    if (this.collected) return;
    this.mesh.position.y = this.baseY + Math.sin(t * 2 + this.phase) * 0.12;
    this.mesh.rotation.y += dt * 1.6;
  }

  dispose(scene) { scene.remove(this.mesh); }
}
