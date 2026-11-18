# Language Roadmap A–Z (Taktfino)

Stand: 18 Nov 2026 · Data: Semrush (DE, AT, MX, ES, BR, IT, PL, NL, FR, US), Nov 2026 · Base: Master Plan v2 §2, §21

Har nayi language ek hi tareeqe se aati hai: **config ki ek line + JSON translation + content + local data**. Hreflang, sitemaps, switcher aur picker automatic hain. Is document mein har market ke keywords, tools, data aur launch checklist pehle se taiyar hai — taaki baad mein research dobara na karni pade.

---

## 1. Order aur trigger (kab kaunsi language)

| # | Language (code) | Markets | Kab live | Trigger (data se) |
| --- | --- | --- | --- | --- |
| 1 | Deutsch `de` | DE, AT, CH | ✅ Launch | — |
| 2 | Español `es` | MX (pehle), ES | Month 3–4 | DE: 30+ pages indexed **aur** GSC impressions 4 hafte se badh rahi hon |
| 3 | Português `pt-br` | BR | Month 5–6 | ES launch ke 6–8 hafte baad, DE stable |
| 4 | Nederlands `nl` | NL, BE | Month 7+ | High RPM, kam competition — recommended next |
| 5 | Français `fr` | FR, BE, CH | Month 8+ | Volume high, KD medium |
| 6 | Polski `pl` | PL | Month 9+ | KD bohot kam, lekin RPM kam |
| 7 | Italiano `it` | IT | Month 10+ | KD kam, volume medium |
| 8 | English `en` | US, UK, CA | Last | KD 55–75 – sabse mushkil; purani TimeWise site tag `timewise-en-v1` mein ready hai |

**Rule:** agli language tab hi jab pichhli ke pages index ho rahe hon. Ek language fail ho (12 hafte mein impressions nahi) → `live: false` + resources winner par.

---

## 2. Keyword data per market (core tools)

### 🇲🇽 Mexico (`es`, db mx)
| Keyword | Vol | KD | Tool |
| --- | --- | --- | --- |
| cuantas semanas tiene un año | 246.000 | 44 | Kalenderwoche-Artikel |
| jornada laboral | 74.000 | 30 | Arbeitszeit-Ratgeber |
| calculadora de finiquito | 33.100 | 48 | **Neu: Finiquito-Rechner (LFT)** |
| calculadora de aguinaldo | 22.200 | 25 | **Neu: Aguinaldo-Rechner** |
| días de vacaciones por ley | 22.200 | 22 | Urlaubsrechner (MX-Regeln, LFT Art. 76) |
| semana del año | 18.100 | 32 | Kalenderwoche |
| calculadora de días | 14.800 | 33 | Tage-Rechner |
| minutos a horas | 14.800 | 36 | Minuten↔Stunden |
| número de semana | 12.100 | 33 | Kalenderwoche |
| prima dominical | 12.100 | 25 | Zuschlagsrechner (MX 25 %) |
| calculadora de horas | 9.900 | 32 | Stundenrechner |
| calculadora de edad | 8.100 | 32 | Alter |
| calculadora de tiempo | 8.100 | 32 | Stundenrechner |
| incapacidad por maternidad | 6.600 | 29 | Mutterschutz (MX: 84 Tage) |
| calculadora de prima vacacional | 1.600 | 26 | **Neu: Prima vacacional** |
| calculadora de liquidación | 1.900 | 40 | Finiquito-Rechner |
| calculadora de vacaciones | 1.000 | 22 | Urlaubsrechner |

