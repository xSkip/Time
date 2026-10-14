# Architektur

Leitgedanke: so einfach wie möglich. Eine kleine App für eine Person, die jahrelang ohne Wartung funktionieren soll.

## Überblick

```
iPhone (Safari / Home-Bildschirm)
┌─────────────────────────────┐
│  Anzeige (ui.js)            │  Knöpfe, Bildschirm, Bearbeiten
├─────────────────────────────┤
│  Berechnung (rechner.js)    │  reine Logik, ohne Bildschirm und Speicher
├─────────────────────────────┤
│  Speicher (speicher.js)     │  localStorage
└─────────────────────────────┘
          ▲
          │ einmalig laden, danach offline (Service Worker)
          │
GitHub Pages (statische Dateien aus xSkip/Time)
```

## Entscheidungen

### Reines HTML, CSS und JavaScript, ohne Framework und Build-Schritt

- Die App hat einen Hauptbildschirm und eine Bearbeitungsansicht. Ein Framework (React, Vue, …) bringt hier mehr Aufwand als Nutzen.
- Was im Repo liegt, ist genau das, was am iPhone läuft. Nichts wird kompiliert oder gebündelt.
- Keine Abhängigkeiten, die veralten oder Sicherheitslücken bekommen.
- JavaScript-Module (ES Modules) sorgen für Struktur.

**Verworfen: Java EE (JBoss, Maven, …).** Das bräuchte einen ständig laufenden Server, der aus dem Internet erreichbar ist und gewartet werden muss, und die Daten lägen zentral auf diesem Server. Das lohnt sich bei mehreren Benutzern oder zentraler Datenhaltung, nicht bei einer persönlichen Rechen-App. GitHub Pages kann außerdem nur statische Dateien ausliefern.

### Drei getrennte Schichten

- **Berechnung (`rechner.js`):** bekommt eine Liste von Einträgen und eine Uhrzeit und liefert das Ergebnis (gearbeitet, Pausen, Abzug, noch offen/Plus, voraussichtliches Ende). Keine Abhängigkeit zu Bildschirm oder Speicher, daher vollständig automatisch testbar.
- **Speicher (`speicher.js`):** Einträge laden und speichern. Austauschbar (später z. B. IndexedDB), ohne die Berechnung anzufassen.
- **Anzeige (`ui.js`):** Bildschirm aufbauen, Knöpfe, Bearbeiten, Aktualisierung jede Minute.

### Datenmodell: Zeitblöcke

```js
{ id: "…", typ: "arbeit" | "pause" | "unterwegs", start: "2026-10-14T08:00", ende: "2026-10-14T12:00" }
```

- Der laufende Block hat noch kein `ende`.
- Ein Knopfdruck beendet den laufenden Block und startet einen neuen.
- Blöcke statt einzelner Knopfdrücke, weil sie sich leicht nachträglich bearbeiten lassen.

### Speicherung: localStorage

- Die Datenmenge ist winzig, kein Server, kein Login, die Daten verlassen das iPhone nicht.
- Sicherung per Export/Import (JSON-Datei).
- Die App muss zum Home-Bildschirm hinzugefügt werden, sonst kann iOS die Daten nach längerer Nichtnutzung löschen.

### PWA

- `manifest.json`: Name, Icon, Vollbild.
- Service Worker: App funktioniert offline.
- iOS-Besonderheiten: `apple-touch-icon`, Statusleiste.

**Verworfen: native iPhone-App.** Bräuchte Apple-Entwicklerkonto (99 €/Jahr), Xcode am Mac und App-Store-Prüfung, ohne Mehrwert für diesen Anwendungsfall.

### Tests und Veröffentlichung

- **Tests:** Node.js mit dem eingebauten Test-Runner (`node --test`), ohne zusätzliche Bibliotheken. Node ist für JavaScript, was die JVM für Java ist: Es führt die Berechnung außerhalb des Browsers aus, so wie JUnit über Maven läuft, ohne auf JBoss zu deployen. Node wird nur zum Entwickeln und Testen gebraucht, nicht von der App selbst.
- **GitHub Actions:** führt bei jedem Push die Tests aus und veröffentlicht die App danach auf GitHub Pages, nur wenn die Tests grün sind.
