import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';

export function mountUi() {
  const rootEl = document.createElement('div');
  rootEl.id = 'ui-root';
  document.body.appendChild(rootEl);
  createRoot(rootEl).render(<App />);
}
