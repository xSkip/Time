// Sicherung: alle Blöcke als JSON-Datei exportieren und wieder einlesen.

import { istGueltigerBlock } from './bloecke.js';

const APP = 'time';
const VERSION = 1;

export function exportiere(alle, jetzt) {
  return JSON.stringify({ app: APP, version: VERSION, exportiert: new Date(jetzt).toISOString(), bloecke: alle }, null, 2);
}

export function dateiname(jetzt) {
  const d = new Date(jetzt);
  const p = (n) => String(n).padStart(2, '0');
  return `time-sicherung-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

// Liest eine Sicherung ein und liefert die Blöcke. Wirft einen Error mit
// verständlicher Meldung, wenn die Datei nicht passt.
export function liesSicherung(text) {
  let daten;
  try {
    daten = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist keine gültige Sicherung.');
  }
  if (daten?.app !== APP || !Array.isArray(daten.bloecke)) {
    throw new Error('Die Datei ist keine Time-Sicherung.');
  }
  if (!Number.isInteger(daten.version) || daten.version < 1) {
    throw new Error('Die Sicherung hat keine gültige Versionsnummer.');
  }
  if (daten.version > VERSION) {
    throw new Error('Die Sicherung stammt aus einer neueren Version der App.');
  }
  const ids = new Set();
  for (const b of daten.bloecke) {
    if (!istGueltigerBlock(b) || ids.has(b.id)) {
      throw new Error('Die Sicherung enthält ungültige oder doppelte Einträge.');
    }
    ids.add(b.id);
  }
  return daten.bloecke;
}

// Führt vorhandene und importierte Blöcke zusammen. Gleiche id: der
// importierte Eintrag gewinnt. Nichts Vorhandenes geht verloren.
export function zusammenfuehren(alle, importiert) {
  const nachId = new Map(alle.map((b) => [b.id, b]));
  for (const b of importiert) nachId.set(b.id, b);
  return [...nachId.values()].sort((a, b) => a.start - b.start);
}
