// Normalized input for keyboard + touch. Edge-triggered actions are queued as
// "presses" that the game consumes once per frame; holds are plain booleans.
const KEYMAP = {
  left: ['arrowleft', 'a'],
  right: ['arrowright', 'd'],
  jump: [' ', 'arrowup', 'w'],
  attack: ['j', 'x', 'k', 'z'],
  interact: ['e', 'enter'],
  pause: ['escape', 'p'],
};

export class InputManager {
  constructor() {
    this.held = { left: false, right: false, jump: false, attack: false, interact: false };
    this.presses = new Set();
    this.enabled = true;
    this._keys = new Set();
    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));
    window.addEventListener('blur', () => this.releaseAll());
  }

  _actionFor(key) {
    const k = key.toLowerCase();
    for (const [action, keys] of Object.entries(KEYMAP)) if (keys.includes(k)) return action;
    return null;
  }

  _onKey(e, down) {
    const action = this._actionFor(e.key);
    if (!action) return;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
    if (down) {
      if (this._keys.has(e.key.toLowerCase())) return; // ignore auto-repeat
      this._keys.add(e.key.toLowerCase());
      if (action === 'pause' || action === 'attack' || action === 'interact') this.presses.add(action);
      else if (action === 'jump') { this.held.jump = true; this.presses.add('jump'); }
      else this.held[action] = true;
    } else {
      this._keys.delete(e.key.toLowerCase());
      if (action === 'jump') this.held.jump = false;
      else if (action === 'left' || action === 'right') this.held[action] = false;
    }
  }

  // Called by TouchControls: press=true on pointerdown, false on release/cancel.
  setButton(action, pressed) {
    if (action === 'pause' || action === 'attack' || action === 'interact') {
      if (pressed) this.presses.add(action);
      return;
    }
    if (action === 'jump') {
      if (pressed && !this.held.jump) this.presses.add('jump');
      this.held.jump = pressed;
      return;
    }
    this.held[action] = pressed;
  }

  consume(action) {
    const had = this.presses.has(action);
    this.presses.delete(action);
    return had;
  }

  clearPresses() { this.presses.clear(); }

  releaseAll() {
    for (const k of Object.keys(this.held)) this.held[k] = false;
    this._keys.clear();
  }

  get moveX() { return (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0); }

  static get isTouchDevice() {
    return (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  }
}
