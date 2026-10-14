# Anforderungen

## Ziel

Ein persönliches Tool, das am Handy auf einen Blick zeigt, **wie viel ich heute noch arbeiten muss** (oder wie viel ich schon drüber bin), um mein Tagessoll zu erreichen.

Der Hauptanwendungsfall: Ich komme am Nachmittag nach Hause und will sofort wissen, wie lange ich noch im Home Office arbeiten muss.

## Problem

Mein Arbeitstag ist oft aufgeteilt: einige Stunden im Büro, dann Mittagspause und/oder Fitnessstudio, danach Home Office. Nur Arbeit zählt, Pausen, Sport und Wegzeiten nicht. Derzeit rechne ich das in Excel aus, und das Zusammenrechnen der Pausenzeiten ist mühsam.

## Nutzer

Nur ich (eine Person, keine Benutzerverwaltung, kein Login).

## Rechenregeln

- **Tagessoll:** 7 h 42 min, an jedem Tag, an dem ich die App benutze.
- **Arbeitszeit:** Büro und Home Office zählen gleich.
- **Keine Arbeitszeit:** Mittagspause, Fitnessstudio, Wegzeit (z. B. Heimfahrt) und alles andere.
- **Gesetzliche Pause:** Sobald die Arbeitszeit des Tages 6 h überschreitet, müssen mindestens 30 min Pause angefallen sein. Ist die Summe der Pausen kleiner als 30 min, wird die Differenz von der Arbeitszeit abgezogen.
  Der Abzug wird nie größer als die Zeit über 6 h. Beispiel ohne Pause: Bei 6:10 h Arbeit zählen 6:00 h, ab 6:30 h Arbeit werden die vollen 30 min abgezogen. So springt die Anzeige bei 6 h nicht plötzlich um 30 min zurück.
- **Was als Pause zählt:** Jede Unterbrechung, die der Erholung dient (Mittagspause, Fitnessstudio, …). **Wegzeit zählt nicht als Pause**, weil sie nicht der Erholung dient. Sie ist weder Arbeitszeit noch Pause.

### Beispiel

| Zeit | Tätigkeit | Art |
|---|---|---|
| 08:00–12:00 | Büro | Arbeit (4:00) |
| 12:00–12:20 | Mittagessen | Pause (0:20) |
| 12:20–14:30 | Büro | Arbeit (2:10) |
| 14:30–16:15 | Fitnessstudio | Pause (1:45) |
| 16:15–16:45 | Heimfahrt | Wegzeit (zählt nicht) |
| ab 16:45 | Home Office | Arbeit |

Um 16:45: gearbeitet 6:10 h, Pausen 2:05 h (≥ 30 min, also kein Abzug), **noch offen 1:32 h, fertig um 18:17**.

## Erfassung

- **Ein großer Knopf „Arbeit starten“**, solange ich nicht arbeite.
- **Während der Arbeit zwei Knöpfe:** „Pause“ (Mittagessen, Sport, …) und „Unterwegs“ (Wegzeit). Damit ist jede Unterbrechung gleich richtig eingeordnet.
- **„Feierabend“** beendet den laufenden Eintrag, ohne einen neuen zu starten. Wird er vergessen, endet der Eintrag automatisch um Mitternacht.
- **Nachträglich korrigieren:** Einträge lassen sich bearbeiten, hinzufügen und löschen (z. B. vergessen zu drücken, oder Pause und Wegzeit verwechselt).
- Ein neuer Tag beginnt automatisch um Mitternacht.

## Anzeige (Startbildschirm)

- **Noch offen bis zum Soll**, groß und sofort sichtbar, oder **Plus**, wenn das Soll schon erreicht ist
- **Voraussichtliches Ende:** „Wenn du jetzt (weiter)arbeitest, bist du um 18:17 fertig“, inklusive einer eventuell noch fälligen Pausendifferenz
- Heute gearbeitet (netto, nach Pausenregel) und Summe der Pausen
- Liste der heutigen Einträge

## Nicht nötig

- Wochenenden, Feiertage und Urlaub
- Mehrere Benutzer, Login

## Später (nicht Teil der ersten Version)

- Plus/Minus über längere Zeit (Gleitzeitsaldo)
- Verlauf vergangener Tage, Wochen- und Monatssummen, Export

## Plattform und Hosting

- **Gerät:** iPhone
- **Form:** Web-App (PWA), die über Safari zum Home-Bildschirm hinzugefügt wird. Sie hat ein eigenes Icon, läuft im Vollbild und funktioniert offline.
- **Hosting:** GitHub Pages aus dem öffentlichen Repo `xSkip/Time`
- **Daten:** bleiben nur lokal auf dem iPhone (Browser-Speicher), kein Server. Die App muss zum Home-Bildschirm hinzugefügt werden, sonst kann iOS die Daten nach längerer Nichtnutzung löschen.
- Im Code stehen keine persönlichen Daten.
