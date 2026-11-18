---
tool: worktime
keyword: "arbeitszeitrechner"
secondary: ["arbeitszeit berechnen", "arbeitszeitrechner mit pause", "zeiterfassung rechner"]
title: "Arbeitszeitrechner – mit Pause, Nachtstunden & Export"
description: "Arbeitszeit für mehrere Tage berechnen: gesetzliche Pause nach ArbZG automatisch prüfen, Nacht- und Sonntagsstunden, Summe in Industriestunden, CSV/PDF."
h1: "Arbeitszeitrechner mit Pausenregel"
answer: "Ihre Arbeitszeit ist die Zeit zwischen Arbeitsbeginn und Arbeitsende minus Pausen. In Deutschland sind bei mehr als 6 Stunden mindestens 30 Minuten und bei mehr als 9 Stunden 45 Minuten Pause Pflicht. Der Rechner summiert mehrere Tage, prüft Pausen, Höchstarbeitszeit und Ruhezeit und zeigt das Ergebnis in Stunden und Industriestunden."
related: ["hours", "overtime", "workdays", "wage", "days"]
updated: 2026-11-18
author: author
reviewer: reviewer
reviewed: false
sources:
  - label: "Arbeitszeitgesetz (ArbZG) – gesetze-im-internet.de"
    url: "https://www.gesetze-im-internet.de/arbzg/"
  - label: "Arbeitszeitgesetz Österreich (AZG) – RIS"
    url: "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008238"
  - label: "Arbeitsgesetz Schweiz (ArG) – fedlex"
    url: "https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de"
faq:
  - q: "Wie viel Pause ist bei 8 Stunden Arbeit Pflicht?"
    a: "Bei mehr als 6 bis zu 9 Stunden Arbeitszeit schreibt § 4 ArbZG mindestens 30 Minuten Pause vor. Wer 8 Stunden arbeitet, ist also 8,5 Stunden im Betrieb, zum Beispiel von 8:00 bis 16:30 Uhr."
  - q: "Zählt die Pause zur Arbeitszeit?"
    a: "Nein. Ruhepausen sind keine Arbeitszeit und werden in der Regel nicht bezahlt. Der Rechner zieht die eingetragene Pause deshalb von der Anwesenheitszeit ab."
  - q: "Was passiert bei einer Nachtschicht über Mitternacht?"
    a: "Liegt das Ende vor dem Beginn (z. B. 22:00 bis 06:00 Uhr), rechnet der Rechner automatisch bis zum nächsten Tag. Nachtstunden (23–6 Uhr) und Stunden am Sonntag werden getrennt ausgewiesen."
  - q: "Wie rechne ich die Arbeitszeit in Industriestunden um?"
    a: "Teilen Sie die Minuten durch 60: 7 Stunden 45 Minuten sind 7,75 Industriestunden. Der Rechner zeigt die Summe automatisch in beiden Formaten."
---

## So funktioniert's

1. Wählen Sie das Land (Deutschland, Österreich oder Schweiz) und – für Deutschland – optional das Bundesland, damit Feiertage erkannt werden.
2. Tragen Sie pro Arbeitstag Datum, Beginn, Ende und Pause in Minuten ein. Mit „Aktuelle Woche“ legt der Rechner Montag bis Freitag an.
3. Der Rechner zeigt für jeden Tag die Nettoarbeitszeit und darunter die Summe – in Stunden:Minuten und in Industriestunden.
4. Hinweise erscheinen, wenn eine Pause zu kurz ist, die tägliche Höchstarbeitszeit überschritten wird oder zwischen zwei Schichten weniger als 11 Stunden Ruhe liegen.
5. Über „CSV exportieren“ übernehmen Sie die Tabelle in Excel, über „Als PDF speichern“ drucken Sie einen Stundenzettel.

Ihre Einträge bleiben im Browser gespeichert, sodass die Woche beim nächsten Besuch noch da ist.

## Beispiele

