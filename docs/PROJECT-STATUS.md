# Taktfino – Project Status (A to Z)

Stand: 20 Nov 2026 · Website: **https://taktfino.com** · Repo: `farhanjaved00/taktfino` (private)

---

## 1. Kya hai
German-first multilingual tool site (Arbeitszeit, Stunden, Lohn, Datum). Plan: *Multilingual Tool Website Final Master Plan v2*.
Stack: Astro 7 (static), TypeScript, Cloudflare Pages, GitHub Actions, OpenAI (articles), Semrush (keywords).

## 2. Live par kya hai
| Cheez | Status |
| --- | --- |
| Domain `taktfino.com` (Spaceship → Cloudflare nameservers `owen` / `tricia`) | ✅ |
| Hosting: Cloudflare Pages project `taktfino`, har push par auto-deploy | ✅ |
| `www` → `taktfino.com` (301), `http` → `https`, `/` → `/de/` (jab tak sirf German live) | ✅ |
| `taktfino.pages.dev` par `noindex` | ✅ |
| Email `kontakt@taktfino.com` → `taktfino@gmail.com` (Cloudflare Email Routing, MX/SPF) | ✅ |
| Google Search Console (Domain property, TXT verify), sitemaps submit | ✅ home page indexed |
| Bing Webmaster Tools (GSC se import), sitemap submit | ✅ |
| IndexNow (key `e75cc1be880d08896c804ddae1fc9d7d`, public) | ✅ 51 URLs bheje |
| Cloudflare Web Analytics (cookie-free) | ✅ |
| Google Analytics 4 `G-PM0JQD2BQJ` – sirf consent banner par "Akzeptieren" ke baad | ✅ |
| Impressum, Datenschutz, Über uns (Farhan Javed, Lahore, LinkedIn) | ✅ |

## 3. Content (German)
- **15 tools:** Arbeitszeit, Stunden, Arbeitstage, Stundenlohn, Überstunden, Tage, Alter, Kalenderwoche, Minuten↔Stunden, Stundenzettel, Kündigungsfrist, Zuschläge, Mutterschutz, Elternzeit, Urlaub.
- **16 Bundesland pages** (Feiertage & Arbeitstage), **10 articles**, category + legal pages.
- 51 pages indexable (sitemap), sab `reviewed: true` (owner decision 19 Nov 2026), koi fake reviewer nahi.
- Legal rules coded + tested: ArbZG/AZG/ArG, § 622 BGB, § 3b EStG, MuSchG, BEEG, BUrlG, Mindestlohn, Feiertage aller Länder (AT, CH-ZH).

## 4. Automation
| Workflow | Kab | Kya |
| --- | --- | --- |
| `articles.yml` | Mon/Wed/Fri 06:00 UTC | Queue se OpenAI article, checks, **AUTO_PUBLISH on** → saaf draft seedha live |
| `language-launch.yml` | Har Monday | Schedule par nayi language khud draft + live (es Mar 2027, pt-br May, nl, fr, pl, it, en) |
| `ci.yml` | Har push | Tests, build, link check |
| `indexnow.yml` | Content push / bot | Bing ko naye URLs |
| `scheduled-rebuild.yml` | Har mahine 1 | Rebuild (saal/tareekh wali tables) |
| Local task `taktfino-weekly-draft-check` | Saturday 10:00 PKT | Extra check (optional). Asal fix ab bot khud karta hai: ghalti par 2 repair rounds |

**Quality guards:** `scripts/lib/facts.ts` – Feiertage, Bundesländer, ginti, free-day spans, Mindestlohn, KW, Muttertag/Advent jaisi tareekhein, keyword stuffing check. Ghalti mile to article noindex. 163 tests.

## 5. Keyword queues (Semrush)
| Language | Topics | Kab tak |
| --- | --- | --- |
| de (live) | 105 | ~July 2027 (seasonal topics date se pehle) |
| es | 14 | launch ke baad ~5 hafte |
| pt-br | 17 | ~6 hafte |
| fr / pl / it / nl | 10 / 10 / 8 / 7 | 2–4 hafte |
Volume: German pages ~584k + queue ~280k searches/mahina. Semrush reserve ~6k units.

## 6. Secrets & settings (values yahan nahi)
- GitHub secrets: `OPENAI_API_KEY`, `CF_PAGES_DEPLOY_HOOK`, `INDEXNOW_KEY`
- GitHub variables: `SITE_URL=https://taktfino.com`, `AUTO_PUBLISH=true`
- Cloudflare Pages env: `NODE_VERSION=24`, `SITE_URL`, `INDEXNOW_KEY`
- Accounts: Cloudflare + Google (GSC, GA4) + Bing = `taktfino@gmail.com`

## 7. Baqi / aage ke kaam
1. **GSC sitemap status** "Couldn't fetch" → 2–4 din mein "Success" hona chahiye; na ho to dobara submit.
2. **Backlinks** (abhi 0): Reddit/forums, tool directories, LinkedIn par taktfino.com.
3. **AdSense** jab ~30–50 pages index + traffic (2–3 mahine) – tab Google certified CMP banner khud aayega.
4. **Privacy policy** lawyer/e-recht24 se check (AdSense se pehle); EU representative (Art. 27) dobara dekhna.
5. **Trademark check** "Taktfino" (DPMA/EUIPO).
6. **Cloud weekly check**: claude.ai par GitHub connect karein to routine cloud mein ban sakti hai.
7. **Bundesland titles** "2026/2027" → Jan 2028 se pehle update.
8. **Country law tools** (MX finiquito/aguinaldo, BR rescisão/13º) – bada volume, rules code + test karne honge.
9. German queue July 2027 tak; spring 2027 mein reserve units se aur research.

## 8. Local commands
```bash
export PATH=/opt/homebrew/opt/node@23/bin:$PATH   # Astro 7 ko Node >= 22.23.4 chahiye
npm run verify          # tests + type check + build + link check
npm run articles:dry    # agle article briefs
npm run draft-locale -- es --dry-run
```
Docs: `README.md`, `docs/CONTENT-PLAN-3M.md`, `docs/LANGUAGE-ROADMAP.md`.
