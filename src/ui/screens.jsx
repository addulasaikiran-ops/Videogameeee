import React, { useEffect, useState } from 'react';
import { ui, uiSet } from '../store/uiStore.js';
import { LEVELS } from '../levels/level-data.js';

const h = () => ui.handlers || {};

/* ── Loading — self-drawing heart + progress + rotating tips ── */
const TIPS = [
  'Hearts mended count double — pick them up when hurt.',
  'Some memories hide where the path forks.',
  'A lantern lit is a promise kept — checkpoints save you.',
  'The quietest paths hold the deepest shadows.',
];
export function LoadingScreen() {
  const [pct, setPct] = useState(0);
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(92, p + 4 + Math.random() * 7)), 120);
    const r = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 2600);
    return () => { clearInterval(t); clearInterval(r); };
  }, []);
  return (
    <div className="screen loading-screen" role="status" aria-label="Loading">
      <div className="load-heart-wrap">
        <svg className="load-heart" viewBox="0 0 100 92" aria-hidden="true">
          <path d="M50 86 C18 62 4 44 4 27 C4 12 15 4 27 4 C37 4 45 10 50 20 C55 10 63 4 73 4 C85 4 96 12 96 27 C96 44 82 62 50 86 Z"
            fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
          <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e9c98d" /><stop offset="100%" stopColor="#d4669a" />
          </linearGradient></defs>
        </svg>
        <div className="load-bar"><div className="load-fill" style={{ width: `${pct}%` }} /></div>
        <p className="load-tip" aria-live="polite">{TIPS[tip]}</p>
      </div>
    </div>
  );
}

