import React from 'react';
import { ui } from '../store/uiStore.js';
import { CREDITS } from '../story/dialogue-data.js';

export default function Credits() {
  return (
    <div className="screen" role="dialog" aria-label="Credits">
      <div className="panel credits">
        <h2>Credits</h2>
        <div className="credits-mask"><p className="credits-scroll">{CREDITS.join('\n\n')}</p></div>
        <div className="row"><button onClick={() => ui.bridge.showMenu()}>Back</button></div>
      </div>
    </div>
  );
}
