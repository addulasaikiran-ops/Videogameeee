// Tiny external store bridging the engine and React. The engine only ever
// calls UIManager methods (which write here); React only reads via
// useSyncExternalStore. Neither blocks the other.
import { useSyncExternalStore } from 'react';

const listeners = new Set();
let state = {
  screen: 'loading',        // loading | menu | levels | settings | credits | game | complete | ending
  savedFlash: 0,
  veil: 0,                  // incremented on each level start — plays the transition wipe
  settingsFrom: 'menu',
  pause: false,
  gameoverFlash: null,      // { text, id }
  loadPct: 0,
  hud: { hearts: 0, frags: 0, fragsTotal: 0, hp: 0, maxHp: 0 },
  boss: null,               // 0..1 frac or null
  toast: null,              // { text, id }
  interact: false,
  dlg: null,                // { line, skippable, step, id }
  complete: null,           // { name, hearts, fragments, stars }
  endingMsg: '',
  inGame: false,
  portraitSmall: false,
  fatal: null,
  offline: false,
  inputDevice: 'keyboard',  // keyboard | gamepad | touch (kept coarse for hints)
};

export function uiSet(patch) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
}
export function uiPatchHud(patch) { uiSet({ hud: { ...state.hud, ...patch } }); }
export function uiGet() { return state; }
export function uiSub(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function useUi() { return useSyncExternalStore(uiSub, uiGet); }

// Filled in by the UIManager bridge constructor — React components call these
// for every user action. Gameplay never imports React.
export const ui = { handlers: null, save: null };
