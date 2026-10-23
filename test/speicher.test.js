import { test } from 'node:test';
import assert from 'node:assert/strict';

import { erstelleSpeicher } from '../app/js/speicher.js';

function speicherMitFehlern({ fehlerBeimLesen = false, fehlerBeimSchreiben = false, daten = null } = {}) {
  const store = new Map();
  return {
    storage: {
      getItem(key) {
        if (fehlerBeimLesen) throw new Error('read failed');
        return key in Object.fromEntries(store.entries()) ? store.get(key) ?? null : null;
      },
      setItem(key, value) {
        if (fehlerBeimSchreiben) throw new Error('write failed');
        store.set(key, String(value));
      },
    },
    daten: () => daten,
    store,
  };
}

test('Fehlerhafte gespeicherte Daten werden bereinigt und nur gültige Blöcke übernommen', () => {
  const store = new Map();
  const speicher = erstelleSpeicher({
    getItem(key) {
      if (key === 'time.bloecke') {
        return JSON.stringify({ bloecke: [
          { id: 'a', typ: 'arbeit', start: 1, ende: 2 },
          { id: 'b', typ: 'kekse', start: 3 },
          { id: 'c', typ: 'pause', start: 4, ende: 3 },
        ] });
      }
      return null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  });

  assert.deepEqual(speicher.lade(), [{ id: 'a', typ: 'arbeit', start: 1, ende: 2 }]);
  assert.match([...store.keys()].join(','), /defekt/);
});

test('Wenn das Speichern fehlschlägt, bleibt ein Fallback im Speicher erhalten', () => {
  const speicher = erstelleSpeicher({
    getItem() { return null; },
    setItem() { throw new Error('quota'); },
  });

  speicher.speichere([{ id: 'x', typ: 'arbeit', start: 100, ende: 200 }]);
  assert.deepEqual(speicher.lade(), [{ id: 'x', typ: 'arbeit', start: 100, ende: 200 }]);
});

test('Beim Lesen fehlerhafter Storage-Implementierungen fällt die App nicht ab', () => {
  const speicher = erstelleSpeicher({
    getItem() { throw new Error('read failed'); },
    setItem() { throw new Error('write failed'); },
  });

  assert.deepEqual(speicher.lade(), []);
  speicher.speichere([{ id: 'y', typ: 'pause', start: 300 }]);
  assert.deepEqual(speicher.lade(), [{ id: 'y', typ: 'pause', start: 300 }]);
});
