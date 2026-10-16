export class GameUI {
  constructor(app, handlers) {
    this.handlers = handlers;
    this.overlay = document.createElement('div'); this.overlay.className = 'overlay';
    this.overlay.innerHTML = '<section class="panel"><p>✦ a tiny adventure ✦</p><h1>Our Little World</h1><p>A small place for the memories that make a world feel like ours.</p><div class="buttons"><button data-new>New Game</button><button data-continue>Continue</button></div></section>';
    app.append(this.overlay);
    this.hint = document.createElement('div'); this.hint.className = 'hint hidden'; this.hint.textContent = 'Move with WASD or arrow keys · press E or tap Interact'; app.append(this.hint);
    this.dialogue = document.createElement('div'); this.dialogue.className = 'overlay hidden'; this.dialogue.innerHTML = '<section class="panel"><p data-line></p><div class="buttons"><button data-close>Okay</button></div></section>'; app.append(this.dialogue);
    this.memory = document.createElement('div'); this.memory.className = 'overlay hidden'; this.memory.innerHTML = '<section class="panel"><h2 data-title></h2><p data-text></p><img class="memory-photo hidden" alt="Memory photo"><div class="buttons"><button data-close>Close memory</button></div></section>'; app.append(this.memory);
    this.overlay.querySelector('[data-new]').addEventListener('click', handlers.onNewGame);
    this.overlay.querySelector('[data-continue]').addEventListener('click', handlers.onContinue);
    this.dialogue.querySelector('[data-close]').addEventListener('click', () => this.dialogue.classList.add('hidden'));
    this.memory.querySelector('[data-close]').addEventListener('click', () => this.memory.classList.add('hidden'));
    window.addEventListener('our-world-dialogue', (e) => { this.dialogue.querySelector('[data-line]').textContent = e.detail.text; this.dialogue.classList.remove('hidden'); });
    window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'e') handlers.onInteract(); });
    const controls = document.createElement('div'); controls.className = 'buttons'; controls.style.cssText = 'position:fixed;bottom:4.5rem;left:50%;transform:translateX(-50%);z-index:3'; controls.innerHTML = '<button data-dir="up">↑</button><button data-dir="left">←</button><button data-dir="down">↓</button><button data-dir="right">→</button><button data-interact>Interact</button>'; app.append(controls);
    const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
    controls.querySelectorAll('[data-dir]').forEach((b) => { const move = (e) => { e.preventDefault(); handlers.onMove(...dirs[b.dataset.dir]); }; const stop = () => handlers.onMove(0,0); b.addEventListener('pointerdown', move); ['pointerup','pointercancel','pointerleave'].forEach((n) => b.addEventListener(n,stop)); });
    controls.querySelector('[data-interact]').addEventListener('click', handlers.onInteract);
  }
  showGame() { this.overlay.classList.add('hidden'); this.hint.classList.remove('hidden'); }
  setInteractionAvailable(near) { this.hint.textContent = near ? 'Press E or tap Interact to open a memory' : 'Move with WASD or arrows · explore the little world'; }
  showMemory(memory) {
    this.memory.querySelector('[data-title]').textContent = memory.title; this.memory.querySelector('[data-text]').textContent = memory.text;
    const image = this.memory.querySelector('img');
    if (memory.photoUrl) { image.src = memory.photoUrl; image.classList.remove('hidden'); } else { image.removeAttribute('src'); image.classList.add('hidden'); }
    this.memory.classList.remove('hidden');
  }
}
