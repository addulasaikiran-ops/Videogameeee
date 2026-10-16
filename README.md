# Our Little World

A reconstructed, mobile-first Three.js + Vite personal adventure starter. Photos and media are placeholders until you add your own assets.

## Requirements

- Node.js 22 or newer
- npm
- Git

## First-time setup

From the project folder run:

```bash
npm install
npm run generate-icons
npm run dev
```

`npm install` installs dependencies and creates a local `package-lock.json`. The GitHub Actions workflow uses `npm install` so the first deployment can run even before a lock file exists. The workflow generates the three PNG icons automatically during deployment; you do not need to commit those generated binaries.

## Build and preview

```bash
npm run build
npm run preview
```

Vite outputs the production site to `dist/`. The configured base path is `/Videogameeee/`.

## Generate icons

The source icon is `public/icons/icon.svg`. Run `npm run generate-icons` to create the three PNG icons using `sharp`.

## GitHub Pages deployment

1. Run `npm install` and `npm run generate-icons`.
2. Run `npm run build` and `npm run preview` to check the production build locally.
3. Push your changes to `main`.
4. In GitHub, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
5. Open the **Actions** tab and wait for the build and deploy jobs to succeed.

Live URL: https://addulasaikiran-ops.github.io/Videogameeee/

## Assets and simplified features

- `public/assets/photos/placeholder-beach.svg` is an illustrative placeholder, not a personal photo.
- `public/assets/audio/`, `models/`, and `textures/` contain README notes only. Add your own media files to those directories.
- Music is disabled by default to avoid requesting a nonexistent audio file. After adding `public/assets/audio/music/beach.mp3`, set `this.musicEnabled = true` in `src/audio/AudioManager.js`.
- Runtime URLs for files in `public/` should use `assetUrl()` from `src/core/assetUrl.js`.
- The world scenes are simple Three.js primitives, not imported 3D models; town/cinema/secret are starter scenes.
- There is no password gate, access control, or encryption.

Do not commit `node_modules/`, `dist/`, or `.env` files.