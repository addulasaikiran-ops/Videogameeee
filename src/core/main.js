import '../style.css';
import * as THREE from 'three';
import { PlayerController } from '../player/PlayerController.js';
import { FollowerController } from '../follower/FollowerController.js';
import { InteractionSystem } from '../interaction/InteractionSystem.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { DialogueSystem } from '../dialogue/DialogueSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { GameUI } from '../ui/GameUI.js';
import { SaveSystem } from '../save/SaveSystem.js';
import { SceneLoader } from '../world/SceneLoader.js';

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error) => console.error('Service worker registration failed:', error));
  });
}
registerServiceWorker();

const app=document.querySelector('#app');
const canvas=document.createElement('canvas'); canvas.id='game'; app.append(canvas);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.setSize(window.innerWidth,window.innerHeight); renderer.shadowMap.enabled=true;
const scene=new THREE.Scene(); scene.background=new THREE.Color('#f6c7a5');
const camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,100); camera.position.set(0,8,11); camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight('#fff1dc','#8c9e89',2.2)); const sun=new THREE.DirectionalLight('#fff1d1',2.1); sun.position.set(-4,9,5); sun.castShadow=true; scene.add(sun);
const sceneLoader=new SceneLoader(scene,THREE); sceneLoader.load('beach');
const player=new PlayerController(scene,THREE); const follower=new FollowerController(scene,THREE,player);
const saveSystem=new SaveSystem(); const dialogue=new DialogueSystem(); const memories=new MemorySystem(); const audio=new AudioManager();
let ui; const interactions=new InteractionSystem({player,dialogue,memories,ui:null});
let started=false;
function startGame(continueSaved) {
  audio.unlock();
  if(continueSaved) { const saved=saveSystem.load(); if(saved?.player) player.setPosition(saved.player.x,saved.player.z); if(saved?.scene) sceneLoader.load(saved.scene); }
  else { player.setPosition(0,0); sceneLoader.load('beach'); saveSystem.save({player:{x:0,z:0},scene:'beach'}); }
  started=true; ui.showGame(); dialogue.show('Welcome to our little world. Take your time and explore.');
}
ui=new GameUI(app,{onNewGame:()=>startGame(false),onContinue:()=>startGame(true),onInteract:()=>interactions.interact(),onMove:(x,z)=>player.setMoveInput(x,z),onMute:()=>audio.toggleMute()}); interactions.ui=ui;
let previous=performance.now();
function animate(now) {
  requestAnimationFrame(animate); const delta=Math.min((now-previous)/1000,0.05); previous=now;
  if(started) { player.update(delta); follower.update(delta); interactions.update(delta); camera.position.lerp(new THREE.Vector3(player.position.x,7,player.position.z+9),0.04); camera.lookAt(player.position.x,0,player.position.z); saveSystem.saveThrottled({player:{x:player.position.x,z:player.position.z},scene:sceneLoader.currentScene}); }
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
