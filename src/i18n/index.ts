import de from './de.json';
import es from './es.json';
import ptbr from './pt-br.json';
import en from './en.json';
import { LOCALES, type LocaleCode } from '../config/locales';

const DICTS: Record<LocaleCode, Record<string, unknown>> = { de, es, 'pt-br': ptbr, en };

function lookup(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** t('de', 'warn.break_short', { required: 30 }) */
export function t(locale: LocaleCode, key: string, vars: Record<string, string | number> = {}): string {
  const v = lookup(DICTS[locale], key);
  if (typeof v !== 'string') throw new Error(`i18n: missing "${key}" for ${locale}`);
  return v.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
export const dict = (locale: LocaleCode) => DICTS[locale];

/** Build-time guard: a live language must have every key that German has. */
function keys(o: unknown, p = ''): string[] {
  if (!o || typeof o !== 'object') return [p];
  return Object.entries(o as object).flatMap(([k, v]) => (k.startsWith('$') ? [] : keys(v, p ? `${p}.${k}` : k)));
}
for (const l of LOCALES.filter((x) => x.live && x.code !== 'de')) {
  const missing = keys(de).filter((k) => typeof lookup(DICTS[l.code], k) !== 'string');
  if (missing.length) throw new Error(`i18n: live locale ${l.code} is missing ${missing.length} keys, e.g. ${missing.slice(0, 5).join(', ')}`);
}
