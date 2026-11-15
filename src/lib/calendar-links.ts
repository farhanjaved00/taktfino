/** Google Calendar links and .ics files (all-day or timed events). */
import { type CalDate, addDays, formatISO } from './dates';

const compact = (c: CalDate) => formatISO(c).replace(/-/g, '');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function googleCalendarUrl(opts: { title: string; date?: CalDate; at?: Date; details?: string }): string {
  const dates = opts.at
    ? `${stamp(opts.at)}/${stamp(new Date(opts.at.getTime() + 30 * 60000))}`
    : `${compact(opts.date!)}/${compact(addDays(opts.date!, 1))}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: opts.title, dates, details: opts.details || '' });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function icsFile(opts: { title: string; date?: CalDate; at?: Date; details?: string; url?: string; uid: string }): string {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TimeWise//Date tools//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    ...(opts.at
      ? [`DTSTART:${stamp(opts.at)}`, `DTEND:${stamp(new Date(opts.at.getTime() + 30 * 60000))}`]
      : [`DTSTART;VALUE=DATE:${compact(opts.date!)}`, `DTEND;VALUE=DATE:${compact(addDays(opts.date!, 1))}`]),
    `SUMMARY:${esc(opts.title)}`,
    ...(opts.details ? [`DESCRIPTION:${esc(opts.details)}`] : []),
    ...(opts.url ? [`URL:${opts.url}`] : []),
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}
