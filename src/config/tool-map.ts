/**
 * Tool ID → slug per language, plus categories. The tool logic in src/tools/ is language-free;
 * everything a visitor reads comes from src/i18n/*.json and src/content/.
 */
import type { LocaleCode } from './locales';

export type ToolId = 'worktime' | 'hours' | 'workdays' | 'wage' | 'overtime' | 'days' | 'age' | 'week' | 'minutes' | 'timesheet';
export type CategoryId = 'work' | 'pay' | 'dates';

export const CATEGORIES: Record<CategoryId, Record<LocaleCode, string>> = {
  work: { de: 'arbeitszeit', es: 'trabajo', 'pt-br': 'trabalho', en: 'work' },
  pay: { de: 'lohn-gehalt', es: 'salario', 'pt-br': 'salario', en: 'pay' },
  dates: { de: 'datum', es: 'fechas', 'pt-br': 'datas', en: 'dates' },
};

export interface ToolDef {
  id: ToolId;
  category: CategoryId;
  slug: Record<LocaleCode, string>;
  /** Money tool (multi-input / legal data) vs supporting tool, per the AI-era filter */
  priority: 'money' | 'supporting';
  icon: 'clock' | 'cal' | 'pct' | 'hour' | 'cake' | 'calAdd' | 'print';
}

export const TOOLS: ToolDef[] = [
  { id: 'worktime', category: 'work', priority: 'money', icon: 'clock', slug: { de: 'arbeitszeitrechner', es: 'calculadora-horas-trabajadas', 'pt-br': 'calculadora-horas-trabalhadas', en: 'work-hours-calculator' } },
  { id: 'hours', category: 'work', priority: 'money', icon: 'hour', slug: { de: 'stundenrechner', es: 'calculadora-de-horas', 'pt-br': 'calculadora-de-horas', en: 'hours-calculator' } },
  { id: 'timesheet', category: 'work', priority: 'money', icon: 'print', slug: { de: 'stundenzettel', es: 'hoja-de-horas', 'pt-br': 'folha-de-ponto', en: 'timesheet' } },
  { id: 'workdays', category: 'work', priority: 'money', icon: 'cal', slug: { de: 'arbeitstage-rechner', es: 'calculadora-dias-laborables', 'pt-br': 'calculadora-dias-uteis', en: 'working-days-calculator' } },
  { id: 'wage', category: 'pay', priority: 'money', icon: 'pct', slug: { de: 'stundenlohnrechner', es: 'calculadora-salario-por-hora', 'pt-br': 'calculadora-salario-por-hora', en: 'hourly-wage-calculator' } },
  { id: 'overtime', category: 'work', priority: 'money', icon: 'calAdd', slug: { de: 'ueberstundenrechner', es: 'calculadora-horas-extras', 'pt-br': 'calculadora-horas-extras', en: 'overtime-calculator' } },
  { id: 'minutes', category: 'work', priority: 'supporting', icon: 'hour', slug: { de: 'minuten-in-stunden', es: 'minutos-a-horas', 'pt-br': 'minutos-em-horas', en: 'minutes-to-hours' } },
  { id: 'days', category: 'dates', priority: 'supporting', icon: 'cal', slug: { de: 'tage-rechner', es: 'calculadora-de-dias', 'pt-br': 'calculadora-de-dias', en: 'days-calculator' } },
  { id: 'week', category: 'dates', priority: 'supporting', icon: 'cal', slug: { de: 'kalenderwoche', es: 'semana-del-ano', 'pt-br': 'semana-do-ano', en: 'week-number' } },
  { id: 'age', category: 'dates', priority: 'supporting', icon: 'cake', slug: { de: 'alter-berechnen', es: 'calculadora-de-edad', 'pt-br': 'calcular-idade', en: 'age-calculator' } },
];

export const getTool = (id: ToolId) => TOOLS.find((t) => t.id === id)!;
export const toolPath = (id: ToolId, locale: LocaleCode) => `/${locale}/${getTool(id).slug[locale]}/`;
export const categoryPath = (id: CategoryId, locale: LocaleCode) => `/${locale}/${CATEGORIES[id][locale]}/`;

/**
 * Real-data variants (/de/arbeitstage-rechner/bayern/). Strict rule: only pages with genuinely different data.
 * `live` = built and indexed. Start with the 5 biggest states; review after 8 weeks before adding more.
 */
