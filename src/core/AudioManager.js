// WebAudio-based audio: all SFX are synthesized so the game has zero audio-file
// dependencies and cannot 404. A gentle generative pad provides ambience.
// Optional music file support stays: drop a file at assets/audio/music/*.mp3
// and set MusicTrack below to use it.
import { assetUrl } from './assetUrl.js';

const MusicTrack = null; // e.g. 'assets/audio/music/theme.mp3' when you add one

// Per-chapter ambient pads (Hz): each level's mood retunes the four drones.
const MOODS = {
  firstLight:     [196.0, 246.94, 293.66, 392.0],   // Gmaj7 — dawn garden
  gardenMemories: [220.0, 277.18, 329.63, 440.0],   // A add9 — warm memories
  memoryChapter:  [174.61, 220.0, 261.63, 349.23],  // F add4 — soft flashback
  seaDistance:    [146.83, 220.0, 293.66, 369.99],  // D lydian — open sea
  shadowDoubt:    [130.81, 155.56, 196.0, 233.08],  // Cm7 — doubt
  heartsPromise:  [110.0, 138.59, 164.81, 220.0],   // A minor — resolve
  endingGlade:    [196.0, 246.94, 329.63, 392.0],   // G6 — together
};

export class AudioManager {
  constructor(settings) {
    this.settings = settings; // { music, sfx, muted } — live ref to save.settings
    this.ctx = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.ambientNodes = [];
    this.fileMusic = null;
  }

  // Must be called from a user gesture (click/touch) at least once.
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      this.applyVolumes();
      if (MusicTrack) this._startFileMusic();
      else this._startAmbient();
    } catch (error) {
      console.warn('Audio unavailable:', error);
      this.ctx = null;
    }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const m = this.settings.muted ? 0 : 1;
    this.sfxGain.gain.value = (this.settings.sfx ?? 0.8) * m;
    this.musicGain.gain.value = (this.settings.music ?? 0.4) * m * 0.6;
    if (this.fileMusic) this.fileMusic.volume = Math.min(1, (this.settings.music ?? 0.4) * m);
  }

  toggleMute() { this.settings.muted = !this.settings.muted; this.applyVolumes(); return this.settings.muted; }

  _startFileMusic() {
    this.fileMusic = new Audio(assetUrl(MusicTrack));
    this.fileMusic.loop = true;
    this.fileMusic.play().catch(() => { this.fileMusic = null; });
  }

  // Gentle original pad: slow-detuned oscillators through a soft LFO — cheap
  // and license-free ambience instead of shipping a music file.
  _startAmbient() {
    if (!this.ctx || this.ambientNodes.length) return;
    const notes = MOODS[this._mood] || MOODS.firstLight;
    for (const [i, freq] of notes.entries()) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.028;
      lfo.frequency.value = 0.05 + i * 0.017;
      lfoGain.gain.value = 0.014;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      osc.connect(gain); gain.connect(this.musicGain);
      osc.start(); lfo.start();
      this.ambientNodes.push(osc, lfo);
    }
  }

  // Retune the drone chord per chapter — a slow glide, not a jump cut.
  setMood(levelId) {
    this._mood = levelId;
    const notes = MOODS[levelId];
    if (!this.ctx || !notes || !this.ambientNodes.length) return;
    for (const [i, f] of notes.entries()) {
      this.ambientNodes[i * 2]?.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.9);
    }
  }

  _tone({ freq = 440, freq2 = null, type = 'sine', dur = 0.15, vol = 0.25, delay = 0 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  play(name, opt) {
    if (!this.ctx || this.settings.muted) return;
    const s = {
      jump:      () => this._tone({ freq: 300, freq2: 520, type: 'triangle', dur: 0.14, vol: 0.2 }),
      doubleJump:() => this._tone({ freq: 400, freq2: 700, type: 'triangle', dur: 0.14, vol: 0.2 }),
      land:      () => this._tone({ freq: 160, freq2: 90, type: 'sine', dur: 0.1, vol: 0.16 }),
      collect:   () => { const st = Math.min(8, opt?.step || 0); const f = 660 * (1 + st * 0.07); this._tone({ freq: f, dur: 0.1, vol: 0.2 }); this._tone({ freq: f * 1.5, dur: 0.14, vol: 0.18, delay: 0.07 }); },
      fragment:  () => { [523, 659, 784, 1047].forEach((f, i) => this._tone({ freq: f, dur: 0.22, vol: 0.16, delay: i * 0.09 })); },
      star:      () => { [880, 1175, 1568].forEach((f, i) => this._tone({ freq: f, dur: 0.16, vol: 0.15, delay: i * 0.07 })); },
      hurt:      () => this._tone({ freq: 220, freq2: 90, type: 'sawtooth', dur: 0.25, vol: 0.2 }),
      attack:    () => this._tone({ freq: 520, freq2: 980, type: 'triangle', dur: 0.12, vol: 0.18 }),
      enemyHit:  () => this._tone({ freq: 340, freq2: 140, type: 'square', dur: 0.12, vol: 0.16 }),
      enemyDie:  () => { this._tone({ freq: 500, freq2: 120, type: 'square', dur: 0.25, vol: 0.15 }); this._tone({ freq: 800, dur: 0.1, vol: 0.1, delay: 0.1 }); },
      checkpoint:() => { this._tone({ freq: 587, dur: 0.12, vol: 0.18 }); this._tone({ freq: 880, dur: 0.2, vol: 0.16, delay: 0.1 }); },
      ui:        () => this._tone({ freq: 700, dur: 0.06, vol: 0.12 }),
      uiHover:   () => this._tone({ freq: 1560, dur: 0.045, vol: 0.05 }),
      uiPress:   () => this._tone({ freq: 260, freq2: 180, type: 'triangle', dur: 0.09, vol: 0.14 }),
      uiConfirm: () => { this._tone({ freq: 660, dur: 0.09, vol: 0.12 }); this._tone({ freq: 990, dur: 0.14, vol: 0.1, delay: 0.06 }); },
      door:      () => { [392, 523, 659].forEach((f, i) => this._tone({ freq: f, dur: 0.18, vol: 0.15, delay: i * 0.1 })); },
      bossHit:   () => this._tone({ freq: 180, freq2: 60, type: 'sawtooth', dur: 0.3, vol: 0.22 }),
      bossRoar:  () => { this._tone({ freq: 90, freq2: 55, type: 'sawtooth', dur: 0.6, vol: 0.22 }); this._tone({ freq: 130, freq2: 70, type: 'square', dur: 0.55, vol: 0.1, delay: 0.05 }); },
      death:     () => this._tone({ freq: 300, freq2: 60, type: 'sine', dur: 0.7, vol: 0.22 }),
      respawn:   () => { [392, 523, 784].forEach((f, i) => this._tone({ freq: f, dur: 0.15, vol: 0.14, delay: i * 0.08 })); },
      shoot:     () => this._tone({ freq: 700, freq2: 350, type: 'square', dur: 0.1, vol: 0.08 }),
      complete:  () => { [523, 659, 784, 1047, 1319].forEach((f, i) => this._tone({ freq: f, dur: 0.25, vol: 0.16, delay: i * 0.11 })); },
    }[name];
    if (s) s();
  }
}
