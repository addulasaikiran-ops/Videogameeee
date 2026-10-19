// Bridge between the game engine and the React UI layer. Same public API the
// engine always called — now it writes to uiStore instead of building DOM.
// Game.js needs no changes.
import { uiSet, uiPatchHud, ui, uiGet } from '../store/uiStore.js';
import { ENDING_MESSAGE } from '../story/dialogue-data.js';

let toastId = 0, dlgId = 0, flashId = 0;

export class UIManager {
  constructor(app, handlers, save) {
    ui.handlers = handlers;
    ui.save = save;
    ui.bridge = this;
    this._inGame = false;
    const s = save?.data?.settings || {};
    document.body.classList.toggle('a11y-lg-text', s.textSize === 'large');
    document.body.classList.toggle('a11y-rm', !!s.reducedMotion);
    document.body.classList.toggle('a11y-hc', !!s.highContrast);
    window.addEventListener('resize', () => this.updateOrientationHint());
    window.addEventListener('offline', () => uiSet({ offline: true }));
    window.addEventListener('online', () => uiSet({ offline: false }));
    this.updateOrientationHint();
    // autosave indicator — every save() flash a tiny "saved" pill
    let savedTimer = 0;
    save.onWrite = () => {
      uiSet({ savedFlash: (uiGet().savedFlash || 0) + 1 });
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => uiSet({ savedFlash: 0 }), 1600);
    };
  }

  // ── screens ──
  showLoading() { uiSet({ screen: 'loading' }); }
  showMenu() {
    const d = ui.save?.data;
    uiSet({ screen: 'menu', pause: false, dlg: null, menuSave: d ? { unlocked: [...d.unlocked], completed: [...d.completed] } : null });
  }
  showLevels() {
    const d = ui.save.data;
    uiSet({ screen: 'levels', levelCards: { unlocked: [...d.unlocked], completed: [...d.completed] } });
  }
  showSettings(from) {
    const s = ui.save.data.settings;
    uiSet({ screen: 'settings', settingsFrom: from, settingsSnapshot: { ...s } });
  }
  backFromSettings() {
    const from = uiGet().settingsFrom;
    uiSet({ screen: from === 'pause' ? 'game' : 'menu', pause: from === 'pause' });
  }
  showCredits() { uiSet({ screen: 'credits' }); }
  showGame() { uiSet({ screen: 'game', pause: false, dlg: null }); }
  showPause() { uiSet({ pause: true }); }
  hidePause() { uiSet({ pause: false, screen: uiGet().screen === 'settings' ? 'game' : uiGet().screen }); }

  // ── HUD ──
  setHearts(n) { uiPatchHud({ hearts: n }); }
  setFragments(n, total) { uiPatchHud({ frags: n, fragsTotal: total }); }
  setHp(hp, max) { uiPatchHud({ hp, maxHp: max }); }
  showToast(text, ms = 2600) {
    const id = ++toastId;
    uiSet({ toast: { text, id } });
    setTimeout(() => { if (uiGet().toast?.id === id) uiSet({ toast: null }); }, ms);
  }
  setInteract(visible) { uiSet({ interact: visible }); }
  hurtFlash() { uiSet({ vignette: (uiGet().vignette || 0) + 1 }); }
  setBoss(frac) { uiSet({ boss: frac == null ? null : Math.max(0, frac) }); }

  // ── dialogue ──
  showDialogue(line, { skippable = true, step } = {}) {
    uiSet({ dlg: { line, skippable, step, id: ++dlgId } });
  }
  hideDialogue() { uiSet({ dlg: null }); }
  get dialogueOpen() { return uiGet().dlg != null; }

  // ── ceremony ──
  showLevelComplete({ name, hearts, fragments, stars }, onNext) {
    ui._completeNext = onNext;
    uiSet({ screen: 'complete', complete: { name, hearts, fragments, stars }, pause: false, dlg: null });
  }
  flashGameOver(text = 'A shadow caught you…') {
    const id = ++flashId;
    uiSet({ gameoverFlash: { text, id } });
    setTimeout(() => { if (uiGet().gameoverFlash?.id === id) uiSet({ gameoverFlash: null }); }, 1400);
  }
  showEnding() {
    uiSet({ screen: 'ending', endingMsg: ENDING_MESSAGE, pause: false, dlg: null });
  }

  // ── misc ──
  updateOrientationHint() {
    const portrait = window.innerHeight > window.innerWidth * 1.15;
    const small = Math.min(window.innerWidth, window.innerHeight) < 560;
    uiSet({ portraitSmall: portrait && small });
  }
  setInGame(v) { this._inGame = v; uiSet({ inGame: v }); }

  // called by React on unhandled boot errors
  static fatal(msg) { uiSet({ fatal: String(msg || 'Something went wrong') }); }
}
