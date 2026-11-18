# 3-Monats-Content-Plan (DE) – Semrush-basiert

Stand: 18. Nov 2026 · Daten: Semrush. Datenbank **DE** (AT wo markiert). Nov 2026 · Grundlage: Master Plan v2 §11–§16

## 1. Kurz
- **36 Ratgeber** in 12 Wochen (3 pro Woche – Mo/Mi/Fr automatisch als Draft-PR). zusammen **≈ 158.110 Suchen/Monat**.
- **6 neue Tools** (von uns gebaut) mit hoher Nachfrage und niedriger KD – passen zur AI-Filter-Regel (Plan §4: multi-input / legal data).
- **Woche 0 (schon erledigt):** bestehende Seiten auf Keywords mit echtem Volumen umgestellt.
- Reihenfolge = Saison zuerst (Jahreswechsel: Feiertage, Brückentage, Minijob 2027), dann Cluster-Tiefe.

## 2. Woche 0 – Retargeting (erledigt)
| Seite | Altes Keyword (Vol.) | Neues Keyword (Vol. · KD) |
| --- | --- | --- |
| 5 Bundesland-Seiten | arbeitstage nrw (210) | **feiertage nrw (27.100 · 24)**, feiertage bayern (27.100 · 38), BW, NI, HE |
| Ratgeber Arbeitstage | arbeitstage 2027 (320) | **wie viele arbeitstage hat ein jahr (12.100 · 26)** + Tabelle 2026 & 2027 & „mit 30 Tagen Urlaub“ |
| Ratgeber Überstunden | überstunden regelung (40) | **überstunden auszahlen (2.900 · 22)** |
| Ratgeber Arbeitszeit | arbeitszeit richtig berechnen (20) | **arbeitsstunden berechnen (1.300 · 26)** |
| Stundenrechner | – | + stunden in dezimal (3.600 · KD 10) |
| Pausenregelung | – | + pausenzeiten (1.600), ruhepause (720) |
| Mindestlohn | – | + mindestlohn 2026 (550.000 · KD 57 – schwer, aber gleiche Seite) |

Bestätigt gut: arbeitszeitrechner 135.000 · 31 · stundenlohnrechner 74.000 · 39 · stundenrechner 60.500 · 18 · mindestlohn 2027 22.200 · **15** · tage rechner 12.100 · 16 · urlaubsanspruch berechnen 5.400 · 25 · arbeitstage rechner 5.400 · 27 · pausenregelung 2.400 · 19.

## 3. Wochen-Rhythmus
| Tag | Was | Wer |
| --- | --- | --- |
| Mo / Mi / Fr 06:00 UTC | Nächster Brief → KI-Draft → Pull Request | automatisch |
| Di / Do | Native Review, Fakten/Daten prüfen, `secondary` ergänzen, `reviewed: true`, mergen | Reviewer |
| Fr | GSC: neue Impressionen, Indexierung, Positionen 8–20 notieren | Sie |
| 1. des Monats | Rebuild, Keyword-Map prüfen (`npm run keyword-map`), Kannibalisierung checken | automatisch + Sie |

