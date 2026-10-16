export function createBeach(scene, THREE) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(24,24), new THREE.MeshStandardMaterial({ color:'#eacb9e', roughness:1 })); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(24,4), new THREE.MeshStandardMaterial({ color:'#72c4d0', roughness:0.45 })); water.rotation.x=-Math.PI/2; water.position.set(0,0.03,-9); scene.add(water);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.22,16,10), new THREE.MeshStandardMaterial({ color:'#fff0d6', emissive:'#d4a46b', emissiveIntensity:0.4 })); shell.position.set(2.2,0.25,-1.5); shell.scale.set(1,0.55,0.7); scene.add(shell);
  return { ground, water, shell };
}
