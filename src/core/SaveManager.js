// Versioned local save. v2 replaces the old {player:{x,z},scene} shape; v1 data
// is detected and migrated to a fresh v2 profile (settings are re-defaulted).
const SAVE_KEY = 'wakehimwithlove-save';
const LEGACY_KEY = 'our-little-world-save-v1';
const VERSION = 2;

const DEFAULT_SETTINGS = { music: 0.4, sfx: 0.8, muted: false, quality: 'auto', showTouch: 'auto' };

function defaults() {
  return {
    version: VERSION,
    settings: { ...DEFAULT_SETTINGS },
    unlocked: ['firstLight'],
    completed: [],
    collectibles: {}, // { levelId: [collectibleId, ...] }
    checkpoint: null, // { levelId, checkpointId }
    lastLevel: 'firstLight',
    storyFlags: {},
    stats: { deaths: 0, heartsTotal: 0 },
  };
}

export class SaveManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === VERSION) return { ...defaults(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) } };
        // Unknown/newer version: keep it simple and reset safely.
        return defaults();
      }
      // Legacy v1 save existed: honor it by starting fresh (old shape had no
      // progression worth migrating) but remember that a game existed.
      if (localStorage.getItem(LEGACY_KEY)) localStorage.removeItem(LEGACY_KEY);
      return defaults();
    } catch (error) {
      console.warn('Save data unreadable, starting fresh:', error);
      return defaults();
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...this.data, savedAt: Date.now() }));
      return true;
    } catch (error) {
      console.warn('Could not save progress:', error);
      return false;
    }
  }

  get hasProgress() {
    return this.data.completed.length > 0 || Object.values(this.data.collectibles).some((l) => l.length > 0) || this.data.unlocked.length > 1 || !!this.data.checkpoint;
  }

  setSettings(patch) { Object.assign(this.data.settings, patch); this.save(); }
  unlock(levelId) { if (!this.data.unlocked.includes(levelId)) { this.data.unlocked.push(levelId); this.save(); } }
  complete(levelId) { if (!this.data.completed.includes(levelId)) { this.data.completed.push(levelId); } this.save(); }
  setCheckpoint(levelId, checkpointId) { this.data.checkpoint = { levelId, checkpointId }; this.data.lastLevel = levelId; this.save(); }
  clearCheckpoint() { this.data.checkpoint = null; this.save(); }
  setFlag(key, value = true) { this.data.storyFlags[key] = value; this.save(); }
  flag(key) { return !!this.data.storyFlags[key]; }

  collect(levelId, id, isHeart) {
    const list = (this.data.collectibles[levelId] ||= []);
    if (list.includes(id)) return false;
    list.push(id);
    if (isHeart) this.data.stats.heartsTotal += 1;
    this.save();
    return true;
  }

  collected(levelId, id) { return (this.data.collectibles[levelId] || []).includes(id); }

  recordDeath() { this.data.stats.deaths += 1; this.save(); }

  resetProgress() {
    const settings = this.data.settings;
    this.data = defaults();
    this.data.settings = settings; // keep audio/quality preferences
    try { localStorage.removeItem(LEGACY_KEY); } catch {}
    this.save();
  }
}
