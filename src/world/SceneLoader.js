import { createBeach } from './BeachEnvironment.js';
import { createTown } from './TownEnvironment.js';
import { createCinema } from './CinemaEnvironment.js';
import { createSecret } from './SecretEnvironment.js';
import { LOCATIONS } from './locations.js';
export class SceneLoader {
  constructor(scene, THREE) { this.scene=scene; this.THREE=THREE; this.currentScene='beach'; this.worldObjects=[]; }
  load(name='beach') {
    this.worldObjects.forEach((object)=>this.scene.remove(object)); this.worldObjects=[];
    this.currentScene=LOCATIONS[name]?name:'beach'; this.scene.background=new this.THREE.Color(LOCATIONS[this.currentScene].sky);
    if(this.currentScene==='beach') this.worldObjects=Object.values(createBeach(this.scene,this.THREE));
    if(this.currentScene==='town') this.worldObjects=[createTown(this.scene,this.THREE)];
    if(this.currentScene==='cinema') this.worldObjects=[createCinema(this.scene,this.THREE)];
    if(this.currentScene==='secret') this.worldObjects=[createSecret(this.scene,this.THREE)];
    return this.currentScene;
  }
}
