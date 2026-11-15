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
    /** Optional profile links that prove who the author is (LinkedIn, X, personal site). Used in schema. */
    sameAs: [] as string[],
  },
  /**
   * Time zone for the date baked into static HTML. US Eastern = the main market and where Google's crawlers
   * mostly run, so the HTML date matches what US searchers see. The daily rebuild runs at 05:10 UTC
   * (00:10 Eastern in winter, 01:10 in summer). The browser always recalculates locally anyway.
   */
  buildTimeZone: 'America/New_York',
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
/**
 * 'google' (default, recommended): use Google's own certified consent message (AdSense → Privacy & messaging).
 *   Required by Google for personalised ads in the UK/EEA/Switzerland. Our own banner is not shown.
 * 'banner': our simple banner (accept / non-personalised). Only use if you keep ads non-personalised in the UK/EEA.
 */
export const CONSENT_MODE: 'google' | 'banner' = import.meta.env.PUBLIC_CONSENT_MODE === 'banner' ? 'banner' : 'google';

/** Cloudflare Web Analytics (free, cookieless, no consent needed). Token from Cloudflare → Analytics → Web Analytics. */
export const CF_ANALYTICS_TOKEN = import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN || '';
export const BING_VERIFICATION = import.meta.env.PUBLIC_BING_VERIFICATION || '';

export const GSC_VERIFICATION = import.meta.env.PUBLIC_GSC_VERIFICATION || '';
