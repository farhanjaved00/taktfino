/**
 * Tool ID → slug per language, plus categories. The tool logic in src/tools/ is language-free;
 * everything a visitor reads comes from src/i18n/*.json and src/content/.
 */
import type { LocaleCode } from './locales';

export type ToolId = 'worktime' | 'hours' | 'workdays' | 'wage' | 'overtime' | 'days' | 'age' | 'week' | 'minutes' | 'timesheet' | 'notice' | 'surcharge' | 'maternity' | 'parental' | 'vacation';
export type CategoryId = 'work' | 'pay' | 'dates';

export const CATEGORIES: Record<CategoryId, Record<LocaleCode, string>> = {
  work: { de: 'arbeitszeit', es: 'trabajo', 'pt-br': 'trabalho', en: 'work', nl: 'werktijd', fr: 'temps-de-travail', pl: 'czas-pracy', it: 'orario-di-lavoro' },
  pay: { de: 'lohn-gehalt', es: 'salario', 'pt-br': 'salario', en: 'pay', nl: 'loon', fr: 'salaire', pl: 'wynagrodzenie', it: 'stipendio' },
  dates: { de: 'datum', es: 'fechas', 'pt-br': 'datas', en: 'dates', nl: 'datum', fr: 'dates', pl: 'daty', it: 'date' },
};

export interface ToolDef {
  id: ToolId;
  /** 'universal' = offered in every language; 'de' = depends on German/DACH law (added per country once its rules are coded + tested) */
  scope?: 'universal' | 'de';
  category: CategoryId;
  slug: Record<LocaleCode, string>;
  /** Money tool (multi-input / legal data) vs supporting tool, per the AI-era filter */
  priority: 'money' | 'supporting';
  icon: 'clock' | 'cal' | 'pct' | 'hour' | 'cake' | 'calAdd' | 'print';
}

