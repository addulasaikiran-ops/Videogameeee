import * as THREE from 'three';

// A solid platform. `x,y` is the center of its TOP surface. Size w×h (z thin).
// Optional movement: {axis:'x'|'y', range, speed, phase} makes it patrol.
export class Platform {
  constructor(scene, { x = 0, y = 0, w = 4, h = 0.6, color = '#8fae8a', move = null, depth = 1.6, material = null, visible = true }) {
    this.w = w; this.h = h; this.depth = depth;
    this.baseX = x; this.baseY = y;
    this.move = move;
    this.deltaX = 0; this.deltaY = 0;
    this._t = (move?.phase || 0) * Math.PI * 2;
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, depth),
      material || new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );
    this.mesh.position.set(x, y - h / 2, 0);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.visible = visible;
    scene.add(this.mesh);
  }

  get cx() { return this.mesh.position.x; }
  get cy() { return this.mesh.position.y + this.h / 2; } // top surface y

  get aabb() {
    return {
      minX: this.cx - this.w / 2,
      maxX: this.cx + this.w / 2,
      topY: this.cy,
      bottomY: this.cy - this.h,
    };
  }

  update(dt) {
    this.deltaX = 0; this.deltaY = 0;
    if (!this.move) return;
    this._t += dt * (this.move.speed || 1);
    const off = Math.sin(this._t) * (this.move.range || 2);
    let nx = this.baseX, ny = this.baseY;
    if (this.move.axis === 'y') ny = this.baseY + off; else nx = this.baseX + off;
    this.deltaX = nx - this.cx;
    this.deltaY = ny - this.cy;
    this.mesh.position.x = nx;
    this.mesh.position.y = ny - this.h / 2;
  }

  dispose(scene) { scene.remove(this.mesh); this.mesh.geometry.dispose(); }
}

export function makePlatformGroup(scene, defs, materialFor) {
  return defs.map((d) => new Platform(scene, { ...d, material: d.material || materialFor?.(d) }));
}
