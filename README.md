# TimeWise — date & time tools

A static Astro site of free date and time calculators for the US, UK and Canada: days from today, weeks from today, days until (holidays and dates), hours from now, days ago, date duration, age and countdowns — plus daily guides.

- **No server, no database.** Pure static HTML on Cloudflare Pages + small vanilla-JS islands.
- **Always the right date.** Rebuilt every day just after midnight US Eastern (05:10 UTC), and every tool recalculates in the browser from the visitor's local date.
- **Safe indexing.** Long-tail pages are released automatically in batches every 2 weeks, from one plan file.
- **Articles by PR.** A daily GitHub Action drafts 2 guides with OpenAI and opens a pull request. Nothing goes live until you merge it.

---

## 1. Run it locally

Requires **Node 22.23.4 or newer** (Astro 7). On a Mac with Homebrew: `brew upgrade node@22` (or install Node 24).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:4321. Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests for the date engine, holidays and release config |
| `npm run build` | Builds the static site into `dist/` |
| `npm run verify` | Tests + type-check + build + link check + file count (run before pushing) |
| `npm run preview` | Serves `dist/` locally |
| `npm run articles:dry` | Shows which topics the article bot would write next (no API call) |

Copy `.env.example` to `.env` to set the site URL, AdSense ID or Search Console token locally.

## 2. Settings you will change

| What | Where |
| --- | --- |
| Brand name, author name + bio, contact email | `src/config/site.ts` |
| Live domain | `SITE_URL` environment variable (Cloudflare + GitHub variable) |
| Which long-tail pages exist | `src/data/release.json` (live) and `src/data/release-plan.json` (automatic schedule) |
| Topics for daily articles | `content/queue.csv` |
| Colours, fonts, spacing | `src/styles/global.css` (`:root` tokens) |
| Manifest name | `public/site.webmanifest` |

## 3. Deploy to Cloudflare Pages

1. Push this folder to a new GitHub repository (branch `main`).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Environment variables** (Settings → Variables), for Production:
   - `SITE_URL` = `https://www.yourdomain.com`
   - `NODE_VERSION` = `24` (Cloudflare also reads `.nvmrc`)
   - Later: `PUBLIC_ADSENSE_CLIENT`, `PUBLIC_GSC_VERIFICATION` (see §8)
5. Save and deploy. Every push to `main` deploys automatically.

### Daily rebuild (keeps "from today" pages correct)

1. Cloudflare → your Pages project → **Settings → Builds → Deploy hooks** → add a hook for branch `main`, copy the URL.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**: `CF_PAGES_DEPLOY_HOOK` = that URL.
3. `.github/workflows/daily-rebuild.yml` calls it every day at 05:10 UTC (just after midnight US Eastern). You can also run it by hand from the **Actions** tab.

## 4. Connect your domain

1. Buy the domain (Cloudflare Registrar is the simplest — DNS is then already on Cloudflare).
2. Pages project → **Custom domains → Set up a custom domain** → enter `www.yourdomain.com`, then also add `yourdomain.com`.
3. Make one of them canonical (we use `www`). Add a Cloudflare **Redirect Rule**: `yourdomain.com/*` → `https://www.yourdomain.com/${1}` (301).
4. Set `SITE_URL` to the canonical URL and redeploy, so canonicals and sitemaps use it.

## 5. Releasing new pages (automatic)

Only pages listed in `src/data/release.json` are built, linked and put in sitemaps. New pages are released **automatically** from `src/data/release-plan.json`:

1. The **Release next batch** workflow runs every Monday.
2. The first run after launch only starts the clock. After that, every **14 days** it adds the next batch to `release.json`.
3. Before pushing, it runs the tests, builds the whole site and checks every link. If anything fails it does **not** push, and GitHub emails you.
4. The push to `main` deploys to Cloudflare. The new pages appear in the sitemaps straight away.

The plan (about 1,440 pages, finished ~14 weeks after launch):

| Batch | Adds | ≈ pages |
| --- | --- | --- |
| 2 | days-from-today 31–90, weeks 13–26, all 42 holidays | 100 |
| 3 | days-from-today 91–180, days-ago 1–60 | 150 |
| 4 | days-from-today 181–365, 400, 500, 1000 | 190 |
| 5 | hours 1–72, weeks 27–52, days-ago 61–180 | 200 |
| 6 | weeks 53–104, hours 73–168, days-ago 181–365 | 330 |
| 7 | days until every calendar date | 366 |

**Controls**

| You want to… | Do this |
| --- | --- |
| Pause releases | Set `"paused": true` in `release-plan.json` |
| Release the next batch now | Actions → Release next batch → Run workflow → tick "force" |
| Change the pace | Change `"intervalDays"` (e.g. 7 or 21) |
| Change what's in a batch | Edit its `"add"` block (only batches without `releasedOn`) |
| Release something by hand | Add it to `release.json` and push — the plan is unaffected |

Before each batch, glance at Search Console → **Pages**. If most of the previous batch is still "Discovered – currently not indexed", pause for a couple of weeks.

Allowed numbers: days-from-today 1–365 + 400, 500, 1000 · weeks-from-today 1–104 · hours-from-now 1–168 · days-ago 1–365. `days-until` takes holiday slugs (see `src/lib/holidays.ts`), date slugs like `"december-25"`, `"all-holidays"` and `"all-dates"`. The build fails with a clear message if something is outside these.

Test locally without changing anything:

```bash
node scripts/release-next-batch.mjs --dry-run --force
```

**File limit:** Cloudflare Pages' free plan allows 20,000 files. `npm run count-pages` (also run in CI) warns at 80%. The full plan stays under ~1,500 files. If we ever get close, the plan is to move the long-tail families to a Cloudflare Worker that renders them on request, keeping the same URLs.