export const TOOLS: ToolDef[] = [
  { id: 'worktime', category: 'work', priority: 'money', icon: 'clock', slug: { de: 'arbeitszeitrechner', es: 'calculadora-horas-trabajadas', 'pt-br': 'calculadora-horas-trabalhadas', en: 'work-hours-calculator', nl: 'werkuren-berekenen', fr: 'calcul-heures-travaillees', pl: 'kalkulator-godzin-pracy', it: 'calcolo-ore-lavorate' } },
  { id: 'hours', category: 'work', priority: 'money', icon: 'hour', slug: { de: 'stundenrechner', es: 'calculadora-de-horas', 'pt-br': 'calculadora-de-horas', en: 'hours-calculator', nl: 'uren-berekenen', fr: 'calcul-heure', pl: 'kalkulator-godzin', it: 'calcolo-ore' } },
  { id: 'timesheet', category: 'work', priority: 'money', icon: 'print', slug: { de: 'stundenzettel', es: 'hoja-de-horas', 'pt-br': 'folha-de-ponto', en: 'timesheet', nl: 'urenregistratie', fr: 'feuille-de-temps', pl: 'karta-czasu-pracy', it: 'foglio-ore' } },
  { id: 'workdays', category: 'work', priority: 'money', icon: 'cal', slug: { de: 'arbeitstage-rechner', es: 'calculadora-dias-laborables', 'pt-br': 'calculadora-dias-uteis', en: 'working-days-calculator', nl: 'werkdagen-berekenen', fr: 'calcul-jours-ouvres', pl: 'kalkulator-dni-roboczych', it: 'calcolo-giorni-lavorativi' } },
  { id: 'wage', category: 'pay', priority: 'money', icon: 'pct', slug: { de: 'stundenlohnrechner', es: 'calculadora-salario-por-hora', 'pt-br': 'calculadora-salario-por-hora', en: 'hourly-wage-calculator', nl: 'uurloon-berekenen', fr: 'calcul-salaire-horaire', pl: 'kalkulator-stawki-godzinowej', it: 'calcolo-paga-oraria' } },
  { id: 'notice', category: 'work', priority: 'money', icon: 'calAdd', slug: { de: 'kuendigungsfrist-rechner', es: 'calculadora-preaviso', 'pt-br': 'calculadora-aviso-previo', en: 'notice-period-calculator', nl: 'opzegtermijn-berekenen', fr: 'calcul-preavis', pl: 'okres-wypowiedzenia', it: 'calcolo-preavviso' } },
  { id: 'overtime', category: 'work', priority: 'money', icon: 'calAdd', slug: { de: 'ueberstundenrechner', es: 'calculadora-horas-extras', 'pt-br': 'calculadora-horas-extras', en: 'overtime-calculator', nl: 'overuren-berekenen', fr: 'calcul-heures-supplementaires', pl: 'kalkulator-nadgodzin', it: 'calcolo-straordinari' } },
  { id: 'minutes', category: 'work', priority: 'supporting', icon: 'hour', slug: { de: 'minuten-in-stunden', es: 'minutos-a-horas', 'pt-br': 'minutos-em-horas', en: 'minutes-to-hours', nl: 'minuten-naar-uren', fr: 'minutes-en-heures', pl: 'minuty-na-godziny', it: 'minuti-in-ore' } },
  { id: 'surcharge', category: 'pay', priority: 'money', icon: 'pct', slug: { de: 'zuschlagsrechner', es: 'calculadora-recargos', 'pt-br': 'calculadora-adicionais', en: 'shift-premium-calculator', nl: 'toeslag-berekenen', fr: 'calcul-majoration', pl: 'kalkulator-dodatkow', it: 'calcolo-maggiorazioni' } },
  { id: 'maternity', category: 'dates', priority: 'money', icon: 'cal', slug: { de: 'mutterschutz-rechner', es: 'calculadora-baja-maternidad', 'pt-br': 'calculadora-licenca-maternidade', en: 'maternity-leave-calculator', nl: 'zwangerschapsverlof-berekenen', fr: 'calcul-conge-maternite', pl: 'kalkulator-macierzynskiego', it: 'calcolo-maternita' } },
  { id: 'parental', category: 'dates', priority: 'money', icon: 'cal', slug: { de: 'elternzeit-rechner', es: 'calculadora-excedencia-cuidado-hijos', 'pt-br': 'calculadora-licenca-parental', en: 'parental-leave-calculator', nl: 'ouderschapsverlof-berekenen', fr: 'calcul-conge-parental', pl: 'urlop-rodzicielski', it: 'congedo-parentale' } },
  { id: 'vacation', category: 'work', priority: 'money', icon: 'calAdd', slug: { de: 'urlaubsrechner', es: 'calculadora-vacaciones', 'pt-br': 'calculadora-ferias', en: 'vacation-calculator', nl: 'vakantiedagen-berekenen', fr: 'calcul-conges-payes', pl: 'kalkulator-urlopu', it: 'calcolo-ferie' } },
  { id: 'days', category: 'dates', priority: 'supporting', icon: 'cal', slug: { de: 'tage-rechner', es: 'calculadora-de-dias', 'pt-br': 'calculadora-de-dias', en: 'days-calculator', nl: 'dagen-berekenen', fr: 'calcul-jours-entre-deux-dates', pl: 'kalkulator-dni', it: 'calcolo-giorni-tra-due-date' } },
  { id: 'week', category: 'dates', priority: 'supporting', icon: 'cal', slug: { de: 'kalenderwoche', es: 'semana-del-ano', 'pt-br': 'semana-do-ano', en: 'week-number', nl: 'weeknummer', fr: 'numero-de-semaine', pl: 'tydzien-roku', it: 'numero-settimana' } },
  { id: 'age', category: 'dates', priority: 'supporting', icon: 'cake', slug: { de: 'alter-berechnen', es: 'calculadora-de-edad', 'pt-br': 'calcular-idade', en: 'age-calculator', nl: 'leeftijd-berekenen', fr: 'calcul-age', pl: 'kalkulator-wieku', it: 'calcolo-eta' } },
];

