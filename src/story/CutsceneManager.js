// Minimal cinematic sequencer: camera pans/zooms + dialogue steps.
// Steps: {cam:{x,y,dist,dur}} | {dialogue:key} | {wait:sec} | {do:fn}
export class CutsceneManager {
  constructor() {
    this.steps = [];
    this.i = 0;
    this.active = false;
    this.camTarget = null;
    this.onDone = null;
    this.waitT = 0;
  }

  play(steps, onDone) {
    this.steps = steps || [];
    this.i = 0;
    this.active = true;
    this.camTarget = null;
    this.waitT = 0;
    this.onDone = onDone || null;
    this._advance();
  }

  _advance() {
    if (this.i >= this.steps.length) { this.end(); return; }
    const s = this.steps[this.i++];
    if (s.cam) { this.camTarget = s.cam; this._advance(); }
    else if (s.wait) { this.waitT = s.wait; }
    else if (s.dialogue) { this._dialogue = { key: s.dialogue, played: false }; this._needDialogue = true; }
    else if (s.do) { s.do(); this._advance(); }
  }

  // Called by Game when a dialogue finishes.
  dialogueDone() {
    if (this._dialogue) { this._dialogue.played = true; }
    if (this.active && this._dialogue && this._dialogue.played) {
      this._dialogue = null;
      this._advance();
    }
  }

  get needsDialogue() { return !!this._dialogue; }
  get dialogueKey() { return this._dialogue?.key; }

  update(dt) {
    if (!this.active) return;
    if (this.waitT > 0) {
      this.waitT -= dt;
      if (this.waitT <= 0) this._advance();
    }
  }

  skip() {
    if (!this.active) return;
    this._dialogue = null;
    this.end();
  }

  end() {
    if (!this.active) return;
    this.active = false;
    const cb = this.onDone; this.onDone = null;
    cb?.();
  }
}
