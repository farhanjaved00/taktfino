# [Brand] — multilingual date, time & work-hours tools

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
| `npm run articles:dry` | show the next article brief in the queue |

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
3. Environment variables: `SITE_URL` (e.g. `https://www.brand.com`), later `PUBLIC_GSC_VERIFICATION`, `PUBLIC_BING_VERIFICATION`, `PUBLIC_CF_ANALYTICS_TOKEN` and/or `PUBLIC_GA4_ID`, `PUBLIC_ADSENSE_CLIENT`, `INDEXNOW_KEY` (see `.env.example`).
4. Domain (Spaceship registrar, DNS on Cloudflare): add `www` + apex as custom domains; Redirect Rule apex → `https://www.…` (301). HTTPS and HSTS come from Cloudflare + `public/_headers`.
5. GitHub → Settings → Secrets/Variables: secrets `CF_PAGES_DEPLOY_HOOK`, `OPENAI_API_KEY`, `INDEXNOW_KEY`; variables `SITE_URL`, optional `OPENAI_MODEL`. Actions → General → allow GitHub Actions to create pull requests.
6. Search Console (domain property) and Bing Webmaster Tools: verify, submit `/sitemap-index.xml`. UptimeRobot on `/de/`.

## Automation

| Workflow | When | What |
| --- | --- | --- |
| `ci.yml` | every push / PR | tests, build, link check, file count |
| `articles.yml` | Mon/Wed/Fri 06:00 UTC | next brief from `content/queue-de.csv` → OpenAI draft in German → **pull request** with automatic checks (weekdays, length, table, tool link, risky claims). Native review → `reviewed: true` → merge |
| `scheduled-rebuild.yml` | 1st of each month | rebuild via deploy hook (current-year tables, dates) |
| `indexnow.yml` | content pushed to main | notifies Bing/IndexNow after deploy |

Add briefs to `content/queue-de.csv` (`keyword,title,tool,category,intent,h2s,questions`, H2s/questions separated by `|`) from your Semrush research.

## Ads, consent, analytics

- **AdSense** loads only when `PUBLIC_ADSENSE_CLIENT` is set; max 3 fixed-size slots per page, never above a tool (CLS 0).
- **Consent:** Google's certified CMP (AdSense → Privacy & messaging → GDPR message) + **Consent Mode v2** defaults (denied) for GA4. Footer link "Datenschutz-Einstellungen" reopens it.
- **GA4 events:** `calculate`, `copy_result`, `export`, `share`, `lang_switch`, `pwa_install`.
- Cloudflare Web Analytics can run alongside (cookieless).

## Adding a language (plan §21)

1. `src/config/locales.ts`: the line already exists with `live: false` (es, pt-br, en are prepared).
2. `src/i18n/<code>.json`: translate every key from `de.json` (the build fails if a live language misses keys).
3. Slugs in `src/config/tool-map.ts` (already filled for es/pt-br/en — check with a native speaker).
4. Content: `src/content/tools/<code>/`, `articles/<code>/` (same `translationKey` as the German original → hreflang), static pages in `src/components/pages/<code>/` + `LocalePage.astro`, local data (holidays, minimum wage, currency).
5. QA → `live: true` → deploy. Hreflang, sitemaps, switcher, picker update automatically. Review in GSC after 4 and 8 weeks.

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
