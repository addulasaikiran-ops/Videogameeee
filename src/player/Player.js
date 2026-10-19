import * as THREE from 'three';
import { resolvePlayerCollisions } from '../gameplay/CollisionSystem.js';

export const PHYS = {
  speed: 6.8,
  accel: 60,
  airControl: 0.72,
  gravity: 42,
  jumpVelocity: 14.5,
  jumpCut: 0.45,        // release jump early → shorter hop
  coyoteTime: 0.12,
  jumpBuffer: 0.14,
  doubleJump: true,
  maxFall: 26,
  hurtKnockback: 6.5,
  invincibleTime: 1.1,
  attackRange: 1.35,
  attackTime: 0.22,
  attackCooldown: 0.5,
};

export const PlayerState = {
  IDLE: 'idle', RUN: 'run', JUMP: 'jump', FALL: 'fall', LAND: 'land',
  HURT: 'hurt', DEAD: 'dead', ATTACK: 'attack', INTERACT: 'interact',
};

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.width = 0.62;
    this.height = 1.3;
    this.position = new THREE.Vector3(); // bottom-center of the character
    this.prevY = 0;
    this.velocity = new THREE.Vector2();
    this.facing = 1;
    this.state = PlayerState.IDLE;
    this.grounded = false;
    this.groundPlatform = null;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumpsUsed = 0;
    this.hp = 3;
    this.maxHp = 3;
    this.invincible = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.hurtTimer = 0;
    this.dead = false;
    this.spawn = new THREE.Vector3();
    this.onEvent = null; // (name) => {} wired by Game for sfx/effects
    this._buildMesh();
  }

  _buildMesh() {
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.55, 6, 12),
      new THREE.MeshStandardMaterial({ color: '#e98aa8', roughness: 0.7 })
    );
    body.position.y = 0.62;
    body.castShadow = true;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 18, 14),
      new THREE.MeshStandardMaterial({ color: '#ffe3d6', roughness: 0.8 })
    );
    head.position.y = 1.14;
    head.castShadow = true;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#4c3a46' }));
    const eyeR = eyeL.clone();
    eyeL.position.set(0.09, 1.18, 0.22); eyeR.position.set(-0.09, 1.18, 0.22);
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.07, 8, 18),
      new THREE.MeshStandardMaterial({ color: '#b6436e', roughness: 0.8 })
    );
    scarf.position.y = 0.92; scarf.rotation.x = Math.PI / 2;
    const heart = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#ff5d8f', emissive: '#ff5d8f', emissiveIntensity: 0.9 })
    );
    heart.position.set(0, 0.66, 0.27); heart.scale.set(1, 0.9, 0.6);
    this.heartMesh = heart;
    this.mesh.add(body, head, eyeL, eyeR, scarf, heart);

    // Heart-pulse attack ring (hidden until used)
    this.attackMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.08, 10, 28),
      new THREE.MeshBasicMaterial({ color: '#ff9ec4', transparent: true, opacity: 0 })
    );
    this.attackMesh.rotation.y = Math.PI / 2;
    this.attackMesh.position.y = 0.7;
    this.mesh.add(this.attackMesh);
    this.scene.add(this.mesh);
  }

  setSpawn(x, y) { this.spawn.set(x, y, 0); this.respawn(false); }
  setPosition(x, y) { this.position.set(x, y, 0); this.prevY = y; this.mesh.position.copy(this.position); }

  respawn(refill = true) {
    this.position.copy(this.spawn);
    this.prevY = this.spawn.y;
    this.velocity.set(0, 0);
    this.dead = false;
    this.state = PlayerState.IDLE;
    if (refill) this.hp = this.maxHp;
    this.invincible = 1.2;
    this.jumpsUsed = 0;
    this.mesh.visible = true;
  }

  hurt(fromX) {
    if (this.invincible > 0 || this.dead) return false;
    this.hp -= 1;
    this.invincible = PHYS.invincibleTime;
    this.hurtTimer = 0.28;
    this.velocity.x = (this.position.x < fromX ? -1 : 1) * PHYS.hurtKnockback;
    this.velocity.y = 7;
    this.grounded = false;
    this.state = PlayerState.HURT;
    this.onEvent?.('hurt');
    if (this.hp <= 0) { this.dead = true; this.state = PlayerState.DEAD; this.onEvent?.('death'); }
    return true;
  }

  heal(n = 1) { this.hp = Math.min(this.maxHp, this.hp + n); }

  tryAttack() {
    if (this.attackCooldown > 0 || this.dead || this.state === PlayerState.HURT) return false;
    this.attackTimer = PHYS.attackTime;
    this.attackCooldown = PHYS.attackCooldown;
    this.velocity.x += this.facing * 2.2;
    this.onEvent?.('attack');
    return true;
  }

  get attackActive() { return this.attackTimer > 0; }
  attackAabb() {
    const r = PHYS.attackRange;
    const cx = this.position.x + this.facing * 0.7;
    const cy = this.position.y + 0.7;
    return { minX: cx - r / 2, maxX: cx + r / 2, bottomY: cy - r / 2, topY: cy + r / 2 };
  }

  aabb() {
    return { minX: this.position.x - this.width / 2, maxX: this.position.x + this.width / 2, bottomY: this.position.y, topY: this.position.y + this.height };
  }

  update(dt, input, platforms) {
    if (this.dead) { this._animate(dt); return; }
    this.prevY = this.position.y;

    // timers
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.invincible = Math.max(0, this.invincible - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);

    if (input.consume('jump')) this.jumpBuffer = PHYS.jumpBuffer;

    const stunned = this.state === PlayerState.HURT && this.hurtTimer > 0;
    const moveX = stunned ? 0 : input.moveX;

    // horizontal
    const target = moveX * PHYS.speed;
    const accel = (this.grounded ? 1 : PHYS.airControl) * PHYS.accel;
    this.velocity.x += Math.sign(target - this.velocity.x) * Math.min(Math.abs(target - this.velocity.x), accel * dt);
    if (moveX !== 0) this.facing = moveX;

    // jumping
    if (this.jumpBuffer > 0 && !stunned) {
      if (this.grounded || this.coyote > 0) {
        this.velocity.y = PHYS.jumpVelocity;
        this.grounded = false; this.coyote = 0; this.jumpBuffer = 0; this.jumpsUsed = 1;
        this.onEvent?.('jump');
      } else if (PHYS.doubleJump && this.jumpsUsed === 1) {
        this.velocity.y = PHYS.jumpVelocity * 0.92;
        this.jumpBuffer = 0; this.jumpsUsed = 2;
        this.onEvent?.('doubleJump');
      }
    }
    if (!input.held.jump && this.velocity.y > 0) this.velocity.y -= this.velocity.y * PHYS.jumpCut * dt * 4;

    // gravity
    this.velocity.y = Math.max(-PHYS.maxFall, this.velocity.y - PHYS.gravity * dt);

    // integrate + collide
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    const wasGrounded = this.grounded;
    const { grounded, groundPlatform } = resolvePlayerCollisions(this, platforms, dt);
    if (grounded && !wasGrounded && this.velocity.y === 0) this.onEvent?.('land');
    this.grounded = grounded;
    this.groundPlatform = groundPlatform;
    if (grounded) {
      this.coyote = PHYS.coyoteTime;
      this.jumpsUsed = 0;
      // ride moving platforms
      if (groundPlatform?.deltaX) { this.position.x += groundPlatform.deltaX; }
      if (groundPlatform?.deltaY) { this.position.y += groundPlatform.deltaY; }
    }

    // state
    if (this.dead) this.state = PlayerState.DEAD;
    else if (stunned) this.state = PlayerState.HURT;
    else if (this.attackTimer > 0) this.state = PlayerState.ATTACK;
    else if (!this.grounded) this.state = this.velocity.y > 0.5 ? PlayerState.JUMP : PlayerState.FALL;
    else if (Math.abs(this.velocity.x) > 0.4) this.state = PlayerState.RUN;
    else this.state = PlayerState.IDLE;

    this._animate(dt);
  }

  _animate(dt) {
    const m = this.mesh;
    m.position.copy(this.position);
    // facing flip
    m.rotation.y += ((this.facing > 0 ? 0.35 : Math.PI - 0.35) - m.rotation.y) * Math.min(1, dt * 14);
    // squash & stretch
    let sx = 1, sy = 1;
    if (this.state === PlayerState.RUN) { sy = 1 + Math.sin(performance.now() * 0.018) * 0.05; sx = 2 - sy; }
    else if (this.state === PlayerState.JUMP) { sy = 1.1; sx = 0.92; }
    else if (this.state === PlayerState.FALL) { sy = 0.95; sx = 1.05; }
    m.scale.set(sx, sy, 1);
    // invincibility blink
    m.visible = this.invincible <= 0 || Math.floor(performance.now() / 90) % 2 === 0;
    // heart pulse attack ring
    if (this.attackTimer > 0) {
      const t = 1 - this.attackTimer / PHYS.attackTime;
      this.attackMesh.material.opacity = 0.85 * (1 - t);
      const s = 0.4 + t * (PHYS.attackRange * 2.2);
      this.attackMesh.scale.set(s, s, s);
      this.attackMesh.position.x = this.facing * 0.6;
    } else this.attackMesh.material.opacity = 0;
    // idle heartbeat
    this.heartMesh.scale.setScalar(1 + Math.sin(performance.now() * 0.004) * 0.12);
  }
}
