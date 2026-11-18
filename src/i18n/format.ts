/** Locale-aware formatting (comma decimals in German, "Mittwoch, 18. November 2026", €). */
import { type CalDate } from '../lib/dates';
import { getLocale, type LocaleCode } from '../config/locales';

const toDate = (c: CalDate) => new Date(Date.UTC(c.y, c.m - 1, c.d, 12));
export const fmtNum = (l: LocaleCode, n: number, max = 2, min = 0) => n.toLocaleString(getLocale(l).intl, { maximumFractionDigits: max, minimumFractionDigits: min });
export const fmtMoney = (l: LocaleCode, n: number, currency?: string) => n.toLocaleString(getLocale(l).intl, { style: 'currency', currency: currency || getLocale(l).currency });
export const fmtDateLong = (l: LocaleCode, c: CalDate) => toDate(c).toLocaleDateString(getLocale(l).intl, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtDate = (l: LocaleCode, c: CalDate) => toDate(c).toLocaleDateString(getLocale(l).intl, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
export const fmtDateMedium = (l: LocaleCode, c: CalDate) => toDate(c).toLocaleDateString(getLocale(l).intl, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtWeekday = (l: LocaleCode, c: CalDate) => toDate(c).toLocaleDateString(getLocale(l).intl, { weekday: 'long', timeZone: 'UTC' });
export const fmtMonth = (l: LocaleCode, m: number) => new Date(Date.UTC(2026, m - 1, 15)).toLocaleDateString(getLocale(l).intl, { month: 'long', timeZone: 'UTC' });
