import '../styles/main.css';
import { mountUi } from '../ui/mount.jsx';
import { uiSet } from '../store/uiStore.js';
import { Game } from './Game.js';

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error) => console.error('Service worker registration failed:', error));
  });
}
registerServiceWorker();

mountUi();

const app = document.querySelector('#app');
try {
  window.__game = new Game(app);
} catch (error) {
  console.error('Could not start the game:', error);
  uiSet({ fatal: 'The little world could not wake — your browser may be missing WebGL.' });
}
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); });
