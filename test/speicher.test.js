import { test } from 'node:test';
import assert from 'node:assert/strict';

import { erstelleSpeicher } from '../app/js/speicher.js';

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
  assert.equal(speicher.istDauerhaft(), false);
});

test('Beim Lesen fehlerhafter Storage-Implementierungen fällt die App nicht ab', () => {
  const speicher = erstelleSpeicher({
    getItem() { throw new Error('read failed'); },
    setItem() { throw new Error('write failed'); },
  });

  assert.deepEqual(speicher.lade(), []);
  speicher.speichere([{ id: 'y', typ: 'pause', start: 300 }]);
  assert.deepEqual(speicher.lade(), [{ id: 'y', typ: 'pause', start: 300 }]);
  assert.equal(speicher.istDauerhaft(), false);
});

test('Unbekannte Datenformate werden gesichert statt als leerer Stand behandelt', () => {
  const store = new Map([['time.bloecke', '{"andereDaten":true}']]);
  const speicher = erstelleSpeicher({
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  });

  assert.deepEqual(speicher.lade(), []);
  assert.ok([...store.keys()].some((key) => key.startsWith('time.bloecke.defekt.')));
});

test('Ohne Browser-Speicher funktioniert der temporäre Fallback statt eines Absturzes', () => {
  const speicher = erstelleSpeicher();
  assert.deepEqual(speicher.lade(), []);
  speicher.speichere([{ id: 'z', typ: 'arbeit', start: 400 }]);
  assert.deepEqual(speicher.lade(), [{ id: 'z', typ: 'arbeit', start: 400 }]);
  assert.equal(speicher.istDauerhaft(), false);
});
