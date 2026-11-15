/** Browser helpers shared by every tool island. */
import { type CalDate, todayIn } from '../lib/dates';
import { icsFile } from '../lib/calendar-links';

export function localToday(): CalDate {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}
export const localTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; } };
export const todayInLocal = () => { try { return todayIn(localTz()); } catch { return localToday(); } };

/** Milliseconds until local midnight at the start of a calendar date. */
export function msUntil(c: CalDate, now = Date.now()): number {
  return new Date(c.y, c.m - 1, c.d).getTime() - now;
}

export function splitMs(ms: number) {
  let s = Math.max(0, Math.floor(Math.abs(ms) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60);
  return { d, h, m, s: s % 60 };
}
export const pad2 = (n: number) => String(n).padStart(2, '0');

let toastTimer: number | undefined;
export function toast(msg: string) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el!.hidden = true; }, 2200);
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); toast('Link copied'); return; } catch { /* fall through */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('Link copied'); } catch { prompt('Copy this link:', text); }
  ta.remove();
}

export function downloadIcs(opts: Parameters<typeof icsFile>[0], filename: string) {
  const blob = new Blob([icsFile(opts)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---- localStorage (always wrapped: private mode, blocked storage, etc.) */
export interface SavedItem { label: string; url: string; detail?: string; at: number }
function read(key: string): SavedItem[] {
  try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function write(key: string, items: SavedItem[]) {
  try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* ignore */ }
}
export const getSaved = () => read('tw-saved');
export const getRecent = () => read('tw-recent');
export function saveItem(item: Omit<SavedItem, 'at'>) {
  const items = getSaved().filter((x) => x.url !== item.url);
  items.unshift({ ...item, at: Date.now() });
  write('tw-saved', items.slice(0, 50));
  toast('Saved — find it under Saved');
}
export function removeSaved(url: string) { write('tw-saved', getSaved().filter((x) => x.url !== url)); }
export function addRecent(item: Omit<SavedItem, 'at'>) {
  const items = getRecent().filter((x) => x.url !== item.url);
  items.unshift({ ...item, at: Date.now() });
  write('tw-recent', items.slice(0, 20));
}
export function clearRecent() { write('tw-recent', []); }

export function setQuery(params: Record<string, string | null>) {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries(params)) { if (v === null || v === '') u.searchParams.delete(k); else u.searchParams.set(k, v); }
  history.replaceState(null, '', u.toString());
  return u.toString();
}

export function renderCalendarCells(cells: { date: CalDate | null; isToday: boolean; isResult: boolean; isWeekend: boolean }[]): string {
  const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<div class="dow" aria-hidden="true">${d}</div>`).join('');
  return dow + cells.map((c) => {
    if (!c.date) return '<div class="c" aria-hidden="true"></div>';
    const cls = ['c', c.isWeekend ? 'we' : '', c.isResult ? 'res' : '', c.isToday ? 'tod' : ''].filter(Boolean).join(' ');
    const label = c.isResult ? ' aria-label="Result date"' : c.isToday ? ' aria-label="Today"' : '';
    return `<div class="${cls}"${label}>${c.date.d}</div>`;
  }).join('');
}