If `main` has branch protection that blocks direct pushes, allow `github-actions[bot]` to bypass it, or the release step will fail.

## 6. Adding a new tool

1. Put any date maths in `src/lib/dates.ts` (pure functions) and add tests in `tests/`.
2. Create a page in `src/pages/<tool-name>/index.astro`. The simplest pattern is `src/pages/age-calculator/index.astro`: it uses the `SimpleToolPage` shell (breadcrumbs, FAQ + schema, ads, related tools) and a small `<script>` for the live calculation.
3. Add it to `HUBS` in `src/lib/links.ts` so it appears in menus, the footer, category pages, the search index and the sitemap.
4. Add an OG image card automatically: every entry in `HUBS` gets `/og/<key>.png`.
5. For a long-tail family (like `/business-days-from-today/[n]/`): add it to `UNIVERSE`/`Family` in `src/lib/release.ts`, a key in `release.json`, a `[n].astro` route that reads `releasedNumbers()`, and a branch in `src/lib/pages.ts` for sitemaps.
6. `npm run verify`.

## 7. Approving articles

1. Add your OpenAI key: GitHub → Settings → Secrets → Actions → `OPENAI_API_KEY`.
2. Optional GitHub **variables**: `OPENAI_MODEL` (default `gpt-4.1-mini`), `AUTHOR_NAME`.
3. GitHub → Settings → Actions → General → **Workflow permissions**: tick "Allow GitHub Actions to create and approve pull requests".
4. Every day at 06:00 UTC the workflow takes the next 2 rows of `content/queue.csv`, writes two Markdown guides into `src/content/guides/`, checks the site still builds, and opens a PR.
5. The PR description lists automatic checks: weekday/date mistakes, word count, missing table/FAQ/tool link, and any statistics that need a source. Read each article (the **Files changed** tab), fix anything directly in GitHub, add `reviewedBy: Your Name` to its front-matter (shown on the page — a trust signal for Google), then **merge** → Cloudflare deploys it.
6. To reject a draft, close the PR. The topic stays in `content/published.csv`; copy its row back into `queue.csv` if you want it written again.
7. Add more topics any time by appending rows to `content/queue.csv` (`keyword,title,related_tool_url,category`; categories: Work, Holidays, Life, Time, Travel, Pregnancy, Calendar, School).

You can also run it locally: `OPENAI_API_KEY=… npm run articles`.

## 8. Ads, consent, analytics and search engines

All of these are environment variables in Cloudflare Pages (Settings → Variables). Redeploy after changing them.

| Variable | What it does |
| --- | --- |
| `PUBLIC_ADSENSE_CLIENT` | `ca-pub-…`. Turns ads on. Without it no ad code loads at all. Optional `PUBLIC_AD_SLOT_*` per size. |
| `PUBLIC_CONSENT_MODE` | `google` (default): use Google's certified consent message — in AdSense go to **Privacy & messaging → GDPR → Create message** and publish it. Required by Google for personalised ads in the UK/EEA. `banner`: the site's own simple banner instead. |
| `PUBLIC_CF_ANALYTICS_TOKEN` | Cloudflare → Analytics & Logs → Web Analytics → add site → copy the token. Free, cookieless. |
| `PUBLIC_GSC_VERIFICATION` | Google Search Console "HTML tag" token. |
| `PUBLIC_BING_VERIFICATION` | Bing Webmaster Tools `msvalidate.01` token (Bing also powers ChatGPT search). |
| `INDEXNOW_KEY` | Any 32-character hex string. Also add it as a GitHub **secret** `INDEXNOW_KEY` and a GitHub **variable** `SITE_URL`. New pages are then pushed to Bing/IndexNow automatically. |

- Ad boxes (728×90, 300×250, 300×600, 320×50) have reserved space so nothing jumps, and never sit above the answer.
- Add `/ads.txt` in `public/` with the line AdSense gives you.
- Search Console: add the domain property, verify, then submit `https://www.yourdomain.com/sitemap-index.xml`. Do the same in Bing Webmaster Tools (you can import from Search Console).
- `/llms.txt` gives AI assistants a summary of the site. `robots.txt` allows AI search crawlers; see the comments in `src/pages/robots.txt.ts` to opt out of AI *training* only.

The full SEO audit and growth plan is in [docs/SEO-GROWTH-PLAN.md](docs/SEO-GROWTH-PLAN.md).

## 9. How it's built

```
src/
  config/site.ts          brand, author, contact, ads config
  data/release.json       which long-tail pages are live
  lib/dates.ts            date engine (tested)
  lib/holidays.ts         42 US/UK/CA holidays, Easter, equinox/solstice maths
  lib/facts.ts            unique per-page explanations
  lib/release.ts          release parser + validation
  lib/links.ts            nav + links that only point at released pages
  lib/pages.ts            single registry used by sitemaps + search
  components/             SpanTool (days/weeks/ago), HoursPage, DaysUntilPage, layout parts
  pages/                  routes (hubs, [n] / [slug] long-tail, guides, trust pages, sitemaps, OG images)
  content/guides/         Markdown guides
scripts/                  article bot, link checker, file counter, icon maker
content/queue.csv         article topics waiting
```

Each long-tail page contains: the answer (full date, US/UK formats, day of year) in static HTML, inputs (number, start date, business days), live countdown, stats, a month calendar, Google Calendar / .ics / share link / print / save, an "other units" table, a unique explanation, FAQ with `FAQPage` schema, nearby + related links, `BreadcrumbList` schema and ad slots.
