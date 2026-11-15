#!/usr/bin/env node
/**
 * Releases the next batch of long-tail pages from src/data/release-plan.json into src/data/release.json.
 * Runs weekly from GitHub Actions; only acts when `intervalDays` have passed since the last release.
 *
 *   node scripts/release-next-batch.mjs            normal run (respects the interval and `paused`)
 *   node scripts/release-next-batch.mjs --force    release the next batch now
 *   node scripts/release-next-batch.mjs --dry-run  show what would happen, change nothing
 *   --now=YYYY-MM-DD                               pretend today is this date (testing)
 *
 * Writes a one-line summary to $RELEASE_SUMMARY (if set) for the commit message.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PLAN = path.join(ROOT, 'src/data/release-plan.json');
const RELEASE = path.join(ROOT, 'src/data/release.json');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const nowArg = args.find((a) => a.startsWith('--now='));
const today = nowArg ? nowArg.slice(6) : new Date().toISOString().slice(0, 10);

const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
const release = JSON.parse(fs.readFileSync(RELEASE, 'utf8'));
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const out = (msg) => { console.log(msg); if (process.env.RELEASE_SUMMARY) fs.writeFileSync(process.env.RELEASE_SUMMARY, msg); };

if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) { console.error(`Bad date: ${today}`); process.exit(1); }
const next = plan.batches.find((b) => !b.releasedOn);
if (!next) { out(''); console.log('All batches are released. Add new batches to release-plan.json.'); process.exit(0); }
if (plan.paused && !FORCE) { out(''); console.log('Releases are paused (release-plan.json → paused: true).'); process.exit(0); }
if (!plan.lastRelease) {
  // first run after launch: start the clock, release nothing yet
  out('');
  if (!DRY && !FORCE) { plan.lastRelease = today; fs.writeFileSync(PLAN, JSON.stringify(plan, null, 2) + '\n'); console.log(`Clock started on ${today}. First batch goes out after ${plan.intervalDays} days.`); process.exit(0); }
}
const since = plan.lastRelease ? days(plan.lastRelease, today) : plan.intervalDays;
if (since < plan.intervalDays && !FORCE) {
  out('');
  console.log(`Not yet: ${since} of ${plan.intervalDays} days since the last release (${plan.lastRelease}). Next: "${next.name}".`);
  process.exit(0);
}

// merge: append the batch's entries to each family (release.ts de-duplicates overlapping ranges)
for (const [family, items] of Object.entries(next.add)) {
  const cur = Array.isArray(release[family]) ? release[family] : [];
  for (const it of items) if (!cur.some((c) => String(c) === String(it))) cur.push(it);
  release[family] = cur;
}
next.releasedOn = today;
plan.lastRelease = today;

const left = plan.batches.filter((b) => !b.releasedOn).length;
if (DRY) {
  console.log(`[dry run] would release "${next.name}" on ${today}. New release.json:\n${JSON.stringify(release, null, 2)}`);
  process.exit(0);
}
fs.writeFileSync(RELEASE, JSON.stringify(release, null, 2) + '\n');
fs.writeFileSync(PLAN, JSON.stringify(plan, null, 2) + '\n');
out(`Release pages: ${next.name} (${left} batch${left === 1 ? '' : 'es'} left)`);
