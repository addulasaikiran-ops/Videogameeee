// npm run verify — post-build sanity checks (wired into CI + deploy workflow):
//  dist exists, index.html references hashed assets, every public/ file
//  copied through, bundle sizes reported, no accidental sourcemaps/env leaks.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
let fail = 0;
const bad = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (m) => console.log(' ok  ' + m);

if (!existsSync(dist)) { bad('dist/ missing — run npm run build first'); process.exit(1); }

const htmlPath = join(dist, 'index.html');
if (!existsSync(htmlPath)) bad('dist/index.html missing');
else {
  const html = readFileSync(htmlPath, 'utf8');
  /src="\/Videogameeee\/assets\/.+\.js"/.test(html) ? ok('hashed entry script referenced') : bad('no hashed entry script in index.html');
  html.includes('fonts/fonts.css') ? ok('self-hosted fonts.css linked') : bad('fonts.css link missing');
  html.includes('manifest.webmanifest') ? ok('manifest linked') : bad('manifest link missing');
}

const assets = join(dist, 'assets');
if (!existsSync(assets)) bad('dist/assets missing');
else {
  let total = 0, jsTotal = 0;
  for (const f of readdirSync(assets)) {
    const kb = statSync(join(assets, f)).size / 1024;
    total += kb; if (extname(f) === '.js') jsTotal += kb;
    if (f.endsWith('.map')) bad(`sourcemap shipped: ${f}`);
  }
  ok(`assets: ${total.toFixed(0)} kB total, ${jsTotal.toFixed(0)} kB JS`);
  if (jsTotal > 900) bad(`JS bundle ${jsTotal.toFixed(0)} kB over 900 kB budget`);
}

for (const f of ['manifest.webmanifest', 'sw.js', 'asset-manifest.json', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'fonts/fonts.css'])
  existsSync(join(dist, f)) ? ok(`dist has ${f}`) : bad(`dist missing ${f}`);

// leak check: no .env-style secrets inlined into the bundle
for (const f of readdirSync(assets || '.')) {
  if (extname(f) !== '.js') continue;
  const src = readFileSync(join(assets, f), 'utf8');
  if (/AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z]{20,}|-----BEGIN/.test(src)) bad(`possible secret in ${f}`);
}

if (fail) { console.log(`\nverify-build: ${fail} problem(s)`); process.exit(1); }
console.log('\nverify-build: all checks passed');
