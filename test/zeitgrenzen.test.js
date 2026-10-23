import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bloeckeVonTag, naechsterTag, schliesseAlte, tagesbeginn } from '../app/js/bloecke.js';
import { uhrzeit, zeitAmTag } from '../app/js/format.js';

process.env.TZ = 'Europe/Vienna';

const lokal = (jahr, monat, tag, stunde = 12, minute = 0) =>
  new Date(jahr, monat - 1, tag, stunde, minute).getTime();

test('Kalendertage berücksichtigen 23- und 25-Stunden-Tage durch Zeitumstellung', () => {
  const fruehling = lokal(2026, 3, 29);
  const herbst = lokal(2026, 10, 25);

  assert.equal(naechsterTag(fruehling) - tagesbeginn(fruehling), 23 * 60 * 60 * 1000);
  assert.equal(naechsterTag(herbst) - tagesbeginn(herbst), 25 * 60 * 60 * 1000);
});

test('Tagesfilter ordnet Blöcke exakt an Mitternacht dem richtigen Tag zu', () => {
  const heute = lokal(2026, 3, 29);
  const gesternMitternacht = tagesbeginn(heute);
  const morgenMitternacht = naechsterTag(heute);
  const alle = [
    { id: 'gestern', typ: 'arbeit', start: gesternMitternacht - 1, ende: gesternMitternacht },
    { id: 'heute', typ: 'arbeit', start: gesternMitternacht, ende: morgenMitternacht },
    { id: 'morgen', typ: 'arbeit', start: morgenMitternacht, ende: morgenMitternacht + 1 },
  ];

  assert.deepEqual(bloeckeVonTag(alle, heute).map((block) => block.id), ['heute']);
  assert.deepEqual(bloeckeVonTag(alle, morgenMitternacht).map((block) => block.id), ['morgen']);
});

test('Vergessener laufender Block endet an der lokalen Mitternacht, auch am DST-Wechseltag', () => {
  const start = lokal(2026, 3, 28, 23, 30);
  const jetzt = lokal(2026, 3, 29, 0, 5);
  const geschlossen = schliesseAlte([{ id: 'nacht', typ: 'arbeit', start }], jetzt);

  assert.equal(uhrzeit(geschlossen[0].ende), '00:00');
  assert.equal(geschlossen[0].ende - start, 30 * 60 * 1000);
});

test('Uhrzeit-Eingaben an DST-Lücken und doppelte Herbststunden folgen lokaler Kalenderzeit', () => {
  const fruehling = tagesbeginn(lokal(2026, 3, 29));
  const herbst = tagesbeginn(lokal(2026, 10, 25));
  const nichtExistierend = zeitAmTag(fruehling, '02:30');
  const doppelt = zeitAmTag(herbst, '02:30');

  assert.equal(uhrzeit(nichtExistierend), '03:30');
  assert.equal(nichtExistierend, lokal(2026, 3, 29, 3, 30));
  assert.equal(uhrzeit(doppelt), '02:30');
  assert.equal(doppelt, lokal(2026, 10, 25, 2, 30));
});
