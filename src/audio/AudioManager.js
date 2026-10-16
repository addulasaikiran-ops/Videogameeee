import { assetUrl } from '../core/assetUrl.js';
export class AudioManager {
  constructor() { this.muted = false; this.audio = null; }
  unlock() {
    if (this.muted || this.audio) return;
    this.audio = new Audio(assetUrl('assets/audio/music/beach.mp3'));
    this.audio.loop = true; this.audio.volume = 0.22;
    this.audio.play().catch(() => { this.audio = null; });
  }
  toggleMute() { this.muted = !this.muted; if (this.audio) this.audio.muted = this.muted; return this.muted; }
}
