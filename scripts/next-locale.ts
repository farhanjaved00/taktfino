#!/usr/bin/env tsx
/**
 * Prints the language that is due for launch according to src/data/language-schedule.json, or nothing.
 * Due = its month (counted from launchDate) has been reached AND every language before it is already live.
 *   npx tsx scripts/next-locale.ts            → e.g. "es"
 */
import fs from 'node:fs';
import { LOCALES } from '../src/config/locales';

const s = JSON.parse(fs.readFileSync(new URL('../src/data/language-schedule.json', import.meta.url), 'utf8')) as { launchDate: string; order: { code: string; month: number }[] };
const start = new Date(s.launchDate);
const now = new Date(process.env.NOW || Date.now());
const months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
const live = (c: string) => LOCALES.find((l) => l.code === c)?.live;
const next = s.order.find((o) => !live(o.code));
if (next && months >= next.month) process.stdout.write(next.code);
else console.error(next ? `next: ${next.code} in month ${next.month} (now month ${months})` : 'all languages live');
