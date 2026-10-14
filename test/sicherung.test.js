import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportiere, liesSicherung, zusammenfuehren, dateiname } from '../app/js/sicherung.js';

const um = (tag, h, m) => new Date(2026, 9, tag, h, m).getTime();
const bloecke = [
  { id: 'a', typ: 'arbeit', start: um(13, 8, 0), ende: um(13, 16, 0) },
  { id: 'b', typ: 'arbeit', start: um(14, 8, 0) },
];

test('Export und Import ergeben dieselben Blöcke', () => {
  assert.deepEqual(liesSicherung(exportiere(bloecke, um(14, 9, 0))), bloecke);
});

test('Dateiname enthält das Datum', () => {
  assert.equal(dateiname(um(14, 9, 0)), 'time-sicherung-2026-10-14.json');
});

test('fremde oder kaputte Dateien werden abgelehnt', () => {
  assert.throws(() => liesSicherung('kein json'), /keine gültige Sicherung/);
  assert.throws(() => liesSicherung('{"app":"anders","bloecke":[]}'), /keine Time-Sicherung/);
  assert.throws(() => liesSicherung('{"app":"time","version":99,"bloecke":[]}'), /neueren Version/);
  assert.throws(
    () => liesSicherung('{"app":"time","version":1,"bloecke":[{"id":"x","typ":"kaffee","start":1}]}'),
    /ungültige Einträge/,
  );
});

test('Zusammenführen behält Vorhandenes und übernimmt Importiertes', () => {
  const vorhanden = [{ id: 'c', typ: 'pause', start: um(14, 12, 0), ende: um(14, 12, 30) }, { ...bloecke[1] }];
  const importiert = [bloecke[0], { ...bloecke[1], ende: um(14, 10, 0) }];
  const ergebnis = zusammenfuehren(vorhanden, importiert);
  assert.deepEqual(ergebnis.map((b) => b.id), ['a', 'b', 'c']);
  assert.equal(ergebnis[1].ende, um(14, 10, 0));
});