| Arbeitstag | Beginn | Ende | Pause | Arbeitszeit | Hinweis |
| --- | --- | --- | --- | --- | --- |
| Montag | 8:00 | 16:30 | 30 Min. | 8:00 Std. | in Ordnung |
| Dienstag | 7:30 | 17:45 | 30 Min. | 9:45 Std. | mehr als 9 Std. → 45 Min. Pause nötig |
| Mittwoch | 9:00 | 15:00 | 0 Min. | 6:00 Std. | genau 6 Std. → keine Pause vorgeschrieben |
| Freitag | 22:00 | 6:00 | 30 Min. | 7:30 Std. | davon 7 Std. Nachtzeit (23–6 Uhr) |

## Formel und gesetzliche Regeln

**Arbeitszeit = Ende − Beginn − Pausen.** Liegt das Ende vor dem Beginn, kommen 24 Stunden hinzu (Schicht über Mitternacht). Industriestunden = Minuten ÷ 60.

**Deutschland (Arbeitszeitgesetz):**

- **Pausen (§ 4 ArbZG):** mehr als 6 bis 9 Stunden Arbeit → mindestens 30 Minuten; mehr als 9 Stunden → mindestens 45 Minuten. Pausen dürfen in Abschnitte von mindestens 15 Minuten aufgeteilt werden. Länger als 6 Stunden am Stück darf niemand ohne Pause arbeiten.
- **Höchstarbeitszeit (§ 3 ArbZG):** grundsätzlich 8 Stunden pro Werktag, bis zu 10 Stunden, wenn im Durchschnitt von sechs Monaten oder 24 Wochen 8 Stunden nicht überschritten werden.
- **Ruhezeit (§ 5 ArbZG):** nach Arbeitsende mindestens 11 Stunden ununterbrochene Ruhe. In einigen Branchen sind Verkürzungen mit Ausgleich möglich.
- **Nachtzeit (§ 2 ArbZG):** 23 bis 6 Uhr (in Bäckereien und Konditoreien 22 bis 5 Uhr).
- **Sonn- und Feiertage (§ 9 ArbZG):** grundsätzlich arbeitsfrei; Ausnahmen regelt § 10.

**Österreich (AZG):** Bei mehr als 6 Stunden Tagesarbeitszeit ist eine Pause von mindestens 30 Minuten vorgeschrieben; die Tagesarbeitszeit darf höchstens 12 Stunden betragen; die tägliche Ruhezeit beträgt mindestens 11 Stunden.

**Schweiz (ArG):** Pausen von mindestens 15 Minuten bei mehr als 5½ Stunden, 30 Minuten bei mehr als 7 Stunden und einer Stunde bei mehr als 9 Stunden Arbeit; tägliche Ruhezeit mindestens 11 Stunden.

Tarifverträge und Betriebsvereinbarungen können für Sie abweichende Regeln enthalten – der Rechner prüft die gesetzlichen Mindeststandards.

## Varianten

- **Wochenarbeitszeit:** Tragen Sie alle Tage einer Woche ein; erfassen Sie mehrere Wochen, zeigt der Rechner die Summe je Kalenderwoche.
- **Gleitzeit und Teilzeit:** Die Vorgaben gelten unabhängig vom Umfang – auch bei Teilzeit ist ab mehr als 6 Stunden eine Pause Pflicht.
- **Überstunden:** Vergleichen Sie Ihr Ergebnis mit Ihrer Sollzeit im [Überstundenrechner](/de/ueberstundenrechner/).
- **Einzelne Zeitspanne:** Für eine schnelle Rechnung „von – bis“ ohne Tabelle nutzen Sie den [Stundenrechner](/de/stundenrechner/).

## Zeiterfassung ist Pflicht

Nach einem Beschluss des Bundesarbeitsgerichts vom 13. September 2022 (1 ABR 22/21) müssen Arbeitgeber in Deutschland die Arbeitszeit ihrer Beschäftigten erfassen. Wie genau, ist noch nicht abschließend gesetzlich geregelt. Der Rechner ersetzt kein betriebliches Zeiterfassungssystem, hilft aber, eigene Aufzeichnungen zu prüfen.
