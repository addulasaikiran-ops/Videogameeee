export function createTown(scene, THREE) {
  const group = new THREE.Group();
  for (let i=0;i<5;i++) { const house = new THREE.Mesh(new THREE.BoxGeometry(1.3,1.2+(i%2)*0.4,1.2), new THREE.MeshStandardMaterial({ color:['#e8a98a','#d9c5a4','#b8c8ad'][i%3] })); house.position.set(-5+i*2.5,0.6,-3); group.add(house); }
  scene.add(group); return group;
}
