export class PlayerController {
  constructor(scene, THREE) {
    this.position = new THREE.Vector3(0, 0.45, 0);
    this.input = { x: 0, z: 0 };
    this.speed = 3.2;
    this.mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 4, 8), new THREE.MeshStandardMaterial({ color: '#b66b83', roughness: 0.8 }));
    this.mesh.position.copy(this.position); this.mesh.castShadow = true; scene.add(this.mesh);
    const keys = new Set();
    const read = () => this.setMoveInput((keys.has('a') || keys.has('arrowleft') ? -1 : 0) + (keys.has('d') || keys.has('arrowright') ? 1 : 0), (keys.has('w') || keys.has('arrowup') ? -1 : 0) + (keys.has('s') || keys.has('arrowdown') ? 1 : 0));
    window.addEventListener('keydown', (e) => { keys.add(e.key.toLowerCase()); read(); });
    window.addEventListener('keyup', (e) => { keys.delete(e.key.toLowerCase()); read(); });
  }
  setMoveInput(x, z) { this.input.x = x; this.input.z = z; }
  setPosition(x, z) { this.position.set(x, 0.45, z); this.mesh.position.copy(this.position); }
  update(delta) {
    const length = Math.hypot(this.input.x, this.input.z) || 1;
    this.position.x = THREEClamp(this.position.x + this.input.x / length * this.speed * delta, -8, 8);
    this.position.z = THREEClamp(this.position.z + this.input.z / length * this.speed * delta, -8, 8);
    this.mesh.position.copy(this.position);
  }
}
function THREEClamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
