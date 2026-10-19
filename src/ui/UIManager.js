// Builds and owns every screen/overlay. All buttons do real work through the
// `handlers` map provided by Game — no decorative controls.
import { CREDITS, ENDING_MESSAGE } from '../story/dialogue-data.js';

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function button(label, onClick, cls = '') {
  const b = el('button', cls, label);
  b.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
  return b;
}

export class UIManager {
  constructor(app, handlers, save) {
    this.app = app;
    this.h = handlers;
    this.save = save;
    this._build();
  }

  _build() {
    // ── Loading ──
    this.loading = el('div', 'screen', `<div class="heart-pulse"></div><p class="dim">loading a little world…</p>`);
    // ── Main menu ──
    this.menu = el('div', 'screen hidden');
    this.menuPanel = el('div', 'panel menu-panel');
    this.menuPanel.setAttribute('role', 'dialog');
    this.menuPanel.setAttribute('aria-label', 'Main menu');
    this.menu.append(this.menuPanel);
    // ── Level select ──
    this.levels = el('div', 'screen hidden');
    this.levels.append(el('div', 'panel', `<h2>Chapters</h2><div class="level-list" data-level-list></div><div class="row"><button data-back>Back</button></div>`));
    this.levels.firstElementChild.setAttribute('role', 'dialog');
    this.levels.firstElementChild.setAttribute('aria-label', 'Chapter select');
    // ── Settings ──
    this.settings = el('div', 'screen hidden');
    this.settings.append(el('div', 'panel', `
      <h2>Settings</h2>
      <label class="slider">Music <input data-music type="range" min="0" max="1" step="0.05" aria-label="Music volume"></label>
      <label class="slider">Sound <input data-sfx type="range" min="0" max="1" step="0.05" aria-label="Sound effects volume"></label>
      <label class="check"><input data-mute type="checkbox"> Mute all</label>
      <label class="slider">Quality
        <select data-quality aria-label="Graphics quality"><option value="auto">Auto</option><option value="high">High</option><option value="low">Low</option></select>
      </label>
      <div class="row"><button data-reset class="danger">Reset progress</button></div>
      <div class="row"><button data-back>Back</button></div>`));
    this.settings.firstElementChild.setAttribute('role', 'dialog');
    this.settings.firstElementChild.setAttribute('aria-label', 'Settings');
    // ── Credits ──
    this.credits = el('div', 'screen hidden');
    this.credits.append(el('div', 'panel credits', `<h2>Credits</h2><p>${CREDITS.join('<br>')}</p><div class="row"><button data-back>Back</button></div>`));
    this.credits.firstElementChild.setAttribute('role', 'dialog');
    this.credits.firstElementChild.setAttribute('aria-label', 'Credits');
    // ── HUD ──
    this.hud = el('div', 'hud hidden');
    this.hud.innerHTML = `
      <div class="hud-left" aria-live="polite">
        <span class="chip" data-hearts aria-label="hearts collected">♥ 0</span>
        <span class="chip frag" data-frags aria-label="memory fragments">◆ 0</span>
        <span class="chip" data-hp aria-label="health"></span>
      </div>
      <div class="boss-bar hidden" data-bosswrap role="progressbar" aria-label="Boss health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span class="boss-name">Doubtwarden</span><div class="bar"><div class="fill" data-bossfill></div></div></div>`;
    this.toast = el('div', 'toast hidden');
    this.toast.setAttribute('role', 'status');
    this.toast.setAttribute('aria-live', 'polite');
    this.interactHint = el('div', 'interact-hint hidden', `press <b>E</b> · tap ✦`);
    // ── Dialogue ──
    this.dlg = el('div', 'dialogue hidden');
    this.dlg.innerHTML = `<div class="dlg-box" role="dialog" aria-live="polite"><div class="dlg-who" data-who></div><p data-text></p><div class="dlg-controls"><button data-next>Next ▸</button><button data-skip class="ghost">Skip</button></div></div>`;
    // ── Pause ──
    this.pause = el('div', 'screen hidden');
    this.pause.append(el('div', 'panel', `<h2>Paused</h2><div class="col"><button data-resume>Resume</button><button data-settings>Settings</button><button data-restart>Restart level</button><button data-quit>Quit to menu</button></div>`));
    this.pause.firstElementChild.setAttribute('role', 'dialog');
    this.pause.firstElementChild.setAttribute('aria-label', 'Paused');
    // ── Level complete ──
    this.complete = el('div', 'screen hidden');
    // ── Game over flash ──
    this.gameover = el('div', 'screen hidden dark');
    this.gameover.setAttribute('role', 'alert');
    // ── Ending ──
    this.ending = el('div', 'screen hidden');
    this.ending.append(el('div', 'panel ending-panel', `<div class="big-heart" aria-hidden="true">♥</div><h2>Together in Our Little World</h2><p class="ending-msg"></p><div class="row"><button data-credits>Credits</button><button data-menu>Main menu</button></div>`));
    this.ending.firstElementChild.setAttribute('role', 'dialog');
    this.ending.firstElementChild.setAttribute('aria-label', 'Ending');
    // ── Orientation hint ──
    this.rotate = el('div', 'rotate-hint hidden', `<div>⟳<br>This story reads best sideways —<br>rotate your phone to landscape.</div>`);

    for (const s of [this.loading, this.menu, this.levels, this.settings, this.credits, this.hud, this.toast, this.interactHint, this.dlg, this.pause, this.complete, this.gameover, this.ending, this.rotate]) this.app.append(s);

    // UI sound delegation: hover (mouse only), press, confirm on primary buttons
    this.app.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'mouse' && e.target.closest('button')) this.h.onUiSfx?.('uiHover');
    });
    this.app.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) this.h.onUiSfx?.('uiPress');
    });
    this.app.addEventListener('click', (e) => {
      if (e.target.closest('button.primary')) this.h.onUiSfx?.('uiConfirm');
    });

    // wire buttons
    this.levels.querySelector('[data-back]').addEventListener('click', () => this.showMenu());
    this.settings.querySelector('[data-back]').addEventListener('click', () => this._backFromSettings());
    this.credits.querySelector('[data-back]').addEventListener('click', () => this.showMenu());
    this.pause.querySelector('[data-resume]').addEventListener('click', () => this.h.onResume());
    this.pause.querySelector('[data-settings]').addEventListener('click', () => this.showSettings('pause'));
    this.pause.querySelector('[data-restart]').addEventListener('click', () => this.h.onRestartLevel());
    this.pause.querySelector('[data-quit]').addEventListener('click', () => this.h.onQuitToMenu());
    this.ending.querySelector('[data-credits]').addEventListener('click', () => { this.hideAll(); this.credits.classList.remove('hidden'); });
    this.ending.querySelector('[data-menu]').addEventListener('click', () => this.h.onQuitToMenu());
    this.dlg.querySelector('[data-next]').addEventListener('click', () => this.h.onDialogueNext());
    this.dlg.querySelector('[data-skip]').addEventListener('click', () => this.h.onDialogueSkip());
    this.settings.querySelector('[data-reset]').addEventListener('click', () => this._confirmReset());

    const s = this.save.data.settings;
    const q = (sel) => this.settings.querySelector(sel);
    q('[data-music]').value = s.music; q('[data-sfx]').value = s.sfx;
    q('[data-mute]').checked = s.muted; q('[data-quality]').value = s.quality;
    q('[data-music]').addEventListener('input', (e) => this.h.onSetting('music', +e.target.value));
    q('[data-sfx]').addEventListener('input', (e) => this.h.onSetting('sfx', +e.target.value));
    q('[data-mute]').addEventListener('change', (e) => this.h.onSetting('muted', e.target.checked));
    q('[data-quality]').addEventListener('change', (e) => this.h.onSetting('quality', e.target.value));
  }

  // ── screens ──
  hideAll() { for (const s of this.app.querySelectorAll('.screen, .hud, .dialogue, .toast, .interact-hint')) s.classList.add('hidden'); }
  showLoading() { this.hideAll(); this.loading.classList.remove('hidden'); }

  showMenu() {
    this.hideAll();
    this.menuPanel.innerHTML = '';
    this.menuPanel.append(el('p', 'tagline', '✦ a tiny adventure ✦'));
    this.menuPanel.append(el('h1', '', 'Wake Him<br>With Love'));
    this.menuPanel.append(el('p', 'dim', 'A small journey across gardens, seas and shadows — for one heart worth waking.'));
    const col = el('div', 'col');
    if (this.save.hasProgress) col.append(button('Continue', () => this.h.onContinue(), 'primary'));
    col.append(button('New Game', () => this.h.onNewGame(), this.save.hasProgress ? '' : 'primary'));
    if (this.save.data.unlocked.length > 1) col.append(button('Chapters', () => this.showLevels()));
    col.append(button('Settings', () => this.showSettings('menu')));
    col.append(button('Credits', () => { this.hideAll(); this.credits.classList.remove('hidden'); }));
    this.menuPanel.append(col);
    this.menu.classList.remove('hidden');
  }

  showLevels() {
    this.hideAll();
    const list = this.levels.querySelector('[data-level-list]');
    list.innerHTML = '';
    this.save.data.unlocked.forEach((id, i) => {
      const name = this.h.levelName?.(id) || id;
      const done = this.save.data.completed.includes(id);
      const b = button(`<span class="lvl-num" aria-hidden="true">${i + 1}</span><span>${name}</span>${done ? '<span class="lvl-done" aria-label="completed">✓</span>' : ''}`, () => this.h.onPlayLevel(id), 'level-btn');
      if (done) b.setAttribute('aria-label', `${name} — completed`);
      list.append(b);
    });
    this.levels.classList.remove('hidden');
  }

  showSettings(from) {
    this._settingsFrom = from;
    this.settings.classList.remove('hidden');
  }
  _backFromSettings() {
    this.settings.classList.add('hidden');
    if (this._settingsFrom === 'pause') this.pause.classList.remove('hidden');
    else this.showMenu();
  }

  _confirmReset() {
    if (this._confirming) return;
    this._confirming = true;
    const btn = this.settings.querySelector('[data-reset]');
    btn.textContent = 'Tap again to erase everything';
    btn.classList.add('armed');
    setTimeout(() => { btn.textContent = 'Reset progress'; btn.classList.remove('armed'); this._confirming = false; }, 3500);
    this._confirmTimer = setTimeout(() => {}, 0);
    btn.addEventListener('click', () => this.h.onResetProgress(), { once: true });
  }

  showGame() { this.hideAll(); this.hud.classList.remove('hidden'); }

  showPause() { this.pause.classList.remove('hidden'); }
  hidePause() { this.pause.classList.add('hidden'); this.settings.classList.add('hidden'); }

  // ── HUD ──
  setHearts(n) { this.hud.querySelector('[data-hearts]').textContent = `♥ ${n}`; }
  setFragments(n, total) { this.hud.querySelector('[data-frags]').textContent = `◆ ${n}${total ? '/' + total : ''}`; }
  setHp(hp, max) { this.hud.querySelector('[data-hp]').textContent = '♥'.repeat(Math.max(0, hp)) + '♡'.repeat(Math.max(0, max - hp)); }
  showToast(text, ms = 2600) {
    this.toast.textContent = text;
    this.toast.classList.remove('hidden');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.toast.classList.add('hidden'), ms);
  }
  setInteract(visible) { this.interactHint.classList.toggle('hidden', !visible); }
  setBoss(frac) {
    const w = this.hud.querySelector('[data-bosswrap]');
    if (frac == null) { w.classList.add('hidden'); return; }
    w.classList.remove('hidden');
    this.hud.querySelector('[data-bossfill]').style.width = `${Math.max(0, frac * 100)}%`;
    w.setAttribute('aria-valuenow', String(Math.round(Math.max(0, frac * 100))));
  }

  // ── dialogue ──
  showDialogue(line, { skippable = true, step } = {}) {
    this.dlg.classList.remove('hidden');
    this.dlg.querySelector('[data-who]').textContent = line.who || '';
    this.dlg.querySelector('[data-text]').textContent = line.text;
    this.dlg.querySelector('[data-skip]').style.display = skippable ? '' : 'none';
    this.dlg.querySelector('[data-next]').textContent = step && step[0] === step[1] ? 'Done' : 'Next ▸';
  }
  hideDialogue() { this.dlg.classList.add('hidden'); }
  get dialogueOpen() { return !this.dlg.classList.contains('hidden'); }

  // ── level complete / game over / ending ──
  showLevelComplete({ name, hearts, fragments, stars }, onNext) {
    this.hideAll();
    this.complete.innerHTML = '';
    const p = el('div', 'panel');
    p.append(el('h2', '', 'Chapter complete'));
    p.append(el('p', 'dim', name));
    p.append(el('p', '', `♥ ${hearts} hearts · ◆ ${fragments} memories${stars ? ` · ★ ${stars} keepsakes` : ''}`));
    const row = el('div', 'row');
    row.append(button('Continue ▸', onNext, 'primary'));
    p.append(row);
    this.complete.append(p);
    this.complete.classList.remove('hidden');
  }

  flashGameOver(text = 'A shadow caught you…') {
    this.gameover.innerHTML = `<div class="panel dark-panel"><h2>${text}</h2><p class="dim">returning to the last lantern…</p></div>`;
    this.gameover.classList.remove('hidden');
    setTimeout(() => this.gameover.classList.add('hidden'), 1400);
  }

  showEnding() {
    this.hideAll();
    this.ending.querySelector('.ending-msg').textContent = ENDING_MESSAGE;
    this.ending.classList.remove('hidden');
  }

  updateOrientationHint() {
    const portrait = window.innerHeight > window.innerWidth * 1.15;
    const small = Math.min(window.innerWidth, window.innerHeight) < 560;
    this.rotate.classList.toggle('hidden', !(portrait && small && this._inGame));
  }
  setInGame(v) { this._inGame = v; this.updateOrientationHint(); }
}