## 4. Kalender (12 Wochen)
| Woche | Ratgeber (Keyword · Vol. · KD → Hub-Tool) | Tool-Entwicklung | Off-Page / Brand (Plan §14, §20) |
| --- | --- | --- | --- |
| 1 | feiertage 2027 (18.100 · KD 25) → Arbeitstage-Rechner<br>brückentage 2027 (720 · KD 24) → Arbeitstage-Rechner<br>minijob 2027 (1.600 · KD 15) → Stundenlohnrechner | ✅ **Kalenderwoche-Rechner** – gebaut (/de/kalenderwoche/) | Brand-Profile (X, YouTube, Pinterest, LinkedIn) → `sameAs` |
| 2 | wie viele wochen hat ein jahr (33.100 · KD 21) → Tage-Rechner<br>gleitzeit (6.600 · KD 18) → Arbeitszeitrechner<br>urlaubsanspruch bei kündigung (6.600 · KD 16) → Arbeitstage-Rechner | ✅ **Minuten ↔ Stunden** – gebaut (/de/minuten-in-stunden/) | AlternativeTo, Product Hunt, 2–3 DE-Rechner-Verzeichnisse |
| 3 | arbeitszeitkonto (2.900 · KD 20) → Überstundenrechner<br>feiertagszuschlag (4.400 · KD 21) → Stundenlohnrechner<br>probezeit (8.100 · KD 17) → Tage-Rechner | ✅ **Stundenzettel** – gebaut (/de/stundenzettel/) | YouTube-Short #1: Arbeitszeitrechner (30–60 s) |
| 4 | sonntagszuschlag (2.900 · KD 16) → Stundenlohnrechner<br>nachtzuschlag (2.900 · KD 23) → Stundenlohnrechner<br>resturlaub (1.900 · KD 19) → Arbeitstage-Rechner | — (Puffer: Bugs, Review-Feedback) | Linkable Asset #1: „Feiertage & Arbeitstage 2027 alle Bundesländer“ als PDF |
| 5 | rufbereitschaft (2.900 · KD 30) → Arbeitszeitrechner<br>krank im urlaub (2.900 · KD 25) → Arbeitstage-Rechner<br>minusstunden (1.600 · KD 22) → Überstundenrechner | ✅ **Kündigungsfrist-Rechner** – gebaut (/de/kuendigungsfrist-rechner/) | YouTube-Short #2: Arbeitstage-Rechner |
| 6 | urlaubsanspruch teilzeit (2.400 · KD 26) → Arbeitstage-Rechner<br>dienstreise arbeitszeit (1.600 · KD 23) → Arbeitszeitrechner<br>urlaub minijob (1.900 · KD 20) → Arbeitstage-Rechner | Kündigungsfrist-Rechner fertig + Probezeit-Artikel verlinken | gutefrage.net / r/arbeitsleben: 5 hilfreiche Antworten (kein Spam) |
| 7 | zeiterfassung pflicht (2.400 · KD 34) → Arbeitszeitrechner<br>4 tage woche (3.600 · KD 35) → Arbeitszeitrechner<br>arbeitstage pro monat (2.400 · KD 29) → Arbeitstage-Rechner | ✅ **Zuschlagsrechner** – gebaut (/de/zuschlagsrechner/) | YouTube-Short #3: Stundenrechner |
| 8 | 40 stunden woche (2.400 · KD 32) → Stundenrechner<br>wochenarbeitszeit (1.900 · KD 38) → Arbeitszeitrechner<br>30 stunden woche (720 · KD 15) → Stundenlohnrechner | — | HR-Blogs: Linkable Asset anbieten (Digital PR) |
| 9 | schaltjahr (18.100 · KD 39) → Tage-Rechner<br>schichtplan (1.600 · KD 23) → Arbeitszeitrechner<br>arbeitsstunden pro jahr (1.900 · KD 16) → Stundenrechner | **Mutterschutz-Rechner** (mutterschutz rechner 6.600 · KD 26; mutterschutz berechnen 4.400 · KD 21) | YouTube-Short #4: Kündigungsfrist-Rechner |
| 10 | urlaubsgeld (4.400 · KD 33) → Stundenlohnrechner<br>netto stundenlohn (590 · KD 27) → Stundenlohnrechner<br>arbeitszeitnachweis (880 · KD 22) → Arbeitszeitrechner | — | Competitor-Backlink-Gap (Semrush): arbeitszeitrechner.eu, rechner-hub.de, smart-rechner.de |
| 11 | nachtschicht (6.600 · KD 40) → Arbeitszeitrechner<br>mindestlohn österreich (4.400 · KD 25) → Stundenlohnrechner<br>urlaubsanspruch österreich (1.600 · KD 32) → Arbeitstage-Rechner | Bundesland-Seiten: GSC-Daten prüfen → nächste 5 Länder freischalten (falls Test bestanden) | AdSense-Antrag (ab ~30 geprüften Seiten + Rechtstexte) |
| 12 | zeitumstellung 2027 (590 · KD 16) → Stundenrechner<br>überstunden teilzeit (320 · KD 14) → Überstundenrechner<br>höchstarbeitszeit (590 · KD 16) → Arbeitszeitrechner | Spanisch-Entscheidung (Plan §2): `es.json` + Tool-Slugs vorbereiten | GSC Page-2-Push (Plan §16): Positionen 8–20 → H2/FAQ/Links |