/* ── Title menu — staggered entrance + continue card ── */
export function TitleMenu({ save }) {
  const hasSave = save && (save.unlocked.length > 1 || save.completed.length > 0 || save.unlocked[0] !== 'firstLight');
  const resumeId = ui.save?.data?.lastLevel;
  const resumeName = hasSave && resumeId ? (h().levelName?.(resumeId) || resumeId) : null;
  const items = [
    hasSave
      ? { label: `Continue — ${resumeName || 'our journey'}`, act: () => h().onContinue?.(), cls: 'primary' }
      : { label: 'New Game', act: () => h().onNewGame?.(), cls: 'primary' },
    hasSave ? { label: 'New Game', act: () => h().onNewGame?.() } : null,
    { label: 'Chapters', act: () => ui.bridge.showLevels() },
    { label: 'Settings', act: () => ui.bridge.showSettings('menu') },
    { label: 'Credits', act: () => ui.bridge.showCredits() },
  ].filter(Boolean);
  return (
    <div className="screen" role="dialog" aria-label="Main menu">
      <nav className="panel menu-panel">
        <p className="tagline">✦ a tiny adventure ✦</p>
        <h1>Wake Him<br />With Love</h1>
        <p className="dim">A small journey across gardens, seas and shadows — for one heart worth waking.</p>
        <div className="col stagger">
          {items.map((it, i) => (
            <button key={it.label + i} className={it.cls || ''} style={{ animationDelay: `${0.12 + i * 0.08}s` }} onClick={it.act}>{it.label}</button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ── Chapter select — storybook cards, locked/unlocked/complete ── */
export function ChapterSelect({ cards }) {
  const order = Object.keys(LEVELS);
  return (
    <div className="screen" role="dialog" aria-label="Chapter select">
      <div className="panel chapters-panel">
        <h2>Chapters</h2>
        <div className="chapter-grid">
          {order.map((id, i) => {
            const open = cards?.unlocked.includes(id);
            const done = cards?.completed.includes(id);
            const collected = ui.save?.data?.collectibles?.[id]?.length || 0;
            return (
              <button key={id} className={`chapter-card ${open ? '' : 'locked'} ${done ? 'done' : ''}`}
                disabled={!open} aria-label={open ? `${LEVELS[id].name}${done ? ' — completed' : ''}` : `Chapter ${i + 1} — locked`}
                onClick={() => open && h().onPlayLevel?.(id)}>
                <span className="lvl-num" aria-hidden="true">{i + 1}</span>
                <span className="lvl-name">{open ? LEVELS[id].name : 'A chapter yet unwritten'}</span>
                <span className="lvl-meta">{done ? '✓ complete' : open ? (collected ? `♥ ${collected}` : '') : '✧ locked'}</span>
              </button>
            );
          })}
        </div>
        <div className="row"><button onClick={() => ui.bridge.showMenu()}>Back</button></div>
      </div>
    </div>
  );
}

/* ── Pause ── */
export function PauseMenu() {
  return (
    <div className="screen" role="dialog" aria-label="Paused">
      <div className="panel">
        <h2>Paused</h2>
        <div className="col">
          <button className="primary" onClick={() => h().onResume?.()}>Resume</button>
          <button onClick={() => ui.bridge.showSettings('pause')}>Settings</button>
          <button onClick={() => h().onRestartLevel?.()}>Restart level</button>
          <button onClick={() => h().onQuitToMenu?.()}>Quit to menu</button>
        </div>
      </div>
    </div>
  );
}

/* ── Settings — tabbed: Audio / Controls / Accessibility / Graphics ── */
export function Settings({ from, snap }) {
  const [tab, setTab] = useState('audio');
  const [armed, setArmed] = useState(false);
  const s = ui.save?.data?.settings || snap || {};
  const set = (k, v) => {
    h().onSetting?.(k, v);
    uiSet({ settingsSnapshot: { ...s, [k]: v } });
    document.body.classList.toggle('a11y-lg-text', (k === 'textSize' ? v : s.textSize) === 'large');
    document.body.classList.toggle('a11y-rm', !!(k === 'reducedMotion' ? v : s.reducedMotion));
    document.body.classList.toggle('a11y-hc', !!(k === 'highContrast' ? v : s.highContrast));
  };
  const tabs = [['audio', 'Audio'], ['controls', 'Controls'], ['access', 'Accessibility'], ['graphics', 'Graphics']];
  return (
    <div className="screen" role="dialog" aria-label="Settings">
      <div className="panel settings-panel">
        <h2>Settings</h2>
        <div className="tab-row" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {tab === 'audio' && (<>
          <label className="slider">Music <input type="range" min="0" max="1" step="0.05" value={s.music ?? 0.4} aria-label="Music volume" onChange={(e) => set('music', +e.target.value)} /></label>
          <label className="slider">Sound <input type="range" min="0" max="1" step="0.05" value={s.sfx ?? 0.8} aria-label="Sound effects volume" onChange={(e) => set('sfx', +e.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={!!s.muted} onChange={(e) => set('muted', e.target.checked)} /> Mute all</label>
        </>)}
        {tab === 'controls' && (
          <div className="controls-list dim">
            <p>←/→ or A/D — move · Space — jump (twice for double) · E — interact · F — attack · Esc — pause</p>
            <p>Touch: left pad moves, right pad jumps &amp; interacts.</p>
          </div>
        )}
        {tab === 'access' && (<>
          <label className="slider">Text size
            <select value={s.textSize || 'normal'} aria-label="Text size" onChange={(e) => set('textSize', e.target.value)}>
              <option value="normal">Normal</option><option value="large">Large</option>
            </select></label>
          <label className="check"><input type="checkbox" checked={!!s.reducedMotion} onChange={(e) => set('reducedMotion', e.target.checked)} /> Reduce motion</label>
          <label className="check"><input type="checkbox" checked={!!s.highContrast} onChange={(e) => set('highContrast', e.target.checked)} /> High contrast</label>
        </>)}
        {tab === 'graphics' && (
          <label className="slider">Quality
            <select value={s.quality || 'auto'} aria-label="Graphics quality" onChange={(e) => set('quality', e.target.value)}>
              <option value="auto">Auto</option><option value="high">High</option><option value="low">Low</option>
            </select></label>
        )}
        <div className="row">
          <button className={`danger ${armed ? 'armed' : ''}`} onClick={() => {
            if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3500); }
            else h().onResetProgress?.();
          }}>{armed ? 'Tap again to erase everything' : 'Reset progress'}</button>
          <button onClick={() => ui.bridge.backFromSettings()}>Back</button>
        </div>
      </div>
    </div>
  );
}
