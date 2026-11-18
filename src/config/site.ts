/**
 * Site-wide settings. Brand, people and legal details live here — change them in one place.
 * Everything in [BRACKETS] is a placeholder that must be filled before launch
 * (the build prints a warning while any remain).
 */
export const SITE = {
  /** Brandable name (placeholder until the brand + trademark checks are done) */
  name: '[Brand]',
  url: (import.meta.env.SITE_URL || 'https://www.example.com').replace(/\/$/, ''),
  /** Brand profiles for Organization.sameAs (X, YouTube, Pinterest, LinkedIn…) */
  sameAs: [] as string[],
  contactEmail: '[kontakt@example.com]',
} as const;

/** Legal notice (Impressum, § 5 DDG). Real name and a summonable postal address are required in Germany. */
export const IMPRINT = {
  name: '[Vor- und Nachname / Firmenname]',
  street: '[Straße und Hausnummer]',
  city: '[PLZ Ort]',
  country: '[Land]',
  email: '[kontakt@example.com]',
  phone: '', // optional; a second fast contact channel (form or phone) is recommended
  vatId: '', // USt-IdNr., if any
  responsibleForContent: '[Name, Anschrift wie oben]', // § 18 Abs. 2 MStV
};

/** Authors and reviewers (E-E-A-T). Pages reference them by id. */
export const PEOPLE = {
  author: {
    id: 'autor',
    name: '[Autor Name]',
    role: { de: 'Gründer & Autor', es: 'Fundador y autor', 'pt-br': 'Fundador e autor', en: 'Founder & author' },
    bio: { de: '[Kurze Biografie: wer Sie sind, Erfahrung mit Arbeitszeit/Lohn/Tools, warum man Ihnen vertrauen kann.]', es: '', 'pt-br': '', en: '' },
    sameAs: [] as string[],
  },
  reviewer: {
    id: 'pruefer',
    name: '[Reviewer Name]',
    role: { de: 'Fachliche Prüfung (Muttersprachler)', es: 'Revisión', 'pt-br': 'Revisão', en: 'Reviewer' },
    bio: { de: '[Kurze Biografie des Prüfers: z. B. HR-/Lohnbuchhaltungs-Erfahrung.]', es: '', 'pt-br': '', en: '' },
    sameAs: [] as string[],
  },
} as const;
export type PersonId = keyof typeof PEOPLE;

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
export const GSC_VERIFICATION = import.meta.env.PUBLIC_GSC_VERIFICATION || '';
export const BING_VERIFICATION = import.meta.env.PUBLIC_BING_VERIFICATION || '';
