// Renders public/favicon.svg to the PNG icons. Run once: node scripts/make-icons.mjs
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
const svg = fs.readFileSync('public/favicon.svg', 'utf8');
for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  fs.writeFileSync(`public/${name}`, new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());
}
console.log('icons written');
