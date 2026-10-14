# Time

> Status: Anforderungen werden gerade gesammelt.

## Ziel

Ein persönliches Tool, das am Handy auf einen Blick zeigt, **wie viel ich heute noch arbeiten muss** (oder wie viel ich schon drüber bin), um mein Tagessoll zu erreichen.

## Problem

Mein Arbeitstag ist oft aufgeteilt: einige Stunden im Büro, dann Mittagspause und/oder Fitnessstudio, danach Home Office. Nur Arbeit zählt, Pausen, Sport und Wegzeiten nicht. Derzeit rechne ich das in Excel aus, und das Zusammenrechnen der Pausenzeiten ist mühsam.

## Nutzer

Nur ich (eine Person, keine Benutzerverwaltung).

## Regeln

- **Tagessoll:** 7 h 42 min, jeden Arbeitstag gleich.
- **Arbeitszeit:** Büro und Home Office zählen gleich. Alles andere (Mittagspause, Fitnessstudio, Wegzeit, …) zählt nicht.
- **Gesetzliche Pause:** Ab mehr als 6 h Arbeit werden mindestens 30 min Pause abgezogen. Waren die Pausen des Tages kürzer als 30 min, wird die Differenz von der Arbeitszeit abgezogen. Längere Pausen werden voll berücksichtigt (sie sind ja ohnehin keine Arbeitszeit).

## Erfassung (Vorschlag)

- **Ein großer Knopf:** „Arbeit starten“ / „Arbeit unterbrechen“. Jeder Druck öffnet oder schließt einen Arbeitsblock. Die Zeit zwischen zwei Blöcken ist automatisch Pause, egal ob Mittagessen, Fitnessstudio oder Heimweg.
- **Nachträglich korrigieren:** Blöcke können bearbeitet, hinzugefügt oder gelöscht werden (z. B. vergessen zu drücken: „hab eigentlich um 7:50 angefangen“).
- Kein Unterscheiden von Pausenarten nötig, die Lücken reichen.

## Anzeige

- Heute gearbeitet (netto, nach Pausenregel)
- **Noch offen bis zum Soll**, oder **Plus**, wenn das Soll schon überschritten ist
- **Voraussichtliches Ende:** „Wenn du jetzt (weiter)arbeitest, bist du um 17:40 fertig“, inklusive einer eventuell noch fälligen Pausendifferenz
- Liste der heutigen Blöcke

## Später (nicht Tag 1)

- Plus/Minus über längere Zeit (Gleitzeitsaldo)
- Verlauf vergangener Tage, Wochen- und Monatssummen, Export

## Plattform und Hosting

Am Handy schnell erreichbar, als Website oder App. Auf dem Server läuft kein Webserver. Vorhanden: WordPress bei Raidboxes, GitHub. Entscheidung offen (siehe Vorschlag in der Besprechung).

## Technik

_Noch offen._
