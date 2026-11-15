# TimeWise — SEO & growth plan

Written November 15, 2026. Keyword and competitor numbers are from Semrush (US database unless marked), November 2026. Traffic numbers are Semrush estimates of Google organic visits, not exact counts.

## 1. The opportunity in one paragraph

People search for exact dates in huge numbers, and the keywords are easy: "90 days from today" gets 246,000 US searches a month at keyword difficulty 29, "30 days from now" 49,500 at KD 20, and "how many days until Christmas" 1.5 million in season. Google ranks small, new sites for these: widgetly.co went from zero (Feb 2025) to ~700,000 US visits a month (Oct 2026), and failflow.com went from ~45,000 to ~805,000 in four months (Jun → Oct 2026). Our site is built the same way, but faster, more accessible (Lighthouse 100) and with more unique content per page.

## 2. Audit — what was checked and what was done

| Area | Google risk / ranking factor | Status |
| --- | --- | --- |
| **Scaled content abuse** (spam policy, March 2024) | Thousands of near-identical template pages can be demoted site-wide | ✅ Each page has a computed, page-specific explanation (weekends crossed, holidays passed, season, leap day, year change) and curated notes for high-intent numbers. Pages release in batches of 100–370 every 14 days, never all at once. |
| **AI content** | Allowed if helpful and reviewed; mass-produced unreviewed AI content is spam | ✅ Articles are drafted by AI and opened as pull requests; nothing publishes without a human merge. Automatic checks flag wrong weekdays, missing sources, missing tables and links. A `reviewedBy` field is shown on the page. Editorial policy states the process. |
| **Helpful content / answer first** | Pages must answer the query immediately | ✅ The answer (full date + weekday, US and UK formats) is the first thing in the HTML, before any ad. |
| **E-E-A-T** | Who is behind the site, can they be trusted | ⚠️ Structure is done: About page with Person schema, author byline linking to About, editorial policy, contact, privacy, terms. **You must fill in a real name, bio and email** in `src/config/site.ts`, and ideally add profile links (`sameAs`). |
| **Freshness** | Date pages that show a stale date look broken | ✅ Rebuilt daily just after midnight US Eastern. `dateModified` in WebPage schema and sitemaps. The browser recalculates for every visitor's time zone. |
| **Core Web Vitals** | Ranking signal, also affects ad revenue | ✅ Lighthouse mobile 100/100/100/100 on every page type tested. LCP ≈ 0.8 s, CLS ≈ 0–0.02 (fonts preloaded with metric-matched fallbacks), no blocking JS. |
| **Mobile-first indexing** | Google ranks the mobile version | ✅ Same content on mobile, 44 px tap targets, no horizontal scroll, bottom tab bar. |
| **Canonicals & duplicates** | Duplicate URLs split ranking signals | ✅ One self-referencing canonical per page, lowercase URLs with trailing slashes. `?n=` share links point to the clean canonical. No duplicate titles or descriptions (checked across all pages). |
| **Same-answer pages** (7 days vs 1 week, 14 days vs 2 weeks) | Keyword cannibalisation | ✅ Kept — they answer different searches (e.g. "2 weeks from today" 33,100/mo) — and now cross-link each other ("See also"). |
| **Broken links & 404s** | Wasted crawl budget and bad UX | ✅ Build-time link checker on every page. Unreleased long-tail URLs redirect temporarily (302) to the calculator with the number filled in, instead of a 404. |
| **Structured data** | Rich results and entity understanding | ✅ WebSite + SearchAction, Organization, WebApplication (hubs), WebPage + dateModified (tools), BreadcrumbList, FAQPage, Article, AboutPage/Person. Note: Google now shows FAQ rich results mainly for government and health sites, so FAQ schema helps understanding but rarely shows as a rich result. |
| **Internal linking** | Spreads authority, helps discovery | ✅ Every long-tail page links to its hub, 6 nearby numbers, up to 10 popular numbers, twin pages, related tools and related guides. Every hub is in the main menu, footer and home page. Every guide links to a tool and tools link back to guides. |
| **Sitemaps & robots** | Discovery | ✅ One sitemap per tool family + index, only released pages. Search and Saved pages are excluded. |
| **AI search (AI Overviews, ChatGPT, Perplexity)** | Growing share of answers comes from AI engines | ✅ Answer-first content, clear definitions of counting rules, `llms.txt`, robots open to AI search bots, IndexNow pings to Bing (which feeds ChatGPT search). |
| **Ads policy** | AdSense rejects sites with too many ads, thin pages or no consent | ✅ Ads off until approved. Fixed-size slots (no layout shift), never above the answer. Google-certified consent message by default (required for UK/EEA personalised ads). Privacy policy covers AdSense and analytics. |
| **Measurement** | You can't grow what you don't measure | ✅ Cloudflare Web Analytics (cookieless, no consent needed), Search Console and Bing Webmaster verification via env variables. |
| **Security & hosting** | HTTPS, headers | ✅ Cloudflare HTTPS, security headers, long cache for assets. |

