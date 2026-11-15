/**
 * Site-wide settings. Change the brand, author and contact details here.
 * Domain comes from SITE_URL (env) so previews and production can differ.
 */
export const SITE = {
  name: 'TimeWise',
  tagline: 'Free date, time and everyday calculators for the US, UK and Canada.',
  url: (import.meta.env.SITE_URL || 'https://www.example.com').replace(/\/$/, ''),
  locale: 'en-US',
  twitter: '', // e.g. '@timewise'
  contactEmail: '[CONTACT EMAIL]',
  author: {
    name: '[AUTHOR NAME]',
    bio: '[Short author bio — who you are and why readers can trust these guides.]',
    url: '/about/',
  },
  /** Time zone used for the date baked into static HTML at build time. The browser always recalculates locally. */
  buildTimeZone: 'UTC',
} as const;

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

export const GSC_VERIFICATION = import.meta.env.PUBLIC_GSC_VERIFICATION || '';