export interface RegionDef { code: string; country: 'DE' | 'AT' | 'CH'; slug: Partial<Record<LocaleCode, string>>; name: Partial<Record<LocaleCode, string>>; live: boolean }
export const REGIONS: RegionDef[] = [
  { code: 'nw', country: 'DE', slug: { de: 'nordrhein-westfalen' }, name: { de: 'Nordrhein-Westfalen' }, live: true },
  { code: 'by', country: 'DE', slug: { de: 'bayern' }, name: { de: 'Bayern' }, live: true },
  { code: 'bw', country: 'DE', slug: { de: 'baden-wuerttemberg' }, name: { de: 'Baden-Württemberg' }, live: true },
  { code: 'ni', country: 'DE', slug: { de: 'niedersachsen' }, name: { de: 'Niedersachsen' }, live: true },
  { code: 'he', country: 'DE', slug: { de: 'hessen' }, name: { de: 'Hessen' }, live: true },
  { code: 'be', country: 'DE', slug: { de: 'berlin' }, name: { de: 'Berlin' }, live: false },
  { code: 'bb', country: 'DE', slug: { de: 'brandenburg' }, name: { de: 'Brandenburg' }, live: false },
  { code: 'hb', country: 'DE', slug: { de: 'bremen' }, name: { de: 'Bremen' }, live: false },
  { code: 'hh', country: 'DE', slug: { de: 'hamburg' }, name: { de: 'Hamburg' }, live: false },
  { code: 'mv', country: 'DE', slug: { de: 'mecklenburg-vorpommern' }, name: { de: 'Mecklenburg-Vorpommern' }, live: false },
  { code: 'rp', country: 'DE', slug: { de: 'rheinland-pfalz' }, name: { de: 'Rheinland-Pfalz' }, live: false },
  { code: 'sl', country: 'DE', slug: { de: 'saarland' }, name: { de: 'Saarland' }, live: false },
  { code: 'sn', country: 'DE', slug: { de: 'sachsen' }, name: { de: 'Sachsen' }, live: false },
  { code: 'st', country: 'DE', slug: { de: 'sachsen-anhalt' }, name: { de: 'Sachsen-Anhalt' }, live: false },
  { code: 'sh', country: 'DE', slug: { de: 'schleswig-holstein' }, name: { de: 'Schleswig-Holstein' }, live: false },
  { code: 'th', country: 'DE', slug: { de: 'thueringen' }, name: { de: 'Thüringen' }, live: false },
  { code: 'at', country: 'AT', slug: { de: 'oesterreich' }, name: { de: 'Österreich' }, live: false },
  { code: 'ch-zh', country: 'CH', slug: { de: 'schweiz-zuerich' }, name: { de: 'Schweiz (Kanton Zürich)' }, live: false },
];

/** Static pages, slug per language */
export type PageId = 'about' | 'contact' | 'imprint' | 'privacy' | 'terms' | 'editorial' | 'search' | 'history' | 'guides';
export const PAGES: Record<PageId, Record<LocaleCode, string>> = {
  about: { de: 'ueber-uns', es: 'sobre-nosotros', 'pt-br': 'sobre', en: 'about' },
  contact: { de: 'kontakt', es: 'contacto', 'pt-br': 'contato', en: 'contact' },
  imprint: { de: 'impressum', es: 'aviso-legal', 'pt-br': 'aviso-legal', en: 'imprint' },
  privacy: { de: 'datenschutz', es: 'privacidad', 'pt-br': 'privacidade', en: 'privacy' },
  terms: { de: 'nutzungsbedingungen', es: 'terminos', 'pt-br': 'termos', en: 'terms' },
  editorial: { de: 'redaktionelle-richtlinien', es: 'politica-editorial', 'pt-br': 'politica-editorial', en: 'editorial-policy' },
  search: { de: 'suche', es: 'buscar', 'pt-br': 'busca', en: 'search' },
  history: { de: 'verlauf', es: 'historial', 'pt-br': 'historico', en: 'history' },
  guides: { de: 'ratgeber', es: 'guias', 'pt-br': 'guias', en: 'guides' },
};
export const pagePath = (id: PageId, locale: LocaleCode) => `/${locale}/${PAGES[id][locale]}/`;
