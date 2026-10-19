// ─────────────────────────────────────────────────────────────────────────────
// LEVEL DATA — the whole story as editable tables.
// Coordinates: x = horizontal center, y = TOP surface height, w/h = size.
// Jump math: single jump ≈ 2.4 high / ~4.5 across; double jump ≈ 4.5 high.
// keep gaps ≤ 4 wide at same height and steps ≤ 2.2 high for single jumps.
// ─────────────────────────────────────────────────────────────────────────────

const GROUND = (from, to, y = 0) => ({ x: (from + to) / 2, y, w: to - from, h: 1.2 });
const H = (id, x, y) => ({ id, type: 'heart', x, y });
const F = (id, x, y, scene) => ({ id, type: 'fragment', x, y, scene });
const S = (id, x, y) => ({ id, type: 'star', x, y });
const CP = (id, x, y = 0) => ({ id, x, y });

export const LEVEL_ORDER = ['firstLight', 'gardenMemories', 'memoryChapter', 'seaDistance', 'shadowDoubt', 'heartsPromise', 'endingGlade'];

export const LEVELS = {
  // ── 1 · First Light — tutorial garden at dawn ──────────────────────────────
  firstLight: {
    name: 'First Light',
    theme: 'dawnGarden',
    introScene: 'firstLight_intro',
    endScene: 'firstLight_end',
    next: 'gardenMemories',
    killY: -6,
    spawn: [2, 0.2],
    ground: [GROUND(-8, 20), GROUND(24, 44), GROUND(50, 74)],
    platforms: [
      { x: 22, y: 1.4, w: 3.4 }, { x: 26.5, y: 2.6, w: 3 },           // over the first gap
      { x: 33, y: 1.8, w: 3 },                                        // low hop for a heart line
      { x: 46, y: 1.2, w: 3 }, { x: 48.5, y: 2.4, w: 2.6 },           // second gap
      { x: 55, y: 2.0, w: 2.8 }, { x: 60, y: 3.4, w: 2.6 },           // heart arc
      { x: 64, y: 2.0, w: 3 },
    ],
    hazards: [{ x: 22, y: -1.4, w: 4.5, kind: 'void' }, { x: 47.2, y: -1.4, w: 5.5, kind: 'void' }],
    collectibles: [
      H('l1-h1', 6, 1.2), H('l1-h2', 10, 1.2), H('l1-h3', 14, 1.4),
      H('l1-h4', 22, 2.6), H('l1-h5', 26.5, 3.8), H('l1-h6', 33, 3.0),
      H('l1-h7', 46, 2.4), H('l1-h8', 48.5, 3.6), H('l1-h9', 55, 3.2), H('l1-h10', 60, 4.6),
      F('l1-m1', 40, 1.4, 'memory1'),
      S('l1-s1', 64, 3.4),
    ],
    checkpoints: [CP('l1-c1', 26), CP('l1-c2', 52)],
    interactables: [
      { id: 'l1-sign1', x: 4, y: 0, kind: 'sign', action: { type: 'dialogue', key: 'sign_move' } },
      { id: 'l1-sign2', x: 54, y: 0, kind: 'sign', action: { type: 'dialogue', key: 'sign_attack' } },
    ],
    enemies: [],
    goal: { x: 68, y: 0, label: 'To the Garden of Memories' },
  },

  // ── 2 · Garden of Memories — moving platforms, a switch-and-door ───────────
  gardenMemories: {
    name: 'Garden of Memories',
    theme: 'memoryGarden',
    introScene: 'garden_intro',
    next: 'memoryChapter',
    killY: -6,
    spawn: [2, 0.2],
    ground: [GROUND(-8, 18), GROUND(30, 46), GROUND(58, 88)],
    platforms: [
      { x: 22, y: 0.8, w: 2.6, move: { axis: 'x', range: 3, speed: 0.9 } },   // ferry across gap 1
      { x: 50, y: 1.0, w: 2.6, move: { axis: 'x', range: 4, speed: 0.8 } },   // ferry across gap 2
      { x: 35, y: 1.6, w: 3 }, { x: 39.5, y: 2.8, w: 2.6 },
      { x: 63, y: 1.5, w: 2.6 }, { x: 67, y: 2.8, w: 2.4 }, { x: 71, y: 4.2, w: 2.4 },
      { x: 78, y: 1.8, w: 3 },
    ],
    doors: [{ id: 'garden-door', x: 55, y: 0, h: 3.2 }],
    hazards: [{ x: 24, y: -1.4, w: 11, kind: 'void' }, { x: 52, y: -1.4, w: 11, kind: 'void' }],
    collectibles: [
      H('l2-h1', 6, 1.2), H('l2-h2', 12, 1.4), H('l2-h3', 22, 2.2),
      H('l2-h4', 35, 2.8), H('l2-h5', 39.5, 4.0), H('l2-h6', 50, 2.4),
      H('l2-h7', 63, 2.7), H('l2-h8', 67, 4.0), H('l2-h9', 71, 5.4), H('l2-h10', 78, 3.0),
      F('l2-m2', 39.5, 4.6, 'memory2'),
      F('l2-m3', 71, 5.8, 'memory3'),
      S('l2-s1', 50, 5.2),
    ],
    checkpoints: [CP('l2-c1', 32), CP('l2-c2', 60)],
    interactables: [
      { id: 'l2-sign1', x: 31, y: 0, kind: 'sign', action: { type: 'dialogue', key: 'sign_switch' } },
      { id: 'l2-switch1', x: 44.5, y: 0, kind: 'switch', action: { type: 'door', id: 'garden-door' }, once: true },
    ],
    enemies: [
      { id: 'l2-e1', type: 'patroller', x: 36, y: 0, minX: 31, maxX: 44 },
      { id: 'l2-e2', type: 'patroller', x: 66, y: 0, minX: 60, maxX: 76 },
    ],
    goal: { x: 83, y: 0, label: 'A Special Memory' },
  },

  // ── Memory chapter — a slow, gentle flashback ──────────────────────────────
  memoryChapter: {
    name: 'A Special Memory',
    theme: 'memoryVoid',
    introScene: 'memoryChapter_intro',
    endScene: 'memoryChapter_end',
    next: 'seaDistance',
    killY: -6,
    slowPace: 0.55,
    spawn: [2, 0.2],
    ground: [GROUND(-8, 36)],
    platforms: [],
    hazards: [],
    collectibles: [H('mc-h1', 12, 1.2), H('mc-h2', 20, 1.2), H('mc-h3', 28, 1.2)],
    checkpoints: [],
    interactables: [],
    enemies: [],
    goal: { x: 32, y: 0, label: 'Wake from the memory' },
  },

  // ── 3 · Sea of Distance — moonlit beach ────────────────────────────────────
  seaDistance: {
    name: 'Sea of Distance',
    theme: 'nightSea',
    introScene: 'sea_intro',
    endScene: 'sea_end',
    next: 'shadowDoubt',
    killY: -6,
    spawn: [2, 0.2],
    ground: [GROUND(-8, 16), GROUND(20, 34), GROUND(44, 58), GROUND(66, 92)],
    platforms: [
      { x: 17.5, y: 0.9, w: 2.4 }, { x: 21.5, y: 1.9, w: 2.2 },
      { x: 38, y: 1.0, w: 2.6, move: { axis: 'y', range: 1.6, speed: 0.9 } },
      { x: 41.5, y: 1.0, w: 2.6, move: { axis: 'y', range: 1.6, speed: 0.9, phase: 0.5 } },
      { x: 62, y: 1.2, w: 2.4, move: { axis: 'x', range: 3.5, speed: 0.85 } },
      { x: 72, y: 1.8, w: 3 }, { x: 77, y: 3.0, w: 2.6 }, { x: 82, y: 2.0, w: 3 },
    ],
    hazards: [
      { x: 18, y: -1.3, w: 4.2, kind: 'void' }, { x: 39, y: -1.3, w: 10.4, kind: 'void' }, { x: 62, y: -1.3, w: 8.2, kind: 'void' },
    ],
    collectibles: [
      H('l3-h1', 6, 1.2), H('l3-h2', 12, 1.3), H('l3-h3', 17.5, 2.1), H('l3-h4', 21.5, 3.1),
      H('l3-h5', 38, 3.2), H('l3-h6', 41.5, 3.2), H('l3-h7', 62, 2.6),
      H('l3-h8', 72, 3.0), H('l3-h9', 77, 4.2), H('l3-h10', 82, 3.2),
      S('l3-s1', 77, 5.6),
    ],
    checkpoints: [CP('l3-c1', 25), CP('l3-c2', 46), CP('l3-c3', 70)],
    interactables: [],
    enemies: [
      { id: 'l3-e1', type: 'wisp', x: 30, y: 2.5 },
      { id: 'l3-e2', type: 'patroller', x: 50, y: 0, minX: 45, maxX: 57 },
      { id: 'l3-e3', type: 'wisp', x: 74, y: 3 },
      { id: 'l3-e4', type: 'patroller', x: 84, y: 0, minX: 68, maxX: 90 },
    ],
    goal: { x: 88, y: 0, label: 'Into the Shadow' },
  },

  // ── 4 · Shadow of Doubt — hardest stretch, still fair ──────────────────────
  shadowDoubt: {
    name: 'Shadow of Doubt',
    theme: 'shadowRealm',
    introScene: 'shadow_intro',
    next: 'heartsPromise',
    killY: -6,
    spawn: [2, 0.2],
    ground: [GROUND(-8, 14), GROUND(19, 30), GROUND(36, 46), GROUND(52, 62), GROUND(70, 96)],
    platforms: [
      { x: 16.5, y: 1.1, w: 2.2 }, { x: 19, y: 2.2, w: 2.2 },
      { x: 33, y: 1.0, w: 2.4, move: { axis: 'x', range: 3, speed: 1.05 } },
      { x: 49, y: 1.2, w: 2.4, move: { axis: 'y', range: 2, speed: 1.0 } },
      { x: 65.5, y: 1.1, w: 2.2 }, { x: 68, y: 2.3, w: 2.0 },
      { x: 76, y: 1.6, w: 2.6 }, { x: 80, y: 3.0, w: 2.4 }, { x: 84, y: 1.8, w: 2.6 },
    ],
    hazards: [
      { x: 17, y: -1.4, w: 5, kind: 'void' }, { x: 33, y: -1.4, w: 6, kind: 'void' },
      { x: 49, y: -1.4, w: 6, kind: 'void' }, { x: 66, y: -1.4, w: 8, kind: 'void' },
      { x: 24, y: 0, w: 2.2, kind: 'spikes' }, { x: 56, y: 0, w: 2.6, kind: 'spikes' }, { x: 90, y: 0, w: 2.4, kind: 'spikes' },
    ],
    collectibles: [
      H('l4-h1', 6, 1.2), H('l4-h2', 16.5, 2.3), H('l4-h3', 19, 3.4),
      H('l4-h4', 33, 2.4), H('l4-h5', 49, 3.6), H('l4-h6', 65.5, 2.3), H('l4-h7', 68, 3.5),
      H('l4-h8', 76, 2.8), H('l4-h9', 80, 4.2), H('l4-h10', 84, 3.0),
      F('l4-m4', 40, 1.4, 'memory1'),
      S('l4-s1', 90, 2.6),
    ],
    checkpoints: [CP('l4-c1', 21), CP('l4-c2', 38), CP('l4-c3', 72)],
    interactables: [
      { id: 'l4-sign1', x: 3.5, y: 0, kind: 'sign', action: { type: 'dialogue', key: 'sign_attack' } },
    ],
    enemies: [
      { id: 'l4-e1', type: 'shadow', x: 24, y: 0, minX: 20, maxX: 29 },
      { id: 'l4-e2', type: 'shadow', x: 42, y: 0, minX: 37, maxX: 45 },
      { id: 'l4-e3', type: 'wisp', x: 49, y: 4.5 },
      { id: 'l4-e4', type: 'shadow', x: 58, y: 0, minX: 53, maxX: 61 },
      { id: 'l4-e5', type: 'wisp', x: 78, y: 3.5 },
      { id: 'l4-e6', type: 'shadow', x: 86, y: 0, minX: 73, maxX: 94 },
    ],
    goal: { x: 92, y: 0, label: "The Heart's Promise" },
  },

  // ── Final encounter — The Heart's Promise ──────────────────────────────────
  heartsPromise: {
    name: "The Heart's Promise",
    theme: 'bossArena',
    introScene: null,
    next: 'endingGlade',
    killY: -6,
    spawn: [2, 0.2],
    ground: [GROUND(-8, 40)],
    platforms: [
      { x: 6, y: 1.8, w: 2.6 }, { x: 30, y: 1.8, w: 2.6 },   // safe perches
    ],
    hazards: [],
    collectibles: [H('lb-h1', 6, 3.2), H('lb-h2', 30, 3.2)],
    checkpoints: [],
    interactables: [{ id: 'lb-trigger', x: 8, y: 0, kind: 'trigger', action: { type: 'cutscene', key: 'bossIntro' }, once: true }],
    enemies: [],
    boss: { x: 28, y: 0, minX: 5, maxX: 35 },
    goal: null, // appears when the boss falls
  },

  // ── Ending — Together in Our Little World ──────────────────────────────────
  endingGlade: {
    name: 'Together in Our Little World',
    theme: 'endingGlade',
    introScene: 'ending',
    next: null,
    killY: -6,
    slowPace: 0.7,
    spawn: [2, 0.2],
    ground: [GROUND(-8, 34)],
    platforms: [],
    hazards: [],
    collectibles: [],
    checkpoints: [],
    interactables: [],
    enemies: [],
    goal: { x: 28, y: 0, label: 'Forever' },
  },
};