### 🇪🇸 Spain (`es`, db es)
| Keyword | Vol | KD | Tool |
| --- | --- | --- | --- |
| jornada laboral | 60.500 | 37 | Ratgeber |
| cuantas semanas tiene un año | 33.100 | 39 | Kalenderwoche |
| calculadora de horas | 9.900 | **14** | Stundenrechner |
| semana del año | 5.400 | 29 | Kalenderwoche |
| calculadora de días | 4.400 | 30 | Tage-Rechner |
| calculadora de tiempo | 3.600 | 23 | Stundenrechner |
| registro horario | 2.900 | 22 | Stundenzettel (ES: Registro de jornada Pflicht) |
| calendario laboral 2027 | 2.900 | 28 | Arbeitstage (ES-Feiertage je Comunidad) |
| baja por maternidad | 2.400 | **13** | Mutterschutz (ES: 16 Wochen) |
| calculadora de paro | 1.900 | **13** | (später) |
| calculadora de finiquito | 1.900 | 26 | (später, ES-Recht anders als MX) |
| número de semana | 1.900 | **9** | Kalenderwoche |
| calculadora de vacaciones | 880 | **11** | Urlaubsrechner |
| plus nocturnidad | 390 | 16 | Zuschlagsrechner |

### 🇧🇷 Brazil (`pt-br`, db br) — **sabse bada opportunity**
| Keyword | Vol | KD | Tool |
| --- | --- | --- | --- |
| calculadora de horas | **165.000** | **22** | Stundenrechner |
| contador de caracteres | 110.000 | 29 | (Supporting-Tool, simple) |
| quantas semanas tem um ano | 74.000 | 34 | Kalenderwoche |
| calculadora de rescisão | 60.500 | 22 | **Neu: Rescisão-Rechner (CLT)** |
| calculadora de dias | 40.500 | 36 | Tage-Rechner |
| licença maternidade | 40.500 | 33 | Mutterschutz (BR: 120 Tage) |
| calendário 2027 | 40.500 | 30 | Kalender-Seite |
| calculadora de férias | 33.100 | **14** | Urlaubsrechner (BR: + 1/3) |
| feriados 2027 | 33.100 | 20 | Arbeitstage (BR-Feiertage) |
| calculadora de horas trabalhadas | 22.200 | 25 | Arbeitszeitrechner |
| calcular idade | 12.100 | 42 | Alter |
| calculadora de dias úteis | 9.900 | **15** | Arbeitstage-Rechner |
| semana do ano | 9.900 | 22 | Kalenderwoche |
| folha de ponto | 9.900 | 29 | Stundenzettel |
| calculadora de horas extras | 8.100 | 26 | Überstunden (BR: +50 %) |
| minutos em horas | 8.100 | 42 | Minuten↔Stunden |
| salário mínimo 2027 | 6.600 | 39 | Stundenlohnrechner |
| banco de horas | 5.400 | **16** | Arbeitszeitkonto |
| calculadora adicional noturno | 4.400 | 25 | Zuschlagsrechner (BR: 20 %, 22–5 Uhr) |
| calculadora de décimo terceiro | 3.600 | 21 | **Neu: 13º salário** |

### 🇳🇱 Netherlands (`nl`)
| Keyword | Vol | KD | Tool |
| --- | --- | --- | --- |
| welke week is het | **165.000** | 46 | Kalenderwoche |
| bruto netto berekenen | 60.500 | 40 | (später) |
| weeknummer | 49.500 | 41 | Kalenderwoche |
| feestdagen 2027 | 12.100 | 21 | Arbeitstage |
| vakantiegeld berekenen | 8.100 | 42 | **Neu: Vakantiegeld (8 %)** |
| leeftijd berekenen | 6.600 | 20 | Alter |
| uren berekenen | 3.600 | **13** | Stundenrechner |
| zwangerschapsverlof berekenen | 2.900 | 24 | Mutterschutz |
| uurloon berekenen | 2.400 | **11** | Stundenlohnrechner |

### 🇫🇷 France (`fr`)
| Keyword | Vol | KD | Tool |
| --- | --- | --- | --- |
| numéro de semaine | 40.500 | 25 | Kalenderwoche |
| calcul heure | 27.100 | **19** | Stundenrechner |
| jours ouvrés | 27.100 | 30 | Arbeitstage |
| année bissextile | 22.200 | 44 | Artikel |
| jours fériés 2027 | 18.100 | 24 | Arbeitstage |
| minutes en heures | 6.600 | 31 | Minuten↔Stunden |
| calcul congé maternité | 5.400 | 31 | Mutterschutz |
| calculateur d'heures | 4.400 | 29 | Stundenrechner |
| calcul indemnité licenciement | 4.400 | 31 | (später) |
| calcul jours ouvrés | 2.400 | **14** | Arbeitstage-Rechner |
| calcul heures supplémentaires | 2.400 | 21 | Überstunden |
| calcul congés payés | 2.400 | 38 | Urlaubsrechner |

