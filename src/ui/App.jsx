import React, { Component, useEffect, useState, lazy, Suspense } from 'react';
import { useUi, ui, uiSet } from '../store/uiStore.js';
import { LoadingScreen, TitleMenu, ChapterSelect, PauseMenu, Settings } from './screens.jsx';
import { Hud, Toast, InteractHint, DialogueBox, GameOverFlash, RotateHint } from './hud.jsx';
import { ChapterComplete, Ending, ErrorScreen } from './ceremony.jsx';

const Credits = lazy(() => import('./credits.jsx'));

class UiErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) return <ErrorScreen message="The storybook stuttered — reload to keep playing." />;
    return this.props.children;
  }
}

// Global button sfx: hover tick (mouse only), press thock, confirm chime.
function useUiSounds() {
  useEffect(() => {
    const over = (e) => { if (e.pointerType === 'mouse' && e.target.closest('button')) ui.handlers?.onUiSfx?.('uiHover'); };
    const down = (e) => { if (e.target.closest('button')) ui.handlers?.onUiSfx?.('uiPress'); };
    const click = (e) => { if (e.target.closest('button.primary')) ui.handlers?.onUiSfx?.('uiConfirm'); };
    window.addEventListener('pointerover', over);
    window.addEventListener('pointerdown', down);
    window.addEventListener('click', click);
    return () => { window.removeEventListener('pointerover', over); window.removeEventListener('pointerdown', down); window.removeEventListener('click', click); };
  }, []);
}

function InputDeviceWatcher() {
  useEffect(() => {
    const touch = () => { document.body.classList.add('touch-device'); uiSet({ inputDevice: 'touch' }); };
    const keys = () => uiSet({ inputDevice: 'keyboard' });
    const pad = () => uiSet({ inputDevice: 'gamepad' });
    window.addEventListener('touchstart', touch);
    window.addEventListener('keydown', keys);
    window.addEventListener('gamepadconnected', pad);
    return () => { window.removeEventListener('touchstart', touch); window.removeEventListener('keydown', keys); window.removeEventListener('gamepadconnected', pad); };
  }, []);
  return null;
}

// Keyboard + gamepad navigation for menu screens: arrows move focus,
// Enter/Space/A-button activates, Escape/B goes Back. When a menu is open
// we focus the primary action once and keep focus inside the UI root.
const FOCUSABLE = '#ui-root button:not(:disabled), #ui-root input, #ui-root select, #ui-root [tabindex]';
function useMenuNav(active) {
  useEffect(() => {
    if (!active) return;
    const items = () => [...document.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    const move = (dir) => {
      const list = items();
      if (!list.length) return;
      const i = list.indexOf(document.activeElement);
      const next = list[i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length];
      next.focus();
    };
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { move(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
      else if (e.key === 'Escape') { document.querySelector('#ui-root button.ghost, #ui-root .text-button')?.click(); }
      // focus trap: keep Tab inside the ui root while a menu is open
      else if (e.key === 'Tab') {
        const list = items();
        if (list.length && !list.includes(document.activeElement)) { list[0].focus(); e.preventDefault(); }
        else if (list.length) {
          const i = list.indexOf(document.activeElement);
          if (e.shiftKey && i === 0) { list[list.length - 1].focus(); e.preventDefault(); }
          else if (!e.shiftKey && i === list.length - 1) { list[0].focus(); e.preventDefault(); }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    // land initial focus on the primary action (or first item)
    const t = setTimeout(() => { if (!items().includes(document.activeElement)) (document.querySelector('#ui-root button.primary') || items()[0])?.focus(); }, 60);

    // gamepad: poll at ~15Hz; dpad/left-stick Y navigates, A selects, B goes back
    let raf, last = 0, axes = [0, 0], prev = {};
    const poll = (now) => {
      raf = requestAnimationFrame(poll);
      if (now - last < 66) return;
      last = now;
      const gp = navigator.getGamepads?.().find(Boolean);
      if (!gp) return;
      const press = (n) => { const v = gp.buttons[n]?.pressed; const was = prev[n]; prev[n] = v; return v && !was; };
      if (press(12)) move(-1);            // dpad up
      if (press(13)) move(1);             // dpad down
      if (press(14)) move(-1);            // dpad left
      if (press(15)) move(1);             // dpad right
      if (press(0)) document.activeElement?.click();          // A
      if (press(1)) document.querySelector('#ui-root button.ghost, #ui-root .text-button')?.click(); // B
      const y = gp.axes[1] || 0;
      if (Math.abs(y) > 0.6 && Math.abs(axes[1]) <= 0.6) move(y > 0 ? 1 : -1);
      axes[1] = y;
    };
    raf = requestAnimationFrame(poll);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); cancelAnimationFrame(raf); };
  }, [active]);
}

export function App() {
  const s = useUi();
  useUiSounds();
  const menuOpen = s.screen !== 'game' || s.pause || !!s.dlg;
  useMenuNav(menuOpen && !s.dlg);
  if (s.fatal) return <ErrorScreen message={s.fatal} />;
  return (
    <UiErrorBoundary>
      <InputDeviceWatcher />
      {s.screen === 'loading' && <LoadingScreen />}
      {s.screen === 'menu' && <TitleMenu save={s.menuSave} />}
      {s.screen === 'levels' && <ChapterSelect cards={s.levelCards} />}
      {s.screen === 'settings' && <Settings from={s.settingsFrom} snap={s.settingsSnapshot} />}
      {s.screen === 'credits' && <Suspense fallback={null}><Credits /></Suspense>}
      {s.screen === 'complete' && <ChapterComplete data={s.complete} />}
      {s.screen === 'ending' && <Ending msg={s.endingMsg} />}
      {(s.screen === 'game' || s.pause) && <Hud hud={s.hud} boss={s.boss} />}
      {s.pause && s.screen !== 'settings' && <PauseMenu />}
      <Toast toast={s.toast} />
      {s.inGame && s.screen === 'game' && !s.dlg && <InteractHint visible={s.interact} />}
      {s.dlg && <DialogueBox dlg={s.dlg} />}
      {s.gameoverFlash && <GameOverFlash text={s.gameoverFlash.text} />}
      {s.vignette > 0 && <div key={s.vignette} className="vignette" aria-hidden="true" />}
      {s.inGame && s.portraitSmall && <RotateHint />}
      {s.savedFlash > 0 && <div key={s.savedFlash} className="saved-pill" role="status">✦ saved</div>}
      {s.offline && <div className="offline-pill">offline — everything still works</div>}
    </UiErrorBoundary>
  );
}
