# Our Little World

A reconstructed, mobile-first Three.js + Vite personal adventure game starter. This repository uses placeholder assets until you add your own photos, audio, models, and textures.

## Requirements

- Node.js 22 or newer
- npm

## Setup

```bash
npm ci
npm run generate-icons
npm run dev
```

## Production build

```bash
npm ci
npm run generate-icons
npm run build
npm run preview
```

## GitHub Pages

The Vite base path is `/Videogameeee/`. In repository Settings → Pages, set Source to GitHub Actions. Pushes to `main` trigger `.github/workflows/deploy.yml`.

Live URL: https://addulasaikiran-ops.github.io/Videogameeee/

## Assets

Put public files under `public/assets/` and reference runtime URLs with `assetUrl()` from `src/core/assetUrl.js`. Replace the placeholder SVG and add your own audio/model files when ready. The project does not include original personal photos or recordings.

## Privacy

No password gate, access control, or encryption is included. Do not commit secrets or private credentials.