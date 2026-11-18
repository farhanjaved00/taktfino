/** Browser helpers shared by all tools: toast, copy, CSV, share links, history, analytics events, PWA. */

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

export async function copyText(text: string, okMsg: string) {
  try { await navigator.clipboard.writeText(text); toast(okMsg); return; } catch { /* fallback */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast(okMsg); } catch { prompt('', text); }
  ta.remove();
}

/** Excel-friendly CSV for German locales: semicolon separator + UTF-8 BOM */
export function downloadCsv(rows: (string | number)[][], filename: string, sep = ';') {
  const esc = (v: string | number) => { const s = String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(sep)).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** State in the URL (share links). The page's canonical stays the clean URL. */
export function setQuery(params: Record<string, string | null>) {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries(params)) { if (v === null || v === '') u.searchParams.delete(k); else u.searchParams.set(k, v); }
  history.replaceState(null, '', u.toString());
  return u.toString();
}
export const getQuery = () => new URLSearchParams(location.search);

/* ---- local history (localStorage, always wrapped) */
export interface HistoryItem { tool: string; label: string; url: string; at: number }
const HKEY = 'tool-history';
export function getHistory(): HistoryItem[] {
  try { const v = JSON.parse(localStorage.getItem(HKEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function saveHistory(item: Omit<HistoryItem, 'at'>) {
  try {
    const list = getHistory().filter((x) => x.url !== item.url);
    list.unshift({ ...item, at: Date.now() });
    localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 50)));
  } catch { /* ignore */ }
}
export function removeHistory(url: string) { try { localStorage.setItem(HKEY, JSON.stringify(getHistory().filter((x) => x.url !== url))); } catch { /* ignore */ } }
export function clearHistory() { try { localStorage.removeItem(HKEY); } catch { /* ignore */ } }
export function loadState<T>(key: string): T | null { try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; } }
export function storeState(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }

/* ---- analytics events (GA4 if present; no-op otherwise) */
type W = Window & { gtag?: (...a: unknown[]) => void };
export function track(event: 'calculate' | 'copy_result' | 'export' | 'share' | 'lang_switch' | 'pwa_install', params: Record<string, string | number> = {}) {
  const w = window as W;
  if (typeof w.gtag === 'function') w.gtag('event', event, params);
}
/** Debounced 'calculate' so typing doesn't spam events */
let calcTimer: number | undefined;
export function trackCalculate(tool: string) { clearTimeout(calcTimer); calcTimer = window.setTimeout(() => track('calculate', { tool }), 1500); }

/* ---- PWA */
export function registerPwa() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  window.addEventListener('appinstalled', () => track('pwa_install'));
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
    if (a) track(a.dataset.track as 'lang_switch', { to: a.dataset.trackTo || '' });
  });
}

export const fmt = (locale: string, n: number, max = 2, min = 0) => n.toLocaleString(locale, { maximumFractionDigits: max, minimumFractionDigits: min });

/* ---- locale-aware formatting for every language (reads <body data-locale>) */
import { getLocale } from '../config/locales';
type CD = { y: number; m: number; d: number };
const utcNoon = (c: CD) => new Date(Date.UTC(c.y, c.m - 1, c.d, 12));
export const uiLocale = () => (document.body?.dataset.locale || 'de') as Parameters<typeof getLocale>[0];
/** Intl locale tag of the page, e.g. de-DE, es-MX, pt-BR */
export const intl = () => getLocale(uiLocale()).intl;
export const currency = () => getLocale(uiLocale()).currency;
export const dLong = (c: CD) => utcNoon(c).toLocaleDateString(intl(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const dShort = (c: CD) => utcNoon(c).toLocaleDateString(intl(), { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
export const dIsoShort = (iso: string) => dShort({ y: +iso.slice(0, 4), m: +iso.slice(5, 7), d: +iso.slice(8, 10) });
export const wdShort = (c: CD) => utcNoon(c).toLocaleDateString(intl(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
export const monthYear = (y: number, m: number) => utcNoon({ y, m, d: 15 }).toLocaleDateString(intl(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const money = (n: number, cur?: string) => n.toLocaleString(intl(), { style: 'currency', currency: cur || currency() });
