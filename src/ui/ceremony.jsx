import React from 'react';
import { ui } from '../store/uiStore.js';

const h = () => ui.handlers || {};

/* ── Chapter complete — staged stat reveal ── */
export function ChapterComplete({ data }) {
  if (!data) return null;
  const stats = [`♥ ${data.hearts} hearts`, `◆ ${data.fragments} memories`, data.stars ? `★ ${data.stars} keepsakes` : null].filter(Boolean);
  return (
    <div className="screen" role="dialog" aria-label="Chapter complete">
      <div className="panel">
        <h2 className="reveal" style={{ animationDelay: '0s' }}>Chapter complete</h2>
        <p className="dim reveal" style={{ animationDelay: '.3s' }}>{data.name}</p>
        <div className="stat-row">
          {stats.map((s, i) => <span key={s} className="stat reveal" style={{ animationDelay: `${0.55 + i * 0.35}s` }}>{s}</span>)}
        </div>
        <div className="row reveal" style={{ animationDelay: '1.3s' }}>
          <button className="primary" onClick={() => ui._completeNext?.()}>Continue ▸</button>
        </div>
      </div>
    </div>
  );
}

/* ── Ending — typographic reveal of ENDING_MESSAGE ── */
export function Ending({ msg }) {
  const words = String(msg || '').split(' ');
  return (
    <div className="screen" role="dialog" aria-label="Ending">
      <div className="panel ending-panel">
        <div className="big-heart" aria-hidden="true">♥</div>
        <h2>Together in Our Little World</h2>
        <p className="ending-msg">
          {words.map((w, i) => <span key={i} className="reveal" style={{ animationDelay: `${0.4 + i * 0.09}s`, display: 'inline-block' }}>{w}&nbsp;</span>)}
        </p>
        <div className="row">
          <button onClick={() => ui.bridge.showCredits()}>Credits</button>
          <button onClick={() => h().onQuitToMenu?.()}>Main menu</button>
        </div>
      </div>
    </div>
  );
}

/* ── Error / WebGL-fail — designed fallback ── */
export function ErrorScreen({ message }) {
  return (
    <div className="screen dark" role="alert">
      <div className="panel dark-panel">
        <div className="big-heart broken" aria-hidden="true">♡</div>
        <h2>The page tore</h2>
        <p className="dim">{message || 'Something in the little world faltered.'}</p>
        <div className="row"><button className="primary" onClick={() => location.reload()}>Try again</button></div>
      </div>
    </div>
  );
}
