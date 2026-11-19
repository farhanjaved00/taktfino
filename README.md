# Taktfino — multilingual date, time & work-hours tools

German-first tool site built to the **Multilingual Tool Website Final Master Plan v2**: Astro (static) + vanilla TypeScript tools + Markdown content + JSON translations + Pagefind search, hosted on Cloudflare Pages, code on GitHub.

The earlier English site (TimeWise, ~1,440 English date pages) is preserved in Git under the tag **`timewise-en-v1`** — per the plan, English comes back "later, after a Semrush check".

## What's built (German launch set)

| Type | URLs |
| --- | --- |
| Language picker (x-default) | `/` |
| Home | `/de/` |
| Money tools | `/de/arbeitszeitrechner/` · `/de/stundenrechner/` · `/de/arbeitstage-rechner/` · `/de/stundenlohnrechner/` · `/de/ueberstundenrechner/` |
| Supporting tools | `/de/tage-rechner/` · `/de/alter-berechnen/` |
| Real-data variants (top 5 Länder) | `/de/arbeitstage-rechner/{nordrhein-westfalen,bayern,baden-wuerttemberg,niedersachsen,hessen}/` |
| Categories | `/de/arbeitszeit/` · `/de/lohn-gehalt/` · `/de/datum/` |
| 8 spokes | `/de/arbeitszeit/{pausenregelung,arbeitszeit-berechnen,industrieminuten-tabelle,arbeitstage-2027,ueberstunden-regeln,ruhezeit,urlaubsanspruch-berechnen}/`, `/de/lohn-gehalt/mindestlohn-2027/` |
| Trust & legal | `/de/ueber-uns/` (author + reviewer) · `/de/kontakt/` · `/de/impressum/` · `/de/datenschutz/` · `/de/nutzungsbedingungen/` · `/de/redaktionelle-richtlinien/` |
| Utility | `/de/ratgeber/` · `/de/suche/` (Pagefind) · `/de/verlauf/` (saved history) · `/de/404.html` |

**Unique elements per tool (information gain):** ArbZG/AZG/ArG break, max-hours and 11-hour rest warnings for DE/AT/CH; night, Sunday and holiday hours; multi-day timesheet with CSV + PDF export; holidays for all 16 Länder + AT + Kanton Zürich incl. partial holidays (Mariä Himmelfahrt, Augsburger Friedensfest); half-days 24./31.12.; vacation subtraction; Mindestlohn check with next increase; Industrieminuten table; overtime → Zeitausgleich days and payout.

## Run locally

Needs **Node ≥ 22.23.4** (Astro 7). On this Mac: `brew upgrade node@22`, or use `/opt/homebrew/opt/node@23/bin` first on PATH.

```bash
npm install
```

```bash
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm test` | 61 tests: date engine, ArbZG/AZG/ArG rules, holidays, workdays, wage, overtime, content rules (unique keywords, title/description length, 40–60-word answers, tool link in first 100 words) |
| `npm run verify` | tests + type-check + build + link check + file count — run before every push |
| `npm run holidays -- 2029` | generate holiday data files for a year (review the diff!) |
| `npm run keyword-map` | rebuild `docs/keyword-map.csv` (every URL → primary + secondary keywords) |
| `npm run articles:dry` | show the next article brief per live language |
| `npm run next-locale` | which language is due by the schedule |
| `npm run draft-locale -- <code> --dry-run` | what a language draft would write |

## Review workflow (important)

Every content page has `reviewed: false` until a **native speaker** has checked it. Unreviewed pages are built and usable but carry `noindex` and are left out of the sitemap and hreflang. The build prints how many are still unreviewed.

To publish a page: check language, numbers and legal facts → set `reviewed: true` (and `reviewer: reviewer`) in its front-matter → commit. Check especially:

- every example date/weekday (use the calculators),
- legal statements and links (`sources:`), including the Austrian RIS link (its server refused automated checks),
- holiday files in `src/data/holidays/` (`"reviewed": false` → `true` after checking against the official lists).