export const UNIVERSAL: ToolId[] = ['hours', 'minutes', 'days', 'age', 'week', 'wage', 'overtime', 'timesheet'];
/** Tools offered in a language (menus, home, footer, related links) */
export const toolsFor = (locale: LocaleCode) => TOOLS.filter((t) => locale === 'de' || UNIVERSAL.includes(t.id));
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
  { code: 'be', country: 'DE', slug: { de: 'berlin' }, name: { de: 'Berlin' }, live: true },
  { code: 'bb', country: 'DE', slug: { de: 'brandenburg' }, name: { de: 'Brandenburg' }, live: true },
  { code: 'hb', country: 'DE', slug: { de: 'bremen' }, name: { de: 'Bremen' }, live: true },
  { code: 'hh', country: 'DE', slug: { de: 'hamburg' }, name: { de: 'Hamburg' }, live: true },
  { code: 'mv', country: 'DE', slug: { de: 'mecklenburg-vorpommern' }, name: { de: 'Mecklenburg-Vorpommern' }, live: true },
  { code: 'rp', country: 'DE', slug: { de: 'rheinland-pfalz' }, name: { de: 'Rheinland-Pfalz' }, live: true },
  { code: 'sl', country: 'DE', slug: { de: 'saarland' }, name: { de: 'Saarland' }, live: true },
  { code: 'sn', country: 'DE', slug: { de: 'sachsen' }, name: { de: 'Sachsen' }, live: true },
  { code: 'st', country: 'DE', slug: { de: 'sachsen-anhalt' }, name: { de: 'Sachsen-Anhalt' }, live: true },
  { code: 'sh', country: 'DE', slug: { de: 'schleswig-holstein' }, name: { de: 'Schleswig-Holstein' }, live: true },
  { code: 'th', country: 'DE', slug: { de: 'thueringen' }, name: { de: 'Thüringen' }, live: true },
  { code: 'at', country: 'AT', slug: { de: 'oesterreich' }, name: { de: 'Österreich' }, live: false },
  { code: 'ch-zh', country: 'CH', slug: { de: 'schweiz-zuerich' }, name: { de: 'Schweiz (Kanton Zürich)' }, live: false },
];

/** Static pages, slug per language */
export type PageId = 'about' | 'contact' | 'imprint' | 'privacy' | 'terms' | 'editorial' | 'search' | 'history' | 'guides';
export const PAGES: Record<PageId, Record<LocaleCode, string>> = {
  about: { de: 'ueber-uns', es: 'sobre-nosotros', 'pt-br': 'sobre', en: 'about', nl: 'over-ons', fr: 'a-propos', pl: 'o-nas', it: 'chi-siamo' },
  contact: { de: 'kontakt', es: 'contacto', 'pt-br': 'contato', en: 'contact', nl: 'contact', fr: 'contact', pl: 'kontakt', it: 'contatti' },
  imprint: { de: 'impressum', es: 'aviso-legal', 'pt-br': 'aviso-legal', en: 'imprint', nl: 'colofon', fr: 'mentions-legales', pl: 'nota-prawna', it: 'note-legali' },
  privacy: { de: 'datenschutz', es: 'privacidad', 'pt-br': 'privacidade', en: 'privacy', nl: 'privacy', fr: 'confidentialite', pl: 'prywatnosc', it: 'privacy' },
  terms: { de: 'nutzungsbedingungen', es: 'terminos', 'pt-br': 'termos', en: 'terms', nl: 'voorwaarden', fr: 'conditions', pl: 'regulamin', it: 'termini' },
  editorial: { de: 'redaktionelle-richtlinien', es: 'politica-editorial', 'pt-br': 'politica-editorial', en: 'editorial-policy', nl: 'redactiebeleid', fr: 'politique-editoriale', pl: 'polityka-redakcyjna', it: 'linee-editoriali' },
  search: { de: 'suche', es: 'buscar', 'pt-br': 'busca', en: 'search', nl: 'zoeken', fr: 'recherche', pl: 'szukaj', it: 'cerca' },
  history: { de: 'verlauf', es: 'historial', 'pt-br': 'historico', en: 'history', nl: 'geschiedenis', fr: 'historique', pl: 'historia', it: 'cronologia' },
  guides: { de: 'ratgeber', es: 'guias', 'pt-br': 'guias', en: 'guides', nl: 'gidsen', fr: 'guides', pl: 'poradniki', it: 'guide' },
};
export const pagePath = (id: PageId, locale: LocaleCode) => `/${locale}/${PAGES[id][locale]}/`;
