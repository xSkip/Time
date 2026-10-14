# Umsetzungsplan

Jeder Schritt endet mit etwas, das sich ausprobieren oder prüfen lässt. Erledigte Schritte werden abgehakt.

## Version 1

- [x] **1. Projektstruktur aufsetzen**
  Ordner und leere Dateien, Node.js installieren, ein erster Test läuft.
  *Ergebnis: Grundgerüst im Repo.*

- [x] **2. Berechnungslogik mit Tests**
  Arbeitszeit, Pausenregel (30 min nach 6 h, Wegzeit zählt nicht als Pause), noch offen / Plus, voraussichtliches Ende inklusive noch fälliger Pausendifferenz. Das Beispiel aus den Anforderungen wird ein Testfall, dazu Grenzfälle (genau 6 h, nur 15 min Pause, laufender Block, …).
  *Ergebnis: Rechnung nachweislich korrekt, noch ohne Bildschirm.*

- [x] **3. Speicherung**
  Blöcke speichern und laden, neuer Tag ab Mitternacht, Umgang mit einem vom Vortag noch laufenden Block.
  *Ergebnis: Daten überleben ein Neuladen.*

- [x] **4. Hauptbildschirm**
  Große Anzeige „noch offen“ und Ende-Uhrzeit, Knöpfe „Arbeit starten“ / „Pause“ / „Unterwegs“, Liste der heutigen Einträge, Aktualisierung jede Minute. Für Einhandbedienung am iPhone.
  *Ergebnis: im Browser benutzbar.*

- [x] **5. Einträge bearbeiten**
  Zeiten ändern, Typ ändern (Pause ↔ Unterwegs), Einträge hinzufügen und löschen.
  *Ergebnis: Fehler sind korrigierbar.*

- [x] **6. PWA**
  Manifest, Icon, Service Worker für Offline-Betrieb.
  *Ergebnis: am Home-Bildschirm installierbar.*

- [ ] **7. Automatische Veröffentlichung**
  GitHub Actions: Tests, danach Deployment auf GitHub Pages.
  *Ergebnis: App live unter `xskip.github.io/Time`.*

- [ ] **8. Test am iPhone**
  App installieren, ein, zwei Tage benutzen, Störendes ausbessern.
  *Ergebnis: Version 1 fertig.*

- [x] **9. Sicherung**
  Export und Import der Daten als JSON-Datei.
  *Ergebnis: Schutz vor Datenverlust.*

## Später

- [ ] Gleitzeitsaldo über mehrere Tage
- [ ] Verlauf, Wochen- und Monatssummen
