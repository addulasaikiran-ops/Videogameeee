import data from './dialogue.json';
export class DialogueSystem {
  constructor() { this.lines = data.lines || []; this.index = 0; }
  show(text) {
    const line = text || this.lines[this.index++ % Math.max(1, this.lines.length)] || 'The world is quiet and full of little things.';
    window.dispatchEvent(new CustomEvent('our-world-dialogue', { detail: { text: line } }));
  }
}
