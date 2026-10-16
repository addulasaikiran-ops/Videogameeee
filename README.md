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

`npm install` creates the local `package-lock.json`. The repository intentionally does not include a lock file or generated binary PNG icons. After the install and icon-generation commands succeed, commit `package-lock.json` and `public/icons/icon-192.png`, `public/icons/icon-512.png`, and `public/icons/icon-maskable-512.png` before expecting GitHub Actions to pass.

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
3. Commit `package-lock.json` and the three generated PNG icons.
4. Push your changes to `main`.
5. In GitHub, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
6. Open the **Actions** tab and wait for the build and deploy jobs to succeed.

Live URL: https://addulasaikiran-ops.github.io/Videogameeee/

## Assets and simplified features

- `public/assets/photos/placeholder-beach.svg` is an illustrative placeholder, not a personal photo.
- `public/assets/audio/`, `models/`, and `textures/` contain README notes only. Add your own media files to enable those features.
- `src/audio/AudioManager.js` expects `assets/audio/music/beach.mp3`; without that file, music will not play.
- Runtime URLs for files in `public/` should use `assetUrl()` from `src/core/assetUrl.js`.
- The world scenes are simple Three.js primitives, not imported 3D models.
- There is no password gate, access control, or encryption.

Do not commit `node_modules/`, `dist/`, or `.env` files.