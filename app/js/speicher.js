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

  return {
    lade() {
      const fallbackWert = fallback.get(SCHLUESSEL);
      const roh = lese(SCHLUESSEL) ?? fallbackWert;
      if (!roh) return [];

      try {
        const daten = JSON.parse(roh);
        const bloecke = Array.isArray(daten)
          ? daten
          : Array.isArray(daten?.bloecke) ? daten.bloecke : null;
        if (!bloecke) {
          schreibe(`${SCHLUESSEL}.defekt.${Date.now()}`, roh);
          return [];
        }
        const gueltig = bereinigeBloecke(bloecke);
        if (gueltig.length !== bloecke.length) {
          schreibe(`${SCHLUESSEL}.defekt.${Date.now()}`, roh);
        }
        return gueltig;
      } catch {
        // Unlesbare Daten nicht still überschreiben, sondern beiseitelegen.
        schreibe(`${SCHLUESSEL}.defekt.${Date.now()}`, roh);
        return [];
      }
    },
    speichere(bloecke) {
      const daten = JSON.stringify({ version: VERSION, bloecke });
      schreibe(SCHLUESSEL, daten);
    },
    istDauerhaft: () => dauerhaft,
  };
}
