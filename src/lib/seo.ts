import { SITE, PEOPLE, type PersonId } from '../config/site';
import { getLocale, type LocaleCode } from '../config/locales';
import { pagePath, PAGES } from '../config/tool-map';

export const abs = (path: string) => (path.startsWith('http') ? path : `${SITE.url}${path}`);
export interface Crumb { name: string; path: string }

export const breadcrumbSchema = (crumbs: Crumb[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

export const faqSchema = (faq: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a.replace(/<[^>]+>/g, '') } })),
});

export const webAppSchema = (p: { name: string; path: string; description: string; locale: LocaleCode; modified: Date }) => ({
  '@context': 'https://schema.org', '@type': 'WebApplication',
  name: p.name, url: abs(p.path), description: p.description, inLanguage: getLocale(p.locale).hreflang,
  applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true,
  dateModified: p.modified.toISOString(),
  offers: { '@type': 'Offer', price: '0', priceCurrency: getLocale(p.locale).currency },
  publisher: { '@type': 'Organization', name: SITE.name, url: `${SITE.url}/` },
});

export const websiteSchema = (locale: LocaleCode) => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: abs(`/${locale}/`), inLanguage: getLocale(locale).hreflang,
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${abs(pagePath('search', locale))}?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
});

export const organizationSchema = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: `${SITE.url}/`, logo: abs('/icon-512.png'),
  ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
});

export const personUrl = (id: PersonId, locale: LocaleCode) => `/${locale}/${PAGES.about[locale]}/#${PEOPLE[id].id}`;
export const personRef = (id: PersonId, locale: LocaleCode) => ({
  '@type': 'Person', name: PEOPLE[id].name, url: abs(personUrl(id, locale)), ...(PEOPLE[id].sameAs.length ? { sameAs: PEOPLE[id].sameAs } : {}),
});

export const articleSchema = (a: { title: string; description: string; path: string; date: Date; updated: Date; author: PersonId; reviewer?: PersonId; locale: LocaleCode; image: string }) => ({
  '@context': 'https://schema.org', '@type': 'Article',
  headline: a.title, description: a.description, mainEntityOfPage: abs(a.path), inLanguage: getLocale(a.locale).hreflang,
  datePublished: a.date.toISOString(), dateModified: a.updated.toISOString(), image: abs(a.image),
  author: personRef(a.author, a.locale), ...(a.reviewer ? { reviewedBy: personRef(a.reviewer, a.locale) } : {}),
  publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: abs('/icon-512.png') } },
});

/** Appends " | Brand" only while the title stays within 60 characters. */
export const withBrand = (title: string) => (`${title} | ${SITE.name}`.length <= 60 ? `${title} | ${SITE.name}` : title);
