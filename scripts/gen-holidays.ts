/**
 * Writes src/data/holidays/{country}/{region}-{year}.json from the rules in src/tools/holiday-rules.ts.
 *   npm run holidays              → current year + next 2
 *   npm run holidays -- 2029 2030 → specific years
 * Review the diff every November (governments occasionally add one-off holidays).
 */
import fs from 'node:fs';
import path from 'node:path';
import { ALL_REGIONS, holidaysFor } from '../src/tools/holiday-rules';

const now = new Date().getUTCFullYear();
const years = process.argv.slice(2).map(Number).filter(Boolean);
const list = years.length ? years : [now, now + 1, now + 2];
for (const region of ALL_REGIONS) {
  const country = region === 'at' ? 'at' : region.startsWith('ch') ? 'ch' : 'de';
  const file = region.startsWith('ch-') ? region.slice(3) : region;
  const dir = path.join('src/data/holidays', country);
  fs.mkdirSync(dir, { recursive: true });
  for (const y of list) {
    const out = path.join(dir, `${file}-${y}.json`);
    fs.writeFileSync(out, JSON.stringify({ region, year: y, generated: new Date().toISOString().slice(0, 10), reviewed: false, holidays: holidaysFor(region, y) }, null, 2) + '\n');
  }
}
console.log(`holidays written for ${ALL_REGIONS.length} regions × ${list.join(', ')}`);
