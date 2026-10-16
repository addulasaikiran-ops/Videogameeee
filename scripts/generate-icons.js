import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const source=resolve('public/icons/icon.svg');
const output=resolve('public/icons');
await mkdir(output,{recursive:true});
for(const size of [192,512]) await sharp(source).resize(size,size).png().toFile(resolve(output,`icon-${size}.png`));
await sharp(source).resize(512,512).png().toFile(resolve(output,'icon-maskable-512.png'));
console.log('Generated PNG icons in public/icons/.');
