# TimeWise — date & time tools

A static Astro site of free date and time calculators for the US, UK and Canada: days from today, weeks from today, days until (holidays and dates), hours from now, days ago, date duration, age and countdowns — plus daily guides.

- **No server, no database.** Pure static HTML on Cloudflare Pages + small vanilla-JS islands.
- **Always the right date.** Rebuilt every day at 00:05 UTC, and every tool recalculates in the browser from the visitor's local date.
- **Safe indexing.** Long-tail pages are released in batches from one config file.
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
| Which long-tail pages exist | `src/data/release.json` |
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
3. `.github/workflows/daily-rebuild.yml` calls it every day at 00:05 UTC. You can also run it by hand from the **Actions** tab.

## 4. Connect your domain

1. Buy the domain (Cloudflare Registrar is the simplest — DNS is then already on Cloudflare).
2. Pages project → **Custom domains → Set up a custom domain** → enter `www.yourdomain.com`, then also add `yourdomain.com`.
3. Make one of them canonical (we use `www`). Add a Cloudflare **Redirect Rule**: `yourdomain.com/*` → `https://www.yourdomain.com/${1}` (301).
4. Set `SITE_URL` to the canonical URL and redeploy, so canonicals and sitemaps use it.

## 5. Releasing the next batch of pages

Only pages listed in `src/data/release.json` are built, linked and put in sitemaps. To release more, edit one line and push:

```json
"days-from-today": ["1-60", 75, 90, 100, 120, 180],
```

Rules:

- Numbers can be single values or ranges (`"31-60"`).
- Allowed ranges: days-from-today 1–365 + 400, 500, 1000 · weeks-from-today 1–104 · hours-from-now 1–168 · days-ago 1–365. The build fails with a clear message if you go outside these.
- `days-until` takes holiday slugs (`christmas`, `easter`, … — the full list is in `src/lib/holidays.ts`) and date slugs like `"december-25"`. `"all-holidays"` and `"all-dates"` release all 42 holidays or all 366 dates.
- Suggested pace: **100–500 pages every 2 weeks**. After each release, check Search Console → Pages to see they are being indexed before adding more.

Suggested schedule (about 1,400 pages in total):

| Batch | Add |
| --- | --- |
| 2 | days-from-today `31-90`, weeks `13-26`, `all-holidays` |
| 3 | days-from-today `91-180`, days-ago `1-60` |
| 4 | days-from-today `181-365`, 400, 500, 1000; hours `1-72` |
| 5 | weeks `27-104`, hours `73-168`, days-ago `61-180` |
| 6 | days-ago `181-365`, `all-dates` |

**File limit:** Cloudflare Pages' free plan allows 20,000 files. `npm run count-pages` (also run in CI) warns at 80%. The full plan above stays under ~2,000 files. If we ever approach the limit, the plan is to move the long-tail families to a Cloudflare Worker that renders them on request, keeping the same URLs.

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
5. The PR description lists automatic checks: weekday/date mistakes, word count, missing table/FAQ/tool link, and any statistics that need a source. Read each article (the **Files changed** tab), fix anything directly in GitHub, then **merge** → Cloudflare deploys it.
6. To reject a draft, close the PR. The topic stays in `content/published.csv`; copy its row back into `queue.csv` if you want it written again.
7. Add more topics any time by appending rows to `content/queue.csv` (`keyword,title,related_tool_url,category`; categories: Work, Holidays, Life, Time, Travel, Pregnancy, Calendar, School).

You can also run it locally: `OPENAI_API_KEY=… npm run articles`.

## 8. Ads, consent and Search Console

- **AdSense:** set `PUBLIC_ADSENSE_CLIENT=ca-pub-…` in Cloudflare and redeploy. Ad boxes (728×90, 300×250, 300×600, 320×50) then appear with reserved space so nothing jumps. Optionally set `PUBLIC_AD_SLOT_*` IDs per size. With no ID, no ad code or banner is loaded at all.
- **Consent:** when ads are on, a banner asks visitors to accept personalised ads or keep them non-personalised; the choice is stored locally and AdSense loads only after it. Google requires a **Google-certified CMP** for personalised ads to users in the UK/EEA — before applying, either enable Google's own "Privacy & messaging" consent message in AdSense (free) and remove this banner, or keep ads non-personalised for those regions.
- Add `/ads.txt` in `public/` with the line AdSense gives you.
- **Search Console:** add the domain property, choose "HTML tag", put the token in `PUBLIC_GSC_VERIFICATION`, redeploy, verify, then submit `https://www.yourdomain.com/sitemap-index.xml`.

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
