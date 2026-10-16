export class FollowerController {
  constructor(scene, THREE, player) {
    this.player = player; this.position = new THREE.Vector3(-1, 0.3, 1);
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 14), new THREE.MeshStandardMaterial({ color: '#f6f0da' }));
    this.mesh.position.copy(this.position); this.mesh.castShadow = true; scene.add(this.mesh);
  }
  update(delta) {
    this.position.x += (this.player.position.x - 0.65 - this.position.x) * Math.min(1, delta * 2.4);
    this.position.z += (this.player.position.z + 0.75 - this.position.z) * Math.min(1, delta * 2.4);
    this.mesh.position.copy(this.position);
  }
}
