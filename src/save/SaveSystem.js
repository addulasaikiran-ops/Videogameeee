const SAVE_KEY = 'our-little-world-save-v1';
export class SaveSystem {
  constructor() { this.lastSave = 0; }
  load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; } }
  save(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch (error) { console.warn('Could not save progress:', error); } }
  saveThrottled(data) { const now = performance.now(); if (now - this.lastSave > 2500) { this.save(data); this.lastSave = now; } }
}
