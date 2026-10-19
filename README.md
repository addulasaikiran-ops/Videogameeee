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
npm run build      # production build → dist/
npm run verify     # sanity-checks dist/ (also runs in CI/deploy)
npm run preview    # serve dist/ locally
```

Vite outputs the production site to `dist/`. The configured base path is `/Videogameeee/`.

## UI layer (React)

All screens/menus/HUD are React 18 components mounted into `#ui-root` over the
Three.js canvas (`src/ui/`). The engine never touches React: `src/ui/UIManager.js`
keeps its original API but writes into a tiny external store
(`src/store/uiStore.js`, built on `useSyncExternalStore`), and React subscribes
to that store. Touch controls stay imperative (`src/ui/TouchControls.js`) since
they feed the input system, not the DOM tree.

Design tokens (colors, elevations, radii, glow, spacing, durations, easings,
type scale) live at the top of `src/styles/main.css` — the whole "night-garden"
theme derives from them.

## Tooling

```bash
npm run lint       # eslint (flat config, JSX aware)
npm run format     # prettier over src/
npm run assets     # regenerate PNG icons (zero-dep) + audit public/ sizes
npm run fonts      # re-subset the self-hosted fonts (needs python+fonttools+brotli)
```

Fonts are self-hosted: `public/fonts/` holds 45 unicode-sliced woff2 subsets of
Cormorant Garamond + Nunito (~323 kB). Re-run `npm run fonts` if the type system
changes — the game works fully offline.

## Optional companion server

The game works 100% without a backend. If you want leaderboard + cloud-save
sync, `server/` is a tiny Express app with no database (JSON files):

```bash
npm run server     # http://localhost:8787 (health: /api/health)
```

Then set `VITE_API_URL=http://localhost:8787` (copy `.env.example` → `.env`,
never commit `.env`) before building. Without it every API call is a silent
no-op. Endpoints: `GET /api/health` · `POST|GET /api/cloud-save/:playerId` ·
`POST|GET /api/leaderboard`.

## Project layout

```
src/
  core/      Game state machine, loop, input, camera, save, audio
  player/    Player physics + animation states
  gameplay/  Platforms, collectibles, hazards, checkpoints, doors,
             enemies, projectiles, boss, particles
  levels/    Level data + decor themes + LevelManager
  story/     Dialogue manager, cutscenes, all story text
  ui/        React screens (App/screens/hud/ceremony/credits), UIManager
             bridge, imperative TouchControls
  store/     uiStore — engine→React state channel
  utils/     api.js — optional server client (no-op without VITE_API_URL)
  styles/    main.css — design tokens + all UI styling
server/      optional Express companion (health, cloud save, leaderboard)
scripts/     optimize-assets, subset-fonts, verify-build
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