## Fill these before launch (`src/config/site.ts`)

- `SITE.name` (brand), `SITE.sameAs` (brand profiles), `SITE.contactEmail`
- `IMPRINT` — real name and summonable postal address (§ 5 DDG). Decide: own address / virtual business address / company (plan §6, days 1–14)
- `PEOPLE.author` and `PEOPLE.reviewer` — names, bios, profile links
- `public/manifest-de.webmanifest` — brand name
- Datenschutzerklärung: generate with a trusted generator (e.g. e-recht24) or legal advice; the current text is a draft that matches the services in this repo

## Deploy (Cloudflare Pages + GitHub)

1. Push to a GitHub repo (`main`).
2. Cloudflare → Workers & Pages → Create → Pages → connect the repo. Build command `npm run build`, output `dist`, env `NODE_VERSION=24`.
3. Environment variables: `SITE_URL` (`https://taktfino.com`, no www), later `PUBLIC_GSC_VERIFICATION`, `PUBLIC_BING_VERIFICATION`, `PUBLIC_CF_ANALYTICS_TOKEN` and/or `PUBLIC_GA4_ID`, `PUBLIC_ADSENSE_CLIENT`, `INDEXNOW_KEY` (see `.env.example`).
4. Domain (Spaceship registrar, DNS on Cloudflare): add `taktfino.com` and `www.taktfino.com` as custom domains; Redirect Rule `www` → `https://taktfino.com` (301) – the site uses no www. HTTPS and HSTS come from Cloudflare + `public/_headers`.
5. GitHub → Settings → Secrets/Variables: secrets `CF_PAGES_DEPLOY_HOOK`, `OPENAI_API_KEY`, `INDEXNOW_KEY`; variables `SITE_URL`, optional `OPENAI_MODEL`, `ARTICLES_PER_RUN`, `AUTO_PUBLISH` (see below). Actions → General → Workflow permissions → "Read and write" + allow GitHub Actions to create pull requests.
6. Search Console (domain property) and Bing Webmaster Tools: verify, submit `/sitemap-index.xml`. UptimeRobot on `/de/`.

## Automation

| Workflow | When | What |
| --- | --- | --- |
| `ci.yml` | every push / PR | tests, build, link check, file count |
| `articles.yml` | Mon/Wed/Fri 06:00 UTC | next brief from `content/queue-<lang>.csv` for **every live language** → OpenAI draft in that language with the brief's secondary keywords → automatic checks (length, table, tool link in first 100 words, risky claims, weekdays in German) → PR or direct publish (see `AUTO_PUBLISH`) |
| `language-launch.yml` | Mondays 05:00 UTC, or by hand | when a language is due by `src/data/language-schedule.json` (month reached **and** the previous language is live): translates the UI, writes all universal tool pages with the keywords from `src/data/locale-keywords.json`, drafts the static/legal pages and switches the language live → PR or direct publish |
| `scheduled-rebuild.yml` | 1st of each month | rebuild via deploy hook (current-year tables, dates) |
| `indexnow.yml` | content pushed to main (also started by the bots) | notifies Bing/IndexNow after deploy |

Queues exist for de, es, pt-br, nl, fr, pl, it (`content/queue-<lang>.csv`, columns `keyword,title,tool,category,intent,h2s,questions,week,volume,kd,secondary`, lists separated by `|`, all from Semrush). Tests make sure no planned keyword collides with a page or a planned tool page in the same language.

### `AUTO_PUBLISH` — the one switch between "review" and "fully automatic"

