// Speichert alle Blöcke im localStorage des Browsers.

import { bereinigeBloecke } from './bloecke.js';

const SCHLUESSEL = 'time.bloecke';
const VERSION = 1;

// 53-Bit-Prüfsumme (cyrb53) eines Textes, als Hex-Zeichenkette.
function pruefsumme(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

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

  // Legt die Rohdaten beiseite und speichert danach den bereinigten Stand.
  // Die Kopie heißt nach einer Prüfsumme der Rohdaten: Dieselben defekten
  // Daten landen so immer unter demselben Schlüssel, auch wenn das Speichern
  // des bereinigten Stands scheitert und beim nächsten Start erneut gesichert
  // wird. Ohne gelungene Kopie bleibt das Original unangetastet.
  const legeBeiseite = (roh, bloecke) => {
    if (schreibe(`${SCHLUESSEL}.defekt.${pruefsumme(roh)}`, roh)) {
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