Woche 1 beginnt mit dem Launch (Domain live + erste Seiten reviewed). Die Queue (`content/queue-de.csv`) ist genau in dieser Reihenfolge gefüllt; der Bot nimmt immer die oberste Zeile.

## 5. Neue Tools (Vorschlag – vor dem Bau bestätigen)
| Tool | Keyword-Daten (DE) | Warum es passt (Plan §4) |
| --- | --- | --- |
| Kalenderwoche-Rechner | kalenderwoche 60.500 · KD 22 · welche kalenderwoche haben wir 40.500 · 25 | Supporting-Tool laut Plan; riesiges Volumen, interne Links |
| Minuten ↔ Stunden | minuten in stunden 8.100 · 30 · stunden in minuten 5.400 · 30 | Supporting-Tool laut Plan |
| Stundenzettel (PDF/Excel) | stundenzettel 8.100 · 27 · vorlage 6.600 · 23 · pdf 1.900 · 18 | nutzt Arbeitszeitrechner + Export; Wiederkehr-Nutzung |
| Kündigungsfrist-Rechner | kündigungsfrist 49.500 · 28 · berechnen 4.400 · **10** · rechner 1.900 · 15 | multi-input + Gesetz (§ 622 BGB) – AI kann es nicht in einer Zeile |
| Zuschlagsrechner | feiertagszuschlag 4.400 · nachtzuschlag 2.900 · sonntagszuschlag 2.900 · rechner 880 · 12 | multi-input + § 3b EStG Steuerregeln |
| Mutterschutz-Rechner | mutterschutz rechner 6.600 · 26 · berechnen 4.400 · 21 | Datum + gesetzliche Fristen (MuSchG) |

## 6. Interne Verlinkung (Hub & Spoke)
- Jeder Ratgeber verlinkt sein Hub-Tool in den ersten 100 Wörtern (Test prüft das automatisch) und 2–3 Geschwister-Ratgeber.
- **Cluster Urlaub** (→ Arbeitstage-Rechner): urlaubsanspruch berechnen · bei kündigung · teilzeit · resturlaub · krank im urlaub · urlaub minijob · österreich.
- **Cluster Zuschläge** (→ Stundenlohnrechner, später Zuschlagsrechner): nacht · sonntag · feiertag · nachtschicht.
- **Cluster Arbeitszeit** (→ Arbeitszeitrechner): pausenregelung · ruhezeit · gleitzeit · rufbereitschaft · dienstreise · zeiterfassung · 4-tage-woche · wochenarbeitszeit · höchstarbeitszeit · schichtplan · arbeitszeitnachweis.
- **Cluster Überstunden** (→ Überstundenrechner): auszahlen · arbeitszeitkonto · minusstunden · teilzeit.
- **Cluster Kalender** (→ Tage-Rechner, später Kalenderwoche): feiertage 2027 · brückentage · wie viele wochen · schaltjahr · probezeit · zeitumstellung.
- Wenn ein neues Tool live geht: die Ratgeber seines Clusters auf das neue Tool umlinken.

## 7. Bewusst nicht im Plan (zu wenig Volumen oder zu schwer)
homeoffice arbeitszeit (20), pausenregelung jugendliche (20), arbeitszeit österreich (DE 20 / AT 170), bruttostundenlohn berechnen (170), stundenlohn teilzeit (110), alter in tagen (90), mindestlohn (135.000 · KD **74**), arbeitszeitgesetz (27.100 · KD 58), kurzarbeit (9.900 · 43), ferien 2027 (27.100 – braucht Schulferien-Daten aller Länder, Fehlerrisiko), brückentage 2026 (Jahr fast vorbei).

## 8. Ziele nach 12 Wochen (realistisch, keine Garantie)
- 50+ DE-Seiten reviewed & indexiert (20 bestehend + 36 Ratgeber + neue Tools), 100 % CWV.
- Erste Impressionen für alle Tool-Keywords; 3–5 Long-Tails (KD < 20) in den Top 10.
- 5–10 Brand-Erwähnungen/Links, 4 YouTube-Shorts, 1 Linkable Asset.
- AdSense beantragt.
- **Entscheidung Woche 12:** Spanisch starten, wenn DE-Impressionen wachsen (Plan §2) – sonst DE-Tiefe weiter ausbauen.