| | `AUTO_PUBLISH=false` (repo variable; plan §12) | **on — current default** (variable unset or `true`) |
| --- | --- | --- |
| Articles | pull request, every draft `reviewed: false` (noindex) until a native speaker approves | pushed to main; drafts that pass **every** check get `reviewed: true` and are indexed at once, drafts with warnings stay noindex |
| New language | pull request `locale/<lang>`; merge = language goes live with noindex pages | pushed to main and live immediately; clean tool pages indexable |
| Legal pages (imprint, privacy, terms) | review | **always** `reviewed: false` — a human must check them |
| Reviewer shown on page | yes, after review | no — auto-published pages name only the author (no fake "reviewed by") |

**Risk of turning it on:** the plan (§12) requires a native review before indexing because unreviewed AI text is the main reason sites like this lose Google trust (Helpful Content / scaled content abuse) and because a wrong legal figure is a liability. The editorial pages follow `AUTO_PUBLISH` in `site.ts` automatically. **Status: switched ON on 2026-11-18 at the owner's request** (workflows default to on; `AUTO_PUBLISH` in `src/config/site.ts` makes the editorial policy match). To go back to review mode set the repo variable `AUTO_PUBLISH=false` **and** `AUTO_PUBLISH = false` in `site.ts`. Spot-check the GitHub run summaries weekly.

## Ads, consent, analytics

- **AdSense** loads only when `PUBLIC_ADSENSE_CLIENT` is set; max 3 fixed-size slots per page, never above a tool (CLS 0).
- **Consent:** Google's certified CMP (AdSense → Privacy & messaging → GDPR message) + **Consent Mode v2** defaults (denied) for GA4. Footer link "Datenschutz-Einstellungen" reopens it.
- **GA4 events:** `calculate`, `copy_result`, `export`, `share`, `lang_switch`, `pwa_install`.
- Cloudflare Web Analytics can run alongside (cookieless).

## Adding a language (plan §21)

Automatic: `language-launch.yml` does it on schedule. By hand: Actions → Language launch → Run workflow → `lang`, or locally:

```bash
npx tsx scripts/draft-locale.ts es --dry-run   # what would be written
OPENAI_API_KEY=… npx tsx scripts/draft-locale.ts es --live
```

It writes only what is missing (safe to re-run): `src/i18n/<code>.json` (all keys of `de.json`), `src/content/tools/<code>/*.md` for the universal tools (`UNIVERSAL` in `tool-map.ts`: hours, minutes, days, age, week, wage, overtime, timesheet), `src/content/pages/<code>/*.md` (about, contact, imprint, privacy, terms, editorial; operator details are inserted from `IMPRINT`), and flips `live: true`. Tests then require every tool and static page to exist for that language.

**Not automatic:** tools that encode a country's law (work-time rules, notice periods, surcharges, maternity/parental leave, vacation, holidays/working days). Each needs its rules coded in `src/tools/*` with tests against the official source, then the tool id added for that language in `toolsFor()`. Keyword data for them is in `docs/LANGUAGE-ROADMAP.md` §2–3.

## Adding a Bundesland page

Add `src/content/regions/de/workdays-<code>.md` (unique notes!) and set `live: true` for the region in `tool-map.ts`. Plan rule: only after the first 5 show indexing/traffic (≈ 8 weeks).

## Structure

```
src/config/      locales.ts · tool-map.ts (tools, categories, regions, page slugs) · site.ts (brand, imprint, people, ads)
src/i18n/        de.json es.json pt-br.json en.json · index.ts (t()) · format.ts (Intl)
src/tools/       language-free logic: worktime, time, workdays, holiday-rules, wage, overtime (+ tests/)
src/data/        holidays/{de,at,ch}/{region}-{year}.json · minimum-wage.json
src/content/     tools/{lang}/ · articles/{lang}/ · regions/{lang}/
src/components/  tools/* (UI islands) · pages/* (templates) · layout parts
src/pages/       index.astro (picker) · [locale]/index.astro · [locale]/[...slug].astro · sitemaps · og · robots · llms.txt
scripts/         postbuild (404s, Pagefind, IndexNow key, warnings) · generate-articles · gen-holidays · keyword-map · check-links
```
