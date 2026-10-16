export class InteractionSystem {
  constructor({ player, dialogue, memories, ui }) { this.player = player; this.dialogue = dialogue; this.memories = memories; this.ui = ui; this.cooldown = 0; this.nearMemory = false; }
  update(delta) { this.cooldown = Math.max(0, this.cooldown - delta); this.nearMemory = Math.hypot(this.player.position.x - 2.2, this.player.position.z + 1.5) < 1.8; this.ui?.setInteractionAvailable(this.nearMemory); }
  interact() { if (this.cooldown > 0) return; this.cooldown = 0.35; if (this.nearMemory) this.memories.openFirst(this.ui); else this.dialogue.show('Wander toward the little glowing shell to discover a memory.'); }
}
