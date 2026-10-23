// Speichert alle Blöcke im localStorage des Browsers.

import { bereinigeBloecke } from './bloecke.js';

const SCHLUESSEL = 'time.bloecke';
const VERSION = 1;

export function erstelleSpeicher(storage = globalThis.localStorage) {
  const fallback = new Map();
  const lese = (schluessel) => {
    try {
      return storage?.getItem?.(schluessel) ?? null;
    } catch {
      return null;
    }
  };

  const schreibe = (schluessel, wert) => {
    try {
      storage?.setItem?.(schluessel, wert);
      return true;
    } catch {
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
        const bloecke = Array.isArray(daten) ? daten : Array.isArray(daten?.bloecke) ? daten.bloecke : [];
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
      if (!schreibe(SCHLUESSEL, daten)) {
        fallback.set(SCHLUESSEL, daten);
      }
    },
  };
}
