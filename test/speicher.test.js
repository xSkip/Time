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

test('Fehlerhafte Daten werden nur einmal beiseitegelegt und danach bereinigt gespeichert', () => {
  const store = new Map([['time.bloecke', JSON.stringify({ version: 1, bloecke: [
    { id: 'a', typ: 'arbeit', start: 1, ende: 2 },
    { id: 'b', typ: 'kekse', start: 3 },
  ] })]]);
  const storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };

  erstelleSpeicher(storage).lade();
  erstelleSpeicher(storage).lade();
  const kopien = [...store.keys()].filter((key) => key.startsWith('time.bloecke.defekt.'));
  assert.equal(kopien.length, 1);
  assert.match(store.get(kopien[0]), /kekse/);
  assert.deepEqual(erstelleSpeicher(storage).lade(), [{ id: 'a', typ: 'arbeit', start: 1, ende: 2 }]);
});

test('Gelingt die Kopie nicht, bleiben die Originaldaten unangetastet', () => {
  const roh = JSON.stringify({ version: 1, bloecke: [{ id: 'b', typ: 'kekse', start: 3 }] });
  const store = new Map([['time.bloecke', roh]]);
  const speicher = erstelleSpeicher({
    getItem: (key) => store.get(key) ?? null,
    setItem() { throw new Error('quota'); },
  });

  assert.deepEqual(speicher.lade(), []);
  assert.equal(store.get('time.bloecke'), roh);
});
