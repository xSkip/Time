// Speichert alle Blöcke im localStorage des Browsers.

import { bereinigeBloecke } from './bloecke.js';

const SCHLUESSEL = 'time.bloecke';
const VERSION = 1;

export function erstelleSpeicher(storage) {
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }

  const fallback = new Map();
  let dauerhaft = true;
  const lese = (schluessel) => {
    if (typeof storage?.getItem !== 'function') {
      dauerhaft = false;
      return null;
    }
    try {
      return storage.getItem(schluessel);
    } catch {
      dauerhaft = false;
      return null;
    }
  };

  const schreibe = (schluessel, wert) => {
    if (typeof storage?.setItem !== 'function') {
      dauerhaft = false;
      fallback.set(schluessel, wert);
      return false;
    }
    try {
      storage.setItem(schluessel, wert);
      return true;
    } catch {
      dauerhaft = false;
      fallback.set(schluessel, wert);
      return false;
    }
  };

  // Legt die Rohdaten beiseite und speichert danach den bereinigten Stand,
  // damit nicht bei jedem Start eine weitere Kopie entsteht. Ohne
  // gelungene Kopie bleibt das Original unangetastet.
  const legeBeiseite = (roh, bloecke) => {
    if (schreibe(`${SCHLUESSEL}.defekt.${Date.now()}`, roh)) {
      schreibe(SCHLUESSEL, JSON.stringify({ version: VERSION, bloecke }));
    }
    return bloecke;
  };

  return {
    lade() {
      const fallbackWert = fallback.get(SCHLUESSEL);
      const roh = lese(SCHLUESSEL) ?? fallbackWert;
      if (!roh) return [];

      let daten;
      try {
        daten = JSON.parse(roh);
      } catch {
        return legeBeiseite(roh, []);
      }
      const bloecke = Array.isArray(daten)
        ? daten
        : Array.isArray(daten?.bloecke) ? daten.bloecke : null;
      if (!bloecke) return legeBeiseite(roh, []);
      const gueltig = bereinigeBloecke(bloecke);
      return gueltig.length === bloecke.length ? gueltig : legeBeiseite(roh, gueltig);
    },
    speichere(bloecke) {
      const daten = JSON.stringify({ version: VERSION, bloecke });
      schreibe(SCHLUESSEL, daten);
    },
    istDauerhaft: () => dauerhaft,
  };
}
