import React, { Component, useEffect, useState, lazy, Suspense } from 'react';
import { useUi, ui } from '../store/uiStore.js';
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
    const touch = () => ui.handlers && document.body.classList.add('touch-device');
    window.addEventListener('touchstart', touch, { once: true });
    return () => window.removeEventListener('touchstart', touch);
  }, []);
  return null;
}

export function App() {
  const s = useUi();
  useUiSounds();
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
      {s.inGame && s.portraitSmall && <RotateHint />}
      {s.offline && <div className="offline-pill">offline — everything still works</div>}
    </UiErrorBoundary>
  );
}
