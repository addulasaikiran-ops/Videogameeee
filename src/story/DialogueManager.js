import { SCENES } from './dialogue-data.js';

// Reusable dialogue playback. The UIManager renders; this owns the sequence.
export class DialogueManager {
  constructor(ui) {
    this.ui = ui;
    this.lines = [];
    this.index = 0;
    this.active = false;
    this.skippable = true;
    this.onDone = null;
  }

  // key: a SCENES key or an array of {who,text}; opts: {skippable, onDone}
  play(key, opts = {}) {
    const lines = Array.isArray(key) ? key : SCENES[key];
    if (!lines || !lines.length) { opts.onDone?.(); return; }
    this.lines = lines;
    this.index = 0;
    this.active = true;
    this.skippable = opts.skippable !== false;
    this.onDone = opts.onDone || null;
    this.ui.showDialogue(this.lines[this.index], { skippable: this.skippable, step: [this.index + 1, this.lines.length] });
  }

  next() {
    if (!this.active) return false;
    this.index += 1;
    if (this.index >= this.lines.length) { this.end(); return false; }
    this.ui.showDialogue(this.lines[this.index], { skippable: this.skippable, step: [this.index + 1, this.lines.length] });
    return true;
  }

  skip() { if (this.skippable) this.end(); }

  end() {
    if (!this.active) return;
    this.active = false;
    this.ui.hideDialogue();
    const cb = this.onDone; this.onDone = null;
    cb?.();
  }
}
