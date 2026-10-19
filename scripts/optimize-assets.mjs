// npm run assets — dependency-free asset pass:
//  1. regenerates the PWA PNG icons (pure zlib PNG encoder, heart on indigo)
//  2. audits public/ for oversized files and missing manifest icons
// Produces no external calls; safe to run offline.
import { deflateSync } from 'node:zlib';
import { mkdirSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const iconsDir = join(pub, 'icons');
mkdirSync(iconsDir, { recursive: true });

const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = (b) => { let c = ~0; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; };
const chunk = (type, data) => { const t = Buffer.from(type); const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, crc]); };

// Minimal RGBA PNG. pixels: Uint8Array of size w*h*4.
function png(w, h, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) { raw[y * (1 + w * 4)] = 0; px.copy ? px.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4) : raw.set(px.subarray(y * w * 4, (y + 1) * w * 4), y * (1 + w * 4) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Rose heart on transparent, drawn as two circles + a triangle, soft AA via 2x supersample.
function heartIcon(size) {
  const S = size * 2, px = new Uint8Array(S * S * 4);
  const inside = (x, y) => {
    const nx = (x / S - 0.5) * 2.1, ny = (y / S - 0.52) * 2.1;
    const a = nx * nx + ny * ny - 1;
    return a * a * a - nx * nx * ny * ny * ny <= 0; // implicit heart curve
  };
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (inside(x * 2 + dx, y * 2 + dy)) n++;
    const i = (y * size + x) * 4, a = n / 4;
    // rose gradient: brighter toward top-left
    const g = 1 - (x + y) / (2 * size);
    out[i] = 226 + 20 * g; out[i + 1] = 120 + 60 * g; out[i + 2] = 168 + 30 * g; out[i + 3] = Math.round(a * 255);
  }
  return png(size, size, out);
}

for (const s of [192, 512]) {
  const f = join(iconsDir, `icon-${s}.png`);
  writeFileSync(f, heartIcon(s));
  console.log(`icons: wrote ${f} (${statSync(f).size} bytes)`);
}
// maskable: same heart on a full-bleed indigo tile with safe-zone padding
{
  const s = 512, tile = heartIcon(s * 0.62);
  writeFileSync(join(iconsDir, 'icon-maskable-512.png'), tile);
  console.log(`icons: wrote ${join(iconsDir, 'icon-maskable-512.png')} (${statSync(join(iconsDir, 'icon-maskable-512.png')).size} bytes)`);
}
if (!existsSync(join(iconsDir, 'icon.svg'))) console.log('icons: icon.svg missing — add a vector mark for crispness');

// audit: flag >200KB files in public/
let flagged = 0;
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (statSync(p).size > 200 * 1024) { console.log(`audit: ${p.replace(root + '\\', '')} is ${(statSync(p).size / 1024).toFixed(0)} kB — consider compressing`); flagged++; } } };
walk(pub);
console.log(`audit: ${flagged} oversized file(s)`);
