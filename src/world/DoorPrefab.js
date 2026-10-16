export function createDoor(scene, THREE, position, onEnter) {
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2,2,0.18), new THREE.MeshStandardMaterial({ color:'#8b6276' }));
  door.position.set(position.x,1,position.z); door.userData.onEnter=onEnter; scene.add(door); return door;
}
