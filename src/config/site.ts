/**
 * Site-wide settings. Brand, people and legal details live here — change them in one place.
 * Everything in [BRACKETS] is a placeholder that must be filled before launch
 * (the build prints a warning while any remain).
 */
export const SITE = {
  /** Brand (domain taktfino.com) – run the trademark checks before launch */
  name: 'Taktfino',
  url: (import.meta.env.SITE_URL || 'https://taktfino.com').replace(/\/$/, ''),
  /** Brand profiles for Organization.sameAs (X, YouTube, Pinterest, LinkedIn…) */
  sameAs: [] as string[],
  contactEmail: 'kontakt@taktfino.com', // create via Cloudflare Email Routing → forwards to your inbox
} as const;

/** Legal notice (Impressum, § 5 DDG). Real name and a summonable postal address are required in Germany. */
export const IMPRINT = {
  name: 'Farhan Javed',
  street: 'House No. 555, J Block, Al Rehman Garden Phase 2',
  city: 'Lahore',
  country: 'Pakistan',
  email: 'kontakt@taktfino.com',
  phone: '', // optional; a second fast contact channel (form or phone) is recommended
  vatId: '', // USt-IdNr., if any
  responsibleForContent: 'Farhan Javed, Anschrift wie oben', // § 18 Abs. 2 MStV
};

/**
 * Mirrors the AUTO_PUBLISH switch of the content bots (.github/workflows: on unless the repo variable AUTO_PUBLISH = 'false').
 * Keeps the editorial policy honest: when true it does not promise a human review of every page.
 * Change both together.
 */
export const AUTO_PUBLISH = true;

/** Authors and reviewers (E-E-A-T). Pages reference them by id. */
export const PEOPLE = {
  author: {
    id: 'autor',
    name: 'Farhan Javed',
    role: { de: 'Gründer & Entwickler', es: 'Fundador y desarrollador', 'pt-br': 'Fundador e desenvolvedor', en: 'Founder & developer' },
    bio: {
      de: 'Farhan Javed ist Principal Software Engineer und leitet Architektur und Entwicklung einer SaaS-Plattform, mit der Organisationen weltweit virtuelle, hybride und Präsenz-Veranstaltungen durchführen. Er hat Taktfino gegründet, um Rechner für Arbeitszeit, Lohn und Datum zu bauen, die nach den gesetzlichen Regeln rechnen und deren Rechenlogik automatisch getestet wird.',
      es: 'Farhan Javed es Principal Software Engineer y dirige la arquitectura y el desarrollo de una plataforma SaaS para eventos virtuales, híbridos y presenciales de organizaciones de todo el mundo. Fundó Taktfino para crear calculadoras de horas, salario y fechas con lógica probada automáticamente.',
      'pt-br': 'Farhan Javed é Principal Software Engineer e lidera a arquitetura e o desenvolvimento de uma plataforma SaaS de eventos virtuais, híbridos e presenciais para organizações do mundo todo. Fundou a Taktfino para criar calculadoras de horas, salário e datas com lógica testada automaticamente.',
      en: 'Farhan Javed is a Principal Software Engineer who leads architecture and engineering for a SaaS platform that runs virtual, hybrid and in-person events for organizations worldwide. He founded Taktfino to build work-time, pay and date calculators whose logic is covered by automated tests.',
    },
    sameAs: [] as string[],
  },
  reviewer: {
    id: 'pruefer',
    /** Empty = no human reviewer yet: the About page and schema then show only the author. */
    name: '',
    role: { de: 'Fachliche Prüfung (Muttersprachler)', es: 'Revisión', 'pt-br': 'Revisão', en: 'Reviewer' },
    bio: { de: '', es: '', 'pt-br': '', en: '' },
    sameAs: [] as string[],
  },
} as const;
export type PersonId = keyof typeof PEOPLE;
export const hasReviewer = () => PEOPLE.reviewer.name.trim() !== '';

export const ADS = {
  client: import.meta.env.PUBLIC_ADSENSE_CLIENT || '',
  slots: {
    leaderboard: import.meta.env.PUBLIC_AD_SLOT_LEADERBOARD || '',
    rectangle: import.meta.env.PUBLIC_AD_SLOT_RECTANGLE || '',
    skyscraper: import.meta.env.PUBLIC_AD_SLOT_SKYSCRAPER || '',
    mobile: import.meta.env.PUBLIC_AD_SLOT_MOBILE || '',
  },
};
export const adsEnabled = () => ADS.client.startsWith('ca-pub-');

/** Google Analytics 4 measurement ID (G-XXXX). Runs with Consent Mode v2 (denied until the visitor agrees). */
export const GA4_ID = import.meta.env.PUBLIC_GA4_ID || '';
/** Cloudflare Web Analytics token (cookieless). Can run alongside or instead of GA4. */
export const CF_ANALYTICS_TOKEN = import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN || '';
/** Cloudflare Web Analytics switched on in the Cloudflare dashboard (automatic setup, script injected by Cloudflare). Keeps the privacy policy accurate. */
export const CF_WEB_ANALYTICS_AUTO = true;
export const GSC_VERIFICATION = import.meta.env.PUBLIC_GSC_VERIFICATION || '';
export const BING_VERIFICATION = import.meta.env.PUBLIC_BING_VERIFICATION || '';
