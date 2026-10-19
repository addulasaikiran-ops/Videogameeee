# Wake Him With Love

A romantic 2.5D storybook platformer built with Three.js + Vite. Run, jump, and fight through seven hand-built chapters — from a sunrise garden to a boss fight against Doubt itself — to reach the person you love.

Play it in a desktop browser or on a phone (landscape works best; touch controls appear automatically on touchscreens).

## Chapters

1. **First Light** — a gentle tutorial garden (move, jump, collect hearts).
2. **Garden of Memories** — memory fragments, moving platforms, switches and doors.
3. **A Special Memory** — a slow, skippable flashback walk.
4. **Sea of Distance** — night beach with wisps that shoot sparks.
5. **Shadow of Doubt** — harder platforming, patrolling enemies, spikes.
6. **The Heart's Promise** — a three-phase boss fight with telegraphed attacks.
7. **Together in Our Little World** — the ending. The final message lives in `src/story/dialogue-data.js` (`ENDING_MESSAGE`) — edit it to make it yours.

## Controls

- **Desktop**: Arrow keys / WASD move · Space jump (double-tap for double jump) · J or X heart-pulse attack · E interact · Esc pause.
- **Touch**: on-screen buttons for move, jump, attack, interact, and pause.

## Requirements

- Node.js 20 or newer
- npm
- Git

## First-time setup

```bash
npm install
npm run generate-icons
npm run dev
```

## Build and preview

```bash
npm run build
npm run preview
```

Vite outputs the production site to `dist/`. The configured base path is `/Videogameeee/`.

## Project layout

```
src/
  core/      Game state machine, loop, input, camera, save, audio
  player/    Player physics + animation states
  gameplay/  Platforms, collectibles, hazards, checkpoints, doors,
             enemies, projectiles, boss, particles
  levels/    Level data + decor themes + LevelManager
  story/     Dialogue manager, cutscenes, all story text
  ui/        Menus, HUD, dialogue box, touch controls
  styles/    main.css
```

- Story text lives in `src/story/dialogue-data.js` — every line is placeholder text meant to be personalized. Nothing in the repo is a real memory, photo, or private detail.
- Saves are stored in `localStorage` (`wakehimwithlove-save`, versioned). Settings → Reset progress clears it.
- Audio is generated on-device with WebAudio (no audio files needed); a real music track can be wired into `src/core/AudioManager.js` later.

## GitHub Pages deployment

The repo deploys automatically via `.github/workflows/deploy.yml` on every push to `main` (source: **Settings → Pages → GitHub Actions**).

Live URL: https://addulasaikiran-ops.github.io/Videogameeee/

## Android app

See `docs/ANDROID.md` for how to wrap this site into an installable Android app with Capacitor.

Do not commit `node_modules/`, `dist/`, or `.env` files.
