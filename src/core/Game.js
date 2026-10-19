import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { SaveManager } from './SaveManager.js';
import { AudioManager } from './AudioManager.js';
import { CameraController } from './CameraController.js';
import { Player } from '../player/Player.js';
import { LevelManager } from '../levels/LevelManager.js';
import { LEVELS } from '../levels/level-data.js';
import { buildDecor } from '../levels/decor.js';
import { aabbOverlap } from '../gameplay/CollisionSystem.js';
import { DialogueManager } from '../story/DialogueManager.js';
import { CutsceneManager } from '../story/CutsceneManager.js';
import { BurstEmitter } from '../gameplay/Particles.js';
import { UIManager } from '../ui/UIManager.js';
import { TouchControls } from '../ui/TouchControls.js';
import { Goal } from '../gameplay/Goal.js';

const State = {
  LOADING: 'loading', MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused',
  DIALOGUE: 'dialogue', CUTSCENE: 'cutscene', COMPLETE: 'complete', ENDING: 'ending',
};

export class Game {
  constructor(app) {
    this.app = app;
    this.state = State.LOADING;
    this._buildRenderer();

    this.save = new SaveManager();
    this.input = new InputManager();
    this.audio = new AudioManager(this.save.data.settings);
    this.cam = new CameraController(this.camera);
    this.levels = new LevelManager(this.scene, this.save);
    this.player = new Player(this.scene);
    this.bursts = new BurstEmitter(this.scene);
    this.ui = new UIManager(app, this._handlers(), this.save);
    this.touch = new TouchControls(app, this.input);
    this.dialogue = new DialogueManager(this.ui);
    this.cutscene = new CutsceneManager();

    this.runHearts = 0;
    this.levelFragTotal = 0;
    this.prevT = performance.now();
    this._applyQuality();
    this.player.onEvent = (name) => this._onPlayerEvent(name);

    window.addEventListener('resize', () => this._onResize());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === State.PLAYING) this._pause(); });
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    this.ui.showLoading();
    setTimeout(() => this.toMenu(), 450);
    requestAnimationFrame((t) => this._frame(t));
  }

  _buildRenderer() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game';
    this.app.append(this.canvas);
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      const msg = document.createElement('div');
      msg.className = 'webgl-fail';
      msg.textContent = 'This little world needs WebGL — please try a browser with graphics support.';
      this.app.append(msg);
      throw e;
    }
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1d1630');
    this.scene.fog = new THREE.Fog('#1d1630', 30, 60);
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 120);
    this.scene.add(new THREE.HemisphereLight('#ffeeda', '#4a3d5c', 1.9));
    this.sun = new THREE.DirectionalLight('#ffe8c9', 1.6);
    this.sun.position.set(-6, 12, 6);
    this.scene.add(this.sun);
    this._onResize();
  }

  _applyQuality() {
    const q = this.save.data.settings.quality;
    const low = q === 'low' || (q === 'auto' && InputManager.isTouchDevice);
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = !low;
    this.sun.castShadow = !low;
  }

  _onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(innerWidth, innerHeight);
    this.ui?.updateOrientationHint();
  }

  _handlers() {
    return {
      onNewGame: () => { this.audio.play('ui'); this.startRun(false); },
      onContinue: () => { this.audio.play('ui'); this.startRun(true); },
      onPlayLevel: (id) => { this.audio.play('ui'); this.startLevel(id); },
      onResume: () => { this.audio.play('ui'); this._resume(); },
      onRestartLevel: () => { this.audio.play('ui'); this.ui.hidePause(); this.startLevel(this.level.id); },
      onQuitToMenu: () => { this.audio.play('ui'); this.toMenu(); },
      onSetting: (k, v) => { this.save.setSettings({ [k]: v }); this.audio.applyVolumes(); if (k === 'quality') this._applyQuality(); },
      onResetProgress: () => { this.save.resetProgress(); this.audio.play('ui'); this.toMenu(); },
      onDialogueNext: () => { this.audio.play('ui'); this.dialogue.next(); },
      onDialogueSkip: () => { this.audio.play('ui'); this.dialogue.skip(); },
      onUiSfx: (name) => this.audio.play(name),
      levelName: (id) => LEVELS[id]?.name || id,
    };
  }

  // ── flow ──────────────────────────────────────────────────────────────────
  toMenu() {
    this.state = State.MENU;
    this.levels.dispose();
    this.level = null;
    this.player.mesh.visible = false;
    this.ui.setInGame(false);
    this.touch.setVisible(false);
    this.ui.setBoss(null);
    this.ui.showMenu();
    // gentle menu backdrop: a quiet glade behind the panel
    if (!this._menuDecor) {
      this._menuDecor = buildDecor(this.scene, 'endingGlade', 40);
      this._menuParticles = this._menuDecor.particles;
      this.cam.bounds = { minX: -8, maxX: 34 };
      this.cam.snap(14, 3);
    }
  }

  startRun(continued) {
    if (this._menuDecor) {
      this.scene.remove(this._menuDecor.group);
      this._menuDecor.particles?.dispose(this.scene);
      this._menuDecor = null;
      this._menuParticles = null;
    }
    if (continued && this.save.data.checkpoint) {
      this.startLevel(this.save.data.checkpoint.levelId);
    } else if (continued && this.save.data.lastLevel && this.save.data.unlocked.includes(this.save.data.lastLevel)) {
      this.startLevel(this.save.data.lastLevel);
    } else {
      this.startLevel('firstLight');
    }
  }

  startLevel(id) {
    if (!LEVELS[id]) id = 'firstLight';
    const level = this.levels.build(id);
    this.level = level;
    this.state = State.PLAYING;
    this.runHearts = 0;
    this.levelFragTotal = (level.data.collectibles || []).filter((c) => c.type === 'fragment').length;
    this.cam.bounds = level.bounds;
    this.input.releaseAll();
    this.input.clearPresses();
    this.player.hp = this.player.maxHp;

    // spawn at saved checkpoint when returning to its level
    let spawn = level.data.spawn;
    const cp = this.save.data.checkpoint;
    if (cp && cp.levelId === id) {
      const found = level.checkpoints.find((c) => c.id === cp.checkpointId);
      if (found) { spawn = [found.x, found.y + 0.1]; found.activated = true; }
    }
    this.player.setSpawn(spawn[0], spawn[1]);
    this.player.mesh.visible = true;
    this.cam.snap(this.player.position.x, this.player.position.y);

    this.save.data.lastLevel = id;
    this.save.save();

    this.ui.showGame();
    this.ui.setInGame(true);
    this.ui.setBoss(null);
    this.touch.setVisible(InputManager.isTouchDevice);
    this._updateHudCounts();
    this.ui.setHp(this.player.hp, this.player.maxHp);
    this.ui.showToast(level.data.name, 2600);
    this.audio.unlock();
    this.audio.setMood(id);

    if (level.data.introScene && !this.save.flag(`intro:${id}`)) {
      this.save.setFlag(`intro:${id}`);
      this._playDialogue(level.data.introScene);
    }
  }

  _pause() {
    if (this.state !== State.PLAYING) return;
    this.state = State.PAUSED;
    this.input.releaseAll();
    this.ui.showPause();
  }

  _resume() {
    this.ui.hidePause();
    this.input.clearPresses();
    if (this.state === State.PAUSED) this.state = State.PLAYING;
  }

  _playDialogue(key, opts = {}) {
    this.state = State.DIALOGUE;
    this.input.releaseAll();
    this.dialogue.play(key, {
      skippable: opts.skippable !== false,
      onDone: () => {
        const fromCutscene = this._dialogueFromCutscene;
        this._dialogueFromCutscene = false;
        if (fromCutscene) { this.state = State.CUTSCENE; this.cutscene.dialogueDone(); }
        else { this.state = State.PLAYING; opts.onDone?.(); }
      },
    });
  }

  _playCutscene(steps, onDone) {
    this.state = State.CUTSCENE;
    this.input.releaseAll();
    this.cutscene.play(steps, () => { this.cam.override = null; this.state = State.PLAYING; onDone?.(); });
  }

  _completeLevel() {
    const id = this.level.id;
    this.audio.play('complete');
    this.save.complete(id);
    this.save.clearCheckpoint();
    const next = this.level.data.next;
    if (next) this.save.unlock(next);
    const stats = {
      name: this.level.data.name,
      hearts: this.runHearts,
      fragments: (this.save.data.collectibles[id] || []).filter((c) => c.includes('-m')).length,
      stars: (this.save.data.collectibles[id] || []).filter((c) => c.includes('-s')).length,
    };
    if (!next) { this._showEnding(); return; }
    this.state = State.COMPLETE;
    const playEnd = this.level.data.endScene;
    const nextId = next;
    this.ui.showLevelComplete(stats, () => {
      this.audio.play('ui');
      if (playEnd && !this.save.flag(`end:${id}`)) {
        this.save.setFlag(`end:${id}`);
        this.state = State.PLAYING; // dialogue needs playing-state context
        this._playDialogue(playEnd, { onDone: () => this.startLevel(nextId) });
      } else this.startLevel(nextId);
    });
  }

  _showEnding() {
    this.state = State.ENDING;
    this.ui.setInGame(false);
    this.touch.setVisible(false);
    this.ui.showEnding();
  }

  _gameOver() {
    this.save.recordDeath();
    this.audio.play('death');
    this.ui.flashGameOver();
    const cp = this.save.data.checkpoint;
    const here = cp && cp.levelId === this.level.id && this.level.checkpoints.find((c) => c.id === cp.checkpointId);
    const spawn = here ? [here.x, here.y + 0.1] : this.level.data.spawn;
    setTimeout(() => {
      this.player.setSpawn(spawn[0], spawn[1]);
      this.player.respawn(true);
      this.ui.setHp(this.player.hp, this.player.maxHp);
      this.audio.play('respawn');
    }, 900);
  }

  _reducedMotion() {
    return !!(this.save.data.settings.reducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }

  _onPlayerEvent(name) {
    this.audio.play(name);
    if (name === 'land' && !this._reducedMotion()) this.cam.dip(0.4);
    if ((name === 'hurt' || name === 'land') && navigator.vibrate) navigator.vibrate(name === 'hurt' ? 40 : 8);
    if (name === 'hurt') {
      this.ui.setHp(this.player.hp, this.player.maxHp);
      this.ui.hurtFlash();
      if (!this._reducedMotion()) this.cam.shake(0.55);
      this.bursts.burst(this.player.position.x, this.player.position.y + 0.8, { color: '#ff6d6d', count: 8 });
    }
    if (name === 'death') { this._gameOver(); if (!this._reducedMotion()) this.cam.shake(0.7); }
    if (name === 'attack') this.bursts.burst(this.player.position.x + this.player.facing, this.player.position.y + 0.7, { color: '#ff9ec4', count: 6, speed: 2.5, life: 0.4 });
    if (name === 'doubleJump') this.bursts.burst(this.player.position.x, this.player.position.y, { color: '#cfe9ff', count: 8, speed: 2, life: 0.4 });
    if (name === 'jump') this.bursts.burst(this.player.position.x, this.player.position.y, { color: '#fff0d6', count: 4, speed: 1.6, life: 0.3 });
  }

  _updateHudCounts() {
    const id = this.level?.id;
    const frags = (this.save.data.collectibles[id] || []).filter((c) => c.includes('-m')).length;
    this.ui.setHearts(this.runHearts);
    this.ui.setFragments(frags, this.levelFragTotal);
  }

  // ── per-frame ─────────────────────────────────────────────────────────────
  _frame(now) {
    requestAnimationFrame((t) => this._frame(t));
    const dt = Math.min((now - this.prevT) / 1000, 0.05);
    this.prevT = now;
    const t = now / 1000;

    // global keys
    if (this.input.consume('pause')) {
      if (this.state === State.PLAYING) this._pause();
      else if (this.state === State.PAUSED) this._resume();
      else if (this.state === State.DIALOGUE) this.dialogue.skip();
      else if (this.state === State.CUTSCENE) { this.cutscene.skip(); }
    }
    if (this.state === State.DIALOGUE) {
      if (this.input.consume('interact') || this.input.consume('attack') || this.input.consume('jump')) this.dialogue.next();
    }

    if (this.state === State.PLAYING) this._updatePlaying(dt, t);
    else if (this.state === State.CUTSCENE) this._updateCutscene(dt, t);
    else if (this.state === State.MENU && this._menuParticles) this._menuParticles.update(dt, t, 14);
    else if (this.state === State.DIALOGUE || this.state === State.COMPLETE || this.state === State.PAUSED) {
      this.level?.decor.particles?.update(dt, t, this.player.position.x);
    }

    this.bursts.update(dt);
    this.cam.update(dt, this.state === State.CUTSCENE ? null : this.player);
    if (this.state === State.CUTSCENE && this.cam.override) {
      const o = this.cam.override;
      this.cam.pos.x += (o.x - this.cam.pos.x) * Math.min(1, dt * 2);
      this.cam.pos.y += ((o.y ?? 3) + this.cam.height - 1.6 - this.cam.pos.y) * Math.min(1, dt * 2);
      this.cam.pos.z += ((o.dist ?? 11.5) - this.cam.pos.z) * Math.min(1, dt * 2);
      this.camera.position.copy(this.cam.pos);
      this.camera.lookAt(this.cam.pos.x + 0.6, this.cam.pos.y - 1.1, 0);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _updateCutscene(dt, t) {
    this.cutscene.update(dt);
    if (!this.cutscene.active) return;
    if (this.cutscene.needsDialogue) {
      const key = this.cutscene.dialogueKey;
      this.cutscene._dialogue.played = true;
      this._dialogueFromCutscene = true;
      this._playDialogue(key);
      return;
    }
    this.cam.override = this.cutscene.camTarget;
    this.level?.decor.particles?.update(dt, t, this.cam.pos.x);
    // keep world alive subtly
    for (const c of this.level?.collectibles || []) c.update(dt, t);
  }

  _updatePlaying(dt, t) {
    // hit-stop: briefly slow gameplay on impactful kills (skip with reduced motion)
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      if (!this._reducedMotion()) dt = dt * 0.12;
    }
    const L = this.level;
    const p = this.player;
    const effInput = {
      moveX: this.input.moveX * L.slowPace,
      held: this.input.held,
      consume: (a) => this.input.consume(a),
    };
    p.update(dt, effInput, L.platforms);
    this.levels.update(dt, t, p);
    p.position.x = Math.max(L.bounds.minX + 0.3, Math.min(L.bounds.maxX - 0.3, p.position.x));

    // fell out of the world
    if (p.position.y < L.killY && !p.dead) { p.hp = 0; p.dead = true; p.state = 'dead'; this._gameOver(); }

    const pa = p.aabb();

    // collectibles
    for (const c of L.collectibles) {
      if (c.collected || !aabbOverlap(pa.minX, pa.bottomY, p.width, p.height, c.aabb)) continue;
      c.collect();
      this.save.collect(L.id, c.id, c.type === 'heart');
      if (c.type === 'heart') {
        this.runHearts++;
        const now = performance.now();
        this._streak = (this._streak && now - this._streak.t < 1600) ? { n: this._streak.n + 1, t: now } : { n: 0, t: now };
        this.audio.play('collect', { step: this._streak.n });
        this.bursts.burst(c.mesh.position.x, c.mesh.position.y, { color: '#ff8fb8' });
      }
      else if (c.type === 'fragment') { this.audio.play('fragment'); this.bursts.burst(c.mesh.position.x, c.mesh.position.y, { color: '#8fd8ff' }); this._collectFragment(c); }
      else { this.audio.play('star'); this.bursts.burst(c.mesh.position.x, c.mesh.position.y, { color: '#ffe27a' }); this.ui.showToast('A hidden keepsake ★'); }
      this._updateHudCounts();
    }

    // hazards
    for (const h of L.hazards) {
      if (aabbOverlap(pa.minX, pa.bottomY, p.width, p.height, h.aabb)) {
        if (p.hurt(h.x)) this.bursts.burst(p.position.x, p.position.y + 0.6, { color: '#b6436e', count: 8 });
      }
    }

    // checkpoints
    for (const cp of L.checkpoints) {
      if (!cp.activated && aabbOverlap(pa.minX, pa.bottomY, p.width, p.height, cp.aabb)) {
        cp.activate();
        this.save.setCheckpoint(L.id, cp.id);
        p.setSpawn(cp.x, cp.y + 0.1);
        this.audio.play('checkpoint');
        this.ui.showToast('Lantern lit — checkpoint');
      }
    }

    // enemies
    const attackBox = p.attackActive ? p.attackAabb() : null;
    for (const e of L.enemies) {
      if (!e.alive) continue;
      if (attackBox && aabbOverlap(attackBox.minX, attackBox.bottomY, attackBox.maxX - attackBox.minX, attackBox.topY - attackBox.bottomY, e.aabb)) {
        const res = e.hit(1);
        this.audio.play(res === 'dead' ? 'enemyDie' : 'enemyHit');
        if (res === 'dead') this.hitStop = 0.06;
        this.bursts.burst(e.x, e.y + 0.5, { color: '#c9b6ff', count: 10 });
        if (res === 'dead' && e.isSummon) L.boss?.wispDied();
        continue;
      }
      if (aabbOverlap(pa.minX, pa.bottomY, p.width, p.height, e.aabb)) p.hurt(e.x);
    }

    // projectiles
    L.projectilePool.update(dt, p, (hx) => { p.hurt(hx); this.audio.play('hurt'); });

    // boss
    if (L.boss) {
      const b = L.boss;
      this.ui.setBoss(b.alive ? b.hp / b.maxHp : 0);
      if (b.alive) {
        if (p.attackActive) {
          const aa = p.attackAabb();
          if (aabbOverlap(aa.minX, aa.bottomY, aa.maxX - aa.minX, aa.topY - aa.bottomY, b.aabb)) {
            const res = b.hit(1);
            this.audio.play(res === 'dead' ? 'enemyDie' : 'bossHit');
            this.hitStop = 0.09;
            if (!this._reducedMotion()) this.cam.shake(0.35);
            this.bursts.burst(b.x, b.y + 1.2, { color: '#ff8fb8', count: 14, speed: 4 });
            if (res === 'dead') this._bossDefeated();
          }
        }
        if (aabbOverlap(pa.minX, pa.bottomY, p.width, p.height, b.aabb)) p.hurt(b.x);
      }
    }

    // interactables
    let nearest = null;
    for (const i of L.interactables) {
      if (i.used && i.once) continue;
      if (aabbOverlap(pa.minX, pa.bottomY, p.width, p.height, i.aabb)) {
        if (i.kind === 'trigger') { this._fireInteractable(i); }
        else nearest = i;
      }
    }
    this.ui.setInteract(!!nearest);
    this.touch.setInteract(!!nearest);
    if (nearest && this.input.consume('interact')) this._fireInteractable(nearest);

    // goal
    if (L.goal && !L.goal.reached && aabbOverlap(pa.minX, pa.bottomY, p.width, p.height, L.goal.aabb)) {
      L.goal.reached = true;
      this.audio.play('door');
      if (this.level.data.endScene && !this.save.flag(`end:${L.id}`) && L.id !== 'endingGlade') {
        this.save.setFlag(`end:${L.id}`);
        this._playDialogue(this.level.data.endScene, { onDone: () => this._completeLevel() });
      } else this._completeLevel();
    }

    // attack input
    if (this.input.consume('attack')) p.tryAttack();
  }

  _collectFragment(c) {
    if (c.sceneKey) this._playDialogue(c.sceneKey);
  }

  _fireInteractable(i) {
    const action = i.fire();
    if (!action) return;
    if (action.type === 'dialogue') this._playDialogue(action.key);
    else if (action.type === 'door') {
      const door = this.level.doors.find((d) => d.id === action.id);
      if (door && !door.open) { door.openDoor(); this.audio.play('door'); this.ui.showToast('Something opens nearby…'); }
    } else if (action.type === 'cutscene') this._bossIntro();
  }

  _bossIntro() {
    const b = this.level.boss;
    this.audio.play('bossRoar');
    this._playCutscene([
      { cam: { x: b.x, y: 4, dist: 9, dur: 2 } },
      { wait: 0.8 },
      { dialogue: 'boss_intro' },
      { cam: { x: this.player.position.x, y: this.player.position.y + 1.6, dist: 11.5 } },
    ], () => { this.cam.override = null; });
  }

  _bossDefeated() {
    this.bursts.burst(this.level.boss.x, this.level.boss.y + 1.2, { color: '#ff8fb8', count: 30, speed: 5, life: 1 });
    this.audio.play('complete');
    this._playDialogue('boss_win', {
      onDone: () => {
        const L = this.level;
        L.goal = new Goal(this.scene, { x: L.boss.x, y: 0, label: 'Together' });
        this.ui.setBoss(null);
        this.ui.showToast('The way is open.');
      },
    });
  }
}
