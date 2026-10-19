import * as THREE from 'three';
import { LEVELS } from './level-data.js';
import { buildDecor } from './decor.js';
import { Platform } from '../gameplay/Platform.js';
import { Collectible } from '../gameplay/Collectible.js';
import { Hazard } from '../gameplay/Hazard.js';
import { Checkpoint } from '../gameplay/Checkpoint.js';
import { Interactable } from '../gameplay/Interactable.js';
import { Door } from '../gameplay/Door.js';
import { Goal } from '../gameplay/Goal.js';
import { Enemy, ProjectilePool } from '../gameplay/Enemy.js';
import { Boss } from '../gameplay/Boss.js';

// Builds a playable level object from level-data. Owns disposal so switching
// levels can't leak meshes, listeners, or materials.
export class LevelManager {
  constructor(scene, save) {
    this.scene = scene;
    this.save = save;
    this.level = null;
  }

  static exists(id) { return !!LEVELS[id]; }
  static data(id) { return LEVELS[id]; }

  build(id) {
    this.dispose();
    const data = LEVELS[id];
    if (!data) throw new Error(`Unknown level: ${id}`);
    const scene = this.scene;

    const decor = buildDecor(scene, data.theme, this._length(data));

    const groundMat = new THREE.MeshStandardMaterial({ color: this._groundColor(data.theme), roughness: 0.95 });
    const platMat = new THREE.MeshStandardMaterial({ color: this._platformColor(data.theme), roughness: 0.9 });
    const platforms = [
      ...(data.ground || []).map((d) => new Platform(scene, { ...d, material: groundMat, depth: 3 })),
      ...(data.platforms || []).map((d) => new Platform(scene, { ...d, material: platMat, depth: 1.8 })),
    ];
    const doors = (data.doors || []).map((d) => new Door(scene, d));
    // doors collide like platforms until opened
    platforms.push(...doors);

    const collectibles = (data.collectibles || [])
      .filter((c) => !this.save.collected(id, c.id))
      .map((c) => new Collectible(scene, c));
    const hazards = (data.hazards || []).map((h) => new Hazard(scene, h));
    const checkpoints = (data.checkpoints || []).map((c) => new Checkpoint(scene, c));
    const interactables = (data.interactables || []).map((i) => new Interactable(scene, i));
    const projectilePool = new ProjectilePool(scene, 12);
    const enemies = (data.enemies || []).map((e) => new Enemy(scene, { ...e, projectilePool }));
    const goal = data.goal ? new Goal(scene, data.goal) : null;
    const boss = data.boss ? new Boss(scene, {
      ...data.boss,
      projectilePool,
      onSpawnWisp: (x, y) => {
        const w = new Enemy(scene, { id: `${id}-summon-${Math.random()}`, type: 'wisp', x, y, projectilePool });
        w.isSummon = true;
        level.enemies.push(w);
      },
    }) : null;

    const level = {
      id, data, decor, platforms, doors, collectibles, hazards, checkpoints,
      interactables, enemies, projectilePool, boss, goal,
      slowPace: data.slowPace || 1,
      killY: data.killY ?? -6,
      bounds: this._bounds(data),
    };
    this.level = level;
    return level;
  }

  _length(data) {
    let max = 40;
    for (const g of data.ground || []) max = Math.max(max, g.x + g.w / 2);
    return max;
  }

  _bounds(data) {
    let min = -8, max = 40;
    for (const g of data.ground || []) { min = Math.min(min, g.x - g.w / 2); max = Math.max(max, g.x + g.w / 2); }
    return { minX: min, maxX: max };
  }

  _groundColor(theme) {
    return {
      dawnGarden: '#5d6d5e', memoryGarden: '#6d5b8f', memoryVoid: '#5b4b78',
      nightSea: '#d9c29a', shadowRealm: '#3d3153', bossArena: '#4d3a5e', endingGlade: '#9db98a',
    }[theme] || '#8fae8a';
  }

  _platformColor(theme) {
    return {
      dawnGarden: '#a8b892', memoryGarden: '#8d78bd', memoryVoid: '#7d6b9f',
      nightSea: '#e8d3a8', shadowRealm: '#54456e', bossArena: '#6e5686', endingGlade: '#b8cfa0',
    }[theme] || '#b8cfa0';
  }

  update(dt, t, player) {
    const L = this.level;
    if (!L) return;
    for (const p of L.platforms) p.update?.(dt);
    for (const d of L.doors) d.update(dt);
    for (const c of L.collectibles) c.update(dt, t);
    for (const cp of L.checkpoints) cp.update(dt, t);
    for (const i of L.interactables) i.update(dt, t);
    for (const e of L.enemies) e.update(dt, t, player);
    L.boss?.update(dt, t, player);
    L.goal?.update(dt, t);
    L.decor.particles?.update(dt, t, player?.position.x ?? 0);
    // gentle ocean swell on the beach level
    const water = L.decor.group.userData.water;
    if (water) {
      const pos = water.geometry.attributes.position;
      const tt = t * 1.4;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 0.5 + tt) * 0.25);
      pos.needsUpdate = true;
    }
  }

  dispose() {
    const L = this.level;
    if (!L) return;
    const s = this.scene;
    for (const p of L.platforms) p.dispose?.(s);
    for (const d of L.doors) d.dispose(s);
    for (const c of L.collectibles) c.dispose(s);
    for (const h of L.hazards) h.dispose(s);
    for (const cp of L.checkpoints) cp.dispose(s);
    for (const i of L.interactables) i.dispose(s);
    for (const e of L.enemies) e.dispose();
    L.boss?.dispose();
    L.projectilePool?.dispose();
    L.goal?.dispose(s);
    L.decor.particles?.dispose(s);
    s.remove(L.decor.group);
    this.level = null;
  }
}
