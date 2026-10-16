export function createCinema(scene, THREE) {
  const screen = new THREE.Mesh(new THREE.BoxGeometry(4,2.2,0.15), new THREE.MeshStandardMaterial({ color:'#30283f', emissive:'#8d78bd', emissiveIntensity:0.6 })); screen.position.set(0,1.4,-5); scene.add(screen); return screen;
}