### 🇵🇱 Poland (`pl`)
| Keyword | Vol | KD | Tool |
| --- | --- | --- | --- |
| kalkulator dni | 40.500 | **14** | Tage-Rechner |
| kalkulator godzin | 18.100 | 20 | Stundenrechner |
| okres wypowiedzenia | 14.800 | 29 | Kündigungsfrist |
| tydzień roku | 9.900 | 23 | Kalenderwoche |
| kalkulator urlopu | 8.100 | 24 | Urlaubsrechner |
| kalkulator nadgodzin | 6.600 | **14** | Überstunden |
| kalkulator dni roboczych | 5.400 | **9** | Arbeitstage-Rechner |
| kalkulator wieku | 5.400 | **9** | Alter |
| kalkulator godzin pracy | 4.400 | **8** | Arbeitszeitrechner |
| kalkulator macierzyńskiego | 4.400 | 33 | Mutterschutz |
| wymiar czasu pracy | 1.900 | 27 | Arbeitstage (Monatsnorm) |

### 🇮🇹 Italy (`it`)
| Keyword | Vol | KD | Tool |
| --- | --- | --- | --- |
| calcolo stipendio netto | 40.500 | 31 | (später) |
| calcolo giorni tra due date | 18.100 | 20 | Tage-Rechner |
| calendario 2027 | 18.100 | 17 | Kalender |
| anno bisestile | 12.100 | 27 | Artikel |
| calcolo ore | 8.100 | 21 | Stundenrechner |
| calcolo tfr | 6.600 | 17 | **Neu: TFR-Rechner** |
| calcolo età | 5.400 | 20 | Alter |
| calcolo giorni lavorativi | 4.400 | **12** | Arbeitstage-Rechner |
| numero settimana | 3.600 | 25 | Kalenderwoche |
| calcolatore ore | 2.900 | 17 | Stundenrechner |

### 🇺🇸 English (`en`, db us)
| Keyword | Vol | KD | Note |
| --- | --- | --- | --- |
| time duration calculator | 90.500 | **28** | einziger leichter Head-Term |
| work hours calculator | 49.500 | 34 | Arbeitszeitrechner |
| minutes to hours | 27.100 | 44 | |
| pto calculator | 4.400 | **9** | Urlaubsrechner |
| holidays 2027 | 5.400 | 25 | |
| hours calculator / time card / age / date calculator | 110k–1M | 56–75 | sehr schwer |

---

## 3. Tools per language (was wiederverwendet wird, was neu kommt)

Die Rechen-Logik ist sprachfrei. Pro Land ändern sich nur **Regeln/Daten**:

| Tool | DE ✅ | ES (MX/ES) | PT-BR | NL | FR | PL | IT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Stundenrechner, Minuten↔Stunden, Tage, Alter, Kalenderwoche | ✅ | übersetzen | übersetzen | übersetzen | übersetzen | übersetzen | übersetzen |
| Arbeitszeitrechner (Pausenregeln) | ArbZG | LFT (MX) / ET (ES) | CLT | Arbeidstijdenwet | Code du travail | Kodeks pracy | D.Lgs. 66/2003 |
| Arbeitstage + Feiertage | 16 Länder | MX national; ES je Comunidad | BR national + Bundesstaaten | NL national | FR national (+Alsace-Moselle) | PL national | IT national |
| Stundenlohn + Mindestlohn | ✅ | salario mínimo MX/ES | salário mínimo | minimumloon | SMIC | płaca minimalna | (kein gesetzl.) |
| Überstunden | ✅ | LFT: doble/triple | +50 % / +100 % | — | +25 % / +50 % | +50 % / +100 % | CCNL |
| Zuschläge | § 3b EStG | prima dominical 25 % | adicional noturno 20 % | ORT | majoration nuit | dodatek nocny 20 % | — |
| Urlaubsrechner | BUrlG | LFT Art. 76 (12+ Tage) | férias + 1/3 | 4× Wochenstunden | 2,5 Tage/Monat | 20/26 Tage | 4 Wochen |
| Mutterschutz | MuSchG | MX 84 T. / ES 16 Wo. | 120 Tage | 16 Wochen | 16 Wochen | 20 Wochen | 5 Monate |
| Kündigungsfrist | § 622 BGB | — | aviso prévio (30 + 3/Jahr) | opzegtermijn | préavis | okres wypowiedzenia | preavviso (CCNL) |
| **Neue Länder-Tools** | — | Aguinaldo, Finiquito, Prima vacacional | Rescisão, 13º, Férias | Vakantiegeld | Indemnité licenciement | Wymiar czasu pracy | TFR |

