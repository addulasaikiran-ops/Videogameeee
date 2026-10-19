// ─────────────────────────────────────────────────────────────────────────────
// ALL STORY TEXT LIVES HERE — edit freely.
// Placeholders are fictional and clearly marked. Replace bracketed text like
// [your memory here] with your own words whenever you're ready. No real names,
// dates, or private details are hardcoded anywhere in the engine.
// ─────────────────────────────────────────────────────────────────────────────

// Custom closing message shown on the ending screen — make it yours.
export const ENDING_MESSAGE = 'Wherever we are, this little world is ours. — edit me in src/story/dialogue-data.js';

export const SCENES = {
  intro: [
    { who: 'Narrator', text: 'Some promises are small enough to hold in one hand — and big enough to cross a whole world for.' },
    { who: 'Narrator', text: 'Tonight, someone is still waiting to be woken gently. You promised you would be the one to do it.' },
    { who: 'You', text: 'One heart at a time. I remember the way.' },
  ],
  firstLight_intro: [
    { who: 'Narrator', text: 'First Light — the garden where every journey begins. Move with ◀ ▶, jump with SPACE, and gather every glowing heart you can find.' },
    { who: 'Narrator', text: 'Lanterns mark checkpoints. If you fall, they keep your place.' },
  ],
  firstLight_end: [
    { who: 'Narrator', text: 'The first hearts are warm in your hands. Ahead, the garden of memories waits.' },
    { who: 'You', text: 'This is only the beginning of the promise.' },
  ],
  garden_intro: [
    { who: 'Narrator', text: 'Garden of Memories — fragments of moments drift here like fireflies. Touch them to remember.' },
  ],
  memory1: [
    { who: 'Memory', text: '[placeholder memory 1 — a first hello. Replace this with your own.]' },
    { who: 'You', text: 'I keep this one safe.' },
  ],
  memory2: [
    { who: 'Memory', text: '[placeholder memory 2 — a quiet evening, laughter over nothing.]' },
    { who: 'You', text: 'Still warm, even here.' },
  ],
  memory3: [
    { who: 'Memory', text: '[placeholder memory 3 — a promise whispered and kept.]' },
    { who: 'You', text: 'Every fragment is a step closer.' },
  ],
  memoryChapter_intro: [
    { who: 'Narrator', text: 'A special memory — walk slowly. There is no hurry here.' },
  ],
  memoryChapter_end: [
    { who: 'Narrator', text: 'Some moments do not fade. They wait, glowing, until we come back for them.' },
  ],
  sea_intro: [
    { who: 'Narrator', text: 'Sea of Distance — the miles between two people, stretched silver under the moon.' },
    { who: 'You', text: 'Distance is only a place to cross.' },
  ],
  sea_end: [
    { who: 'Narrator', text: 'The tide gives back what it borrows. Almost there now.' },
  ],
  shadow_intro: [
    { who: 'Narrator', text: 'Shadow of Doubt — every long road has a dark stretch. Keep moving.' },
    { who: 'You', text: 'Doubt is loud, but the promise is louder.' },
  ],
  boss_intro: [
    { who: 'Doubtwarden', text: 'You carry a small heart into a large night. Turn back.' },
    { who: 'You', text: 'This heart has crossed gardens and oceans. You are only the last shadow.' },
    { who: 'Narrator', text: 'Watch for the flash — strike when it charges past you!' },
  ],
  boss_win: [
    { who: 'Narrator', text: 'The shadow folds like paper. What remains is only light.' },
  ],
  ending: [
    { who: 'Narrator', text: 'And here, at the edge of morning, the promise is kept.' },
    { who: 'You', text: 'Wake gently. I crossed the whole little world to get here.' },
  ],
  sign_move: [{ who: 'Sign', text: '◀ ▶ to run · SPACE to jump · press again mid-air to double-jump' }],
  sign_attack: [{ who: 'Sign', text: 'J or X releases a Heart Pulse — love, weaponized. Shadows fear it.' }],
  sign_switch: [{ who: 'Sign', text: 'The glowing orb opens what is closed. Touch it (E).' }],
};

export const CREDITS = [
  'WakeHimWithLove',
  '',
  'A game built with love, for someone worth crossing worlds for.',
  '',
  'Engine: Three.js + Vite',
  'World, code, and story: made together',
  'Music: generative ambience (no files needed)',
  '',
  'Thank you for playing.',
];