## 3. How modern ranking works for this niche (and how we use it)

1. **Answer the exact question instantly.** Searchers want one date. The answer, weekday and both date formats sit at the top of every page; the countdown and calendar make the page more useful than Google's own answer box.
2. **Programmatic pages are fine only when each page is genuinely useful.** Our pages add business days, holidays in the span, season change, weekend warning, calendar, .ics, and share links — things a one-line answer box can't give.
3. **Release in waves and watch indexing.** Google decides how much of a new site to crawl based on how the first pages perform. Batches every 14 days, checking Search Console → Pages before each one.
4. **Freshness wins date queries.** Titles include the live date and year ("How Many Days Until Christmas 2026? 40 Days to Go"), which raises click-through in search results.
5. **Cover the way people actually phrase it.** Same page targets "90 days from today", "90 days from now", "what day is 90 days from today" and "90 days before today" (days-ago pages) through FAQ and wording, not separate thin pages.
6. **Topical authority through guides.** 180 queued topics cover the questions around the tools (business days, holidays, visas, pregnancy weeks, DST). Each links to a tool. Two a day, reviewed.
7. **Be citeable by AI.** Short factual sentences, clear counting rules, `llms.txt`, open robots for AI search crawlers.
8. **Earn links with tools, not outreach spam.** People link to useful calculators and widgets. See §5.

## 4. Roadmap

| When | Focus | Target |
| --- | --- | --- |
| Week 0 (launch) | Buy domain, deploy, Search Console + Bing, submit sitemap, fill author/contact | 111 pages indexed |
| Weeks 2–14 | Automatic batches 2–7 (≈1,440 pages). 2 reviewed guides/day. | 70%+ of pages indexed |
| Month 2–3 | Apply for AdSense once ~30+ guides and steady traffic. Phase 2 tools: business days from today, months from today, time zone pairs (`/pst-to-est/`), due date / weeks pregnant | First 1,000 visits/day |
| Month 3–6 | Embeddable countdown widget (backlinks), seasonal pushes (Thanksgiving, Christmas, Easter, back-to-school), refresh top guides | 20–60K visits/month |
| Month 6–12 | Expand winners: more numbers/holidays that rank on page 2, UK and Canada-specific holiday pages, age difference, week number, day of week | 200–500K visits/month |
| Month 12–18 | Scale what works, consider Workers for very large page sets, add languages only if English is saturated | 500K–1M+ visits/month |

These traffic targets are a realistic middle case, not a promise. Search updates, AI answers and competition can move them up or down.

## 5. Growth levers beyond SEO basics

- **Embeddable countdown widget** (`/embed/countdown/`): bloggers, schools and wedding sites embed a live Christmas or event countdown with a "by TimeWise" link → natural backlinks. Highest-value next feature.
- **Seasonal calendar:** publish holiday guides 6–8 weeks before each peak (Christmas peak Dec, Thanksgiving Nov, Easter Mar/Apr, back-to-school Aug, DST Mar/Nov).
- **Pinterest & Reddit:** printable countdown calendars and "how many days until" pins perform well on Pinterest; answer real Reddit questions with a link only when it genuinely helps.
- **Refresh, don't just add:** every 3 months, update the 20 most-visited guides (new year's dates, new examples) and bump `updated`.
- **Watch Search Console weekly:** find queries where we rank 8–20 and improve those pages first (titles, FAQ, internal links).

## 6. Weekly routine (≈30 minutes)

1. Review and merge the article PRs (5–10 minutes a day).
2. Search Console → Pages: are new batches being indexed? If not, pause releases (`"paused": true`).
3. Search Console → Performance: note top rising queries; add missing topics to `content/queue.csv`.
4. Cloudflare Web Analytics: top pages; make sure they look right on mobile.

## 7. What would hurt us (avoid)

- Publishing unreviewed AI articles, or more than a few per day.
- Releasing all pages at once.
- Buying links or link exchanges.
- Adding ads above the answer or pop-ups.
- Copying text from competitors.
- Letting the daily rebuild break (stale dates). GitHub emails you when a workflow fails — act on it.
