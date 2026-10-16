export function createSecret(scene, THREE) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1,0.08,12,48), new THREE.MeshStandardMaterial({ color:'#fff0c7', emissive:'#e7c88e', emissiveIntensity:0.8 })); ring.position.set(4,1.2,-3); scene.add(ring); return ring;
}