**Wichtig:** Jede Länder-Regel (Zahlen, Prozentsätze, Fristen) wird vor dem Launch mit der offiziellen Quelle geprüft und mit Tests abgesichert – genau wie bei Deutschland. Keine Regel wird aus dem Gedächtnis übernommen.

---

## 4. Launch-Checkliste pro Sprache (plan §21)

1. ☐ Semrush: Top-15-Keywords bestätigen (Tabelle oben = Startpunkt), SERP manuell checken
2. ☐ `src/config/locales.ts`: Zeile existiert schon (`es`, `pt-br`, `en`); für `nl`/`fr`/`pl`/`it` eine Zeile hinzufügen (`live: false`)
3. ☐ `src/i18n/<code>.json`: alle Keys aus `de.json` übersetzen (Build bricht ab, wenn bei `live: true` ein Key fehlt) — **automatischer Entwurf per Workflow möglich (siehe §5)**
4. ☐ Slugs in `tool-map.ts` prüfen (für es/pt-br/en schon eingetragen)
5. ☐ Länder-Daten: Feiertage (`src/data/holidays/<land>/`), Mindestlohn (`minimum-wage.json`), Regeln in `src/tools/*` + Tests
6. ☐ Inhalte: `src/content/tools/<code>/*.md`, Rechtstexte (Impressum/Aviso legal, Datenschutz nach LFPDPPP/LGPD/RGPD), About
7. ☑ Article-Queue `content/queue-<code>.csv` (es, pt-br, nl, fr, pl, it gefüllt; en fehlt noch)
8. ☐ Native Review → `reviewed: true`
9. ☐ `live: true` → Deploy → Sitemap → IndexNow → GSC-Ordnerfilter
10. ☐ Nach 4 und 8 Wochen GSC prüfen

---

## 5. Was automatisch läuft und was nicht

| Bereich | Automatisch? |
| --- | --- |
| Deploy bei jedem Push, monatlicher Rebuild, IndexNow | ✅ |
| Artikel-Entwürfe Mo/Mi/Fr für **jede live Sprache** mit gefüllter Queue | ✅ (OpenAI-Key nötig) |
| Veröffentlichen der Entwürfe | ⚙️ Schalter `AUTO_PUBLISH` (siehe README) – aus = Review per PR, an = saubere Entwürfe gehen direkt live |
| Hreflang, Sitemaps, Sprachumschalter | ✅ |
| Übersetzung UI + Tool-Texte + Rechtsseiten einer neuen Sprache | ✅ Workflow `language-launch.yml` nach `src/data/language-schedule.json` (Keywords: `src/data/locale-keywords.json`) |
| Artikel-Queues es, pt-br, nl, fr, pl, it | ✅ `content/queue-<code>.csv` (Semrush, Nov 2026) |
| Länder-Regeln (Feiertage, Mindestlohn, Gesetze) | ❌ müssen geprüft werden – falsche Rechtsdaten sind das größte Risiko |
| Native Review | ❌ Mensch (oder bewusst mit `AUTO_PUBLISH` überspringen) |
| Backlinks, YouTube, Brand-Profile | ❌ |

## 6. Keine Kannibalisierung über Sprachen

Gleiche Seite in mehreren Sprachen = gleicher `translationKey` bzw. gleiche Tool-ID → hreflang verbindet sie automatisch. Ein Keyword gehört pro Sprache genau einer URL (`docs/keyword-map.csv`, Test in `tests/content.test.ts`).
