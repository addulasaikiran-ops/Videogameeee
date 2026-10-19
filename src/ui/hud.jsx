import React, { useEffect, useRef, useState } from 'react';
import { ui } from '../store/uiStore.js';

const h = () => ui.handlers || {};

/* ── HUD — chips + SVG heart meter + boss bar ── */
const Heart = ({ full }) => (
  <svg viewBox="0 0 20 18" className={`hp-heart ${full ? 'full' : 'empty'}`} aria-hidden="true">
    <path d="M10 17 C4 12 1 8.5 1 5.5 C1 2.5 3.2 1 5.5 1 C7.4 1 9 2.2 10 4 C11 2.2 12.6 1 14.5 1 C16.8 1 19 2.5 19 5.5 C19 8.5 16 12 10 17 Z" />
  </svg>
);

export function Hud({ hud, boss }) {
  const [pop, setPop] = useState(null);
  const prev = useRef(hud);
  useEffect(() => {
    if (hud.hearts > prev.current.hearts) { setPop('hearts'); }
    if (hud.frags > prev.current.frags) { setPop('frags'); }
    prev.current = hud;
    if (pop) { const t = setTimeout(() => setPop(null), 500); return () => clearTimeout(t); }
  }, [hud]);
  return (
    <div className="hud" aria-live="polite">
      <div className="hud-left">
        <span className={`chip ${pop === 'hearts' ? 'pop' : ''}`} aria-label="hearts collected">♥ {hud.hearts}</span>
        <span className={`chip frag ${pop === 'frags' ? 'pop' : ''}`} aria-label="memory fragments">◆ {hud.frags}{hud.fragsTotal ? `/${hud.fragsTotal}` : ''}</span>
        <span className="chip hp-chip" aria-label={`health ${hud.hp} of ${hud.maxHp}`}>
          {Array.from({ length: hud.maxHp }, (_, i) => <Heart key={i} full={i < hud.hp} />)}
        </span>
      </div>
      {boss != null && (
        <div className="boss-bar" role="progressbar" aria-label="Boss health" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(boss * 100)}>
          <span className="boss-name">Doubtwarden</span>
          <div className="bar"><div className="fill" style={{ width: `${boss * 100}%` }} /></div>
        </div>
      )}
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return <div className="toast" role="status">{toast.text}</div>;
}

export function InteractHint({ visible }) {
  return <div className={`interact-hint ${visible ? '' : 'hidden'}`}>press <b>E</b> · tap ✦</div>;
}

/* ── Dialogue — typewriter with punctuation pauses ── */
const PUNCT = new Set(['.', '!', '?', '—', '…', ':', ';', ',']);
export function DialogueBox({ dlg }) {
  const [shown, setShown] = useState(0);
  const text = dlg.line.text || '';
  const done = shown >= text.length;
  useEffect(() => {
    setShown(0);
    let i = 0, t;
    const tick = () => {
      i += 1;
      setShown(i);
      if (i < text.length) {
        const ch = text[i - 1];
        t = setTimeout(tick, PUNCT.has(ch) ? 180 : 22 + Math.random() * 18);
      }
    };
    t = setTimeout(tick, 60);
    return () => clearTimeout(t);
  }, [dlg.id]);
  const last = dlg.step && dlg.step[0] === dlg.step[1];
  return (
    <div className="dialogue" onClick={() => { if (!done) setShown(text.length); else h().onDialogueNext?.(); }}>
      <div className="dlg-box" role="dialog" aria-live="polite">
        {dlg.line.who ? <div className="dlg-who">{dlg.line.who}</div> : null}
        <p>{text.slice(0, shown)}{!done && <span className="caret">▍</span>}</p>
        <div className="dlg-controls">
          <button onClick={(e) => { e.stopPropagation(); if (!done) setShown(text.length); else h().onDialogueNext?.(); }}>
            {done ? (last ? 'Done' : 'Next ▸') : '…'}
          </button>
          {dlg.skippable && <button className="ghost" onClick={(e) => { e.stopPropagation(); h().onDialogueSkip?.(); }}>Skip</button>}
        </div>
        {done && <span className="dlg-next-glyph" aria-hidden="true">▾</span>}
      </div>
    </div>
  );
}

/* ── flashes / hints ── */
export function GameOverFlash({ text }) {
  return (
    <div className="screen dark" role="alert">
      <div className="panel dark-panel"><h2>{text}</h2><p className="dim">returning to the last lantern…</p></div>
    </div>
  );
}

export function RotateHint() {
  return (
    <div className="rotate-hint">
      <div>⟳<br />This story reads best sideways —<br />rotate your phone to landscape.</div>
    </div>
  );
}
