import memories from './memories.json';
import { assetUrl } from '../core/assetUrl.js';
export class MemorySystem {
  constructor() { this.memories = memories; this.seen = new Set(); }
  openFirst(ui) {
    const memory = this.memories[0]; if (!memory) return;
    this.seen.add(memory.id);
    ui?.showMemory({ ...memory, photoUrl: memory.photoPath ? assetUrl(memory.photoPath) : null });
  }
}
