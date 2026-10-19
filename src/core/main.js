import '../styles/main.css';
import { Game } from './Game.js';

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error) => console.error('Service worker registration failed:', error));
  });
}
registerServiceWorker();

const app = document.querySelector('#app');
try {
  window.__game = new Game(app);
} catch (error) {
  console.error('Could not start the game:', error);
}
