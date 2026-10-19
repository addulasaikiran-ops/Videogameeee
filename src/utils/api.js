// Optional companion-server client. Everything no-ops gracefully unless
// VITE_API_URL is set — the game must work fully offline / on GitHub Pages.
const BASE = import.meta.env.VITE_API_URL || null;
export const apiEnabled = !!BASE;

async function call(path, init) {
  try {
    const r = await fetch(BASE + path, { ...init, headers: { 'Content-Type': 'application/json' } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export const cloudSavePush = (playerId, save) =>
  apiEnabled ? call('/api/cloud-save', { method: 'POST', body: JSON.stringify({ playerId, save }) }) : null;
export const cloudSavePull = (playerId) => (apiEnabled ? call(`/api/cloud-save/${playerId}`) : null);
export const submitScore = (levelId, name, timeSec, hearts) =>
  apiEnabled ? call('/api/leaderboard', { method: 'POST', body: JSON.stringify({ levelId, name, timeSec, hearts }) }) : null;
export const leaderboard = (levelId) => (apiEnabled ? call(`/api/leaderboard?levelId=${encodeURIComponent(levelId)}`) : null);
