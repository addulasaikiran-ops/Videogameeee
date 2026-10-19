// On-screen controls for phones. Buttons write into InputManager via
// input.setButton(action, pressed); everything releases reliably on
// pointerup / pointercancel / pointerleave / lost pointer capture.
import { InputManager } from '../core/InputManager.js';

export class TouchControls {
  constructor(app, input) {
    this.input = input;
    this.root = document.createElement('div');
    this.root.className = 'touch hidden';
    this.root.innerHTML = `
      <div class="tc-left">
        <button class="tc-btn" data-act="left" aria-label="Move left">◀</button>
        <button class="tc-btn" data-act="right" aria-label="Move right">▶</button>
      </div>
      <div class="tc-right">
        <button class="tc-btn interact hidden" data-act="interact" aria-label="Interact">✦</button>
        <button class="tc-btn atk" data-act="attack" aria-label="Heart pulse">♥</button>
        <button class="tc-btn jump" data-act="jump" aria-label="Jump">▲</button>
      </div>
      <button class="tc-btn tc-pause" data-act="pause" aria-label="Pause">II</button>`;
    app.append(this.root);
    for (const btn of this.root.querySelectorAll('.tc-btn')) this._bind(btn);
    window.addEventListener('contextmenu', (e) => { if (e.target.closest('.touch')) e.preventDefault(); });
    this.setVisible(InputManager.isTouchDevice);
  }

  _bind(btn) {
    const act = btn.dataset.act;
    const down = (e) => { e.preventDefault(); btn.classList.add('down'); btn.setPointerCapture?.(e.pointerId); this.input.setButton(act, true); };
    const up = (e) => { e.preventDefault(); btn.classList.remove('down'); this.input.setButton(act, false); };
    btn.addEventListener('pointerdown', down);
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btn.addEventListener(ev, up);
  }

  setVisible(v) { this.root.classList.toggle('hidden', !v); this.visible = v; }
  setInteract(visible) { this.root.querySelector('[data-act="interact"]').classList.toggle('hidden', !visible); }
}
