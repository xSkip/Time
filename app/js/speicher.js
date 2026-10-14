// Speichert alle Blöcke im localStorage des Browsers.

const SCHLUESSEL = 'time.bloecke';
const VERSION = 1;

export function erstelleSpeicher(storage = globalThis.localStorage) {
  return {
    lade() {
      const roh = storage.getItem(SCHLUESSEL);
      if (!roh) return [];
      try {
        const daten = JSON.parse(roh);
        if (Array.isArray(daten.bloecke)) return daten.bloecke;
      } catch {
        // fällt durch zur Sicherung
      }
      // Unlesbare Daten nicht still überschreiben, sondern beiseitelegen.
      storage.setItem(`${SCHLUESSEL}.defekt.${Date.now()}`, roh);
      return [];
    },
    speichere(bloecke) {
      storage.setItem(SCHLUESSEL, JSON.stringify({ version: VERSION, bloecke }));
    },
  };
}
