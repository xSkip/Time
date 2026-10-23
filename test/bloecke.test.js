import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  wechsle, laufender, bloeckeVonTag, schliesseAlte, aendere, loesche, fuegeHinzu, pruefe, pruefeListe,
} from '../app/js/bloecke.js';
import { erstelleSpeicher } from '../app/js/speicher.js';

const um = (tag, h, m) => new Date(2026, 9, tag, h, m).getTime();
let zaehler = 0;
const id = () => `b${++zaehler}`;

test('Knopfdrücke erzeugen aufeinanderfolgende Blöcke', () => {
  let alle = [];
  alle = wechsle(alle, 'arbeit', um(14, 8, 0), id);
  alle = wechsle(alle, 'pause', um(14, 12, 0), id);
  alle = wechsle(alle, 'arbeit', um(14, 12, 30), id);
  alle = wechsle(alle, 'unterwegs', um(14, 16, 0), id);
  alle = wechsle(alle, 'arbeit', um(14, 16, 30), id);

  assert.deepEqual(alle.map((b) => b.typ), ['arbeit', 'pause', 'arbeit', 'unterwegs', 'arbeit']);
  assert.equal(alle[0].ende, um(14, 12, 0));
  assert.equal(alle[3].ende, um(14, 16, 30));
  assert.equal(laufender(alle).start, um(14, 16, 30));
});

test('Feierabend beendet den laufenden Block ohne neuen zu starten', () => {
  let alle = wechsle([], 'arbeit', um(14, 8, 0), id);
  alle = wechsle(alle, null, um(14, 17, 0), id);
  assert.equal(alle.length, 1);
  assert.equal(alle[0].ende, um(14, 17, 0));
  assert.equal(laufender(alle), null);
});

test('denselben Typ nochmal drücken ändert nichts', () => {
  const alle = wechsle([], 'arbeit', um(14, 8, 0), id);
  assert.equal(wechsle(alle, 'arbeit', um(14, 9, 0), id), alle);
});

test('bloeckeVonTag liefert nur die Blöcke von heute', () => {
  const alle = [
    { id: 'a', typ: 'arbeit', start: um(13, 8, 0), ende: um(13, 16, 0) },
    { id: 'b', typ: 'arbeit', start: um(14, 8, 0) },
  ];
  assert.deepEqual(bloeckeVonTag(alle, um(14, 10, 0)).map((b) => b.id), ['b']);
});

test('ein vom Vortag noch laufender Block wird um Mitternacht beendet', () => {
  const alle = [{ id: 'a', typ: 'arbeit', start: um(13, 15, 0) }];
  const neu = schliesseAlte(alle, um(14, 7, 0));
  assert.equal(neu[0].ende, um(14, 0, 0));
  assert.equal(laufender(neu), null);
});

test('ein heute laufender Block bleibt offen', () => {
  const alle = [{ id: 'a', typ: 'arbeit', start: um(14, 8, 0) }];
  assert.equal(schliesseAlte(alle, um(14, 9, 0)), alle);
});

test('Blöcke ändern, hinzufügen und löschen', () => {
  let alle = [{ id: 'a', typ: 'pause', start: um(14, 12, 0), ende: um(14, 12, 30) }];
  alle = aendere(alle, 'a', { typ: 'unterwegs' });
  assert.equal(alle[0].typ, 'unterwegs');
  alle = fuegeHinzu(alle, { typ: 'arbeit', start: um(14, 8, 0), ende: um(14, 12, 0) }, () => 'n');
  assert.deepEqual(alle.map((b) => b.id), ['n', 'a']);
  alle = loesche(alle, 'a');
  assert.deepEqual(alle.map((b) => b.id), ['n']);
});

test('pruefe erkennt ungültige Blöcke', () => {
  const jetzt = um(14, 12, 0);
  assert.equal(pruefe({ typ: 'arbeit', start: um(14, 8, 0), ende: um(14, 9, 0) }, jetzt), null);
  assert.match(pruefe({ typ: 'arbeit', start: um(14, 9, 0), ende: um(14, 8, 0) }, jetzt), /vor dem Beginn/);
  assert.match(pruefe({ typ: 'arbeit', start: um(14, 13, 0) }, jetzt), /Beginn liegt in der Zukunft/);
  assert.match(pruefe({ typ: 'arbeit', start: um(14, 11, 0), ende: um(14, 13, 0) }, jetzt), /Ende liegt in der Zukunft/);
  assert.match(pruefe({ typ: 'kaffee', start: um(14, 8, 0) }, jetzt), /Art/);
});

function speicherAttrappe() {
  const daten = new Map();
  return {
    daten,
    getItem: (k) => (daten.has(k) ? daten.get(k) : null),
    setItem: (k, v) => daten.set(k, String(v)),
  };
}

test('Speicher: Daten überleben Speichern und Laden', () => {
  const storage = speicherAttrappe();
  const bloecke = [{ id: 'a', typ: 'arbeit', start: um(14, 8, 0) }];
  erstelleSpeicher(storage).speichere(bloecke);
  assert.deepEqual(erstelleSpeicher(storage).lade(), bloecke);
});

test('Speicher: leer ergibt leere Liste', () => {
  assert.deepEqual(erstelleSpeicher(speicherAttrappe()).lade(), []);
});

test('Speicher: unlesbare Daten werden gesichert statt überschrieben', () => {
  const storage = speicherAttrappe();
  storage.setItem('time.bloecke', '{kaputt');
  assert.deepEqual(erstelleSpeicher(storage).lade(), []);
  const sicherung = [...storage.daten.keys()].find((k) => k.startsWith('time.bloecke.defekt.'));
  assert.equal(storage.getItem(sicherung), '{kaputt');
});

test('Platzhalter nachträglich korrigieren: Nachbarn wandern mit', () => {
  // Arbeit, Pause, Arbeit um 11:30 schnell hintereinander als Platzhalter angelegt
  let alle = wechsle([], 'arbeit', um(14, 11, 30), () => 'a1');
  alle = wechsle(alle, 'pause', um(14, 11, 30), () => 'p');
  alle = wechsle(alle, 'arbeit', um(14, 11, 30), () => 'a2');

  // Beginn der ersten Arbeit korrigieren: ihr Ende bleibt
  alle = aendere(alle, 'a1', { start: um(14, 8, 30) });
  const a1 = alle.find((b) => b.id === 'a1');
  assert.equal(a1.start, um(14, 8, 30));
  assert.equal(a1.ende, um(14, 11, 30));

  // Pause korrigieren: Ende davor und Beginn danach wandern mit
  alle = aendere(alle, 'p', { start: um(14, 12, 0), ende: um(14, 12, 30) });
  assert.deepEqual(alle.map((b) => [b.id, b.start, b.ende]), [
    ['a1', um(14, 8, 30), um(14, 12, 0)],
    ['p', um(14, 12, 0), um(14, 12, 30)],
    ['a2', um(14, 12, 30), undefined],
  ]);
  assert.equal(pruefeListe(alle), null);
});

test('nicht angrenzende Nachbarn bleiben unverändert', () => {
  let alle = [
    { id: 'a', typ: 'arbeit', start: um(14, 8, 0), ende: um(14, 12, 0) },
    { id: 'p', typ: 'pause', start: um(14, 12, 15), ende: um(14, 12, 45) },
    { id: 'b', typ: 'arbeit', start: um(14, 13, 0), ende: um(14, 16, 0) },
  ];
  alle = aendere(alle, 'p', { start: um(14, 12, 5), ende: um(14, 12, 50) });
  assert.equal(alle[0].ende, um(14, 12, 0));
  assert.equal(alle[2].start, um(14, 13, 0));
});

test('reicht die neue Zeit über den Nachbarn hinaus, meldet pruefeListe einen Fehler', () => {
  let alle = [
    { id: 'a', typ: 'arbeit', start: um(14, 8, 0), ende: um(14, 12, 0) },
    { id: 'p', typ: 'pause', start: um(14, 12, 0), ende: um(14, 12, 30) },
  ];
  alle = aendere(alle, 'p', { start: um(14, 7, 0) });
  assert.match(pruefeListe(alle), /hinaus/);
});

test('pruefeListe verhindert überlappende Einträge auch bei verschachtelten Zeiten', () => {
  const alle = [
    { id: 'a', typ: 'arbeit', start: um(14, 8, 0), ende: um(14, 12, 0) },
    { id: 'b', typ: 'pause', start: um(14, 9, 0), ende: um(14, 10, 0) },
    { id: 'c', typ: 'arbeit', start: um(14, 11, 0), ende: um(14, 13, 0) },
  ];
  assert.match(pruefeListe(alle), /nicht überschneiden/);
});

test('pruefeListe erlaubt aneinandergrenzende Einträge und lehnt Einträge nach offenen ab', () => {
  const angrenzend = [
    { id: 'a', typ: 'arbeit', start: um(14, 8, 0), ende: um(14, 12, 0) },
    { id: 'b', typ: 'pause', start: um(14, 12, 0), ende: um(14, 12, 30) },
    { id: 'c', typ: 'arbeit', start: um(14, 12, 30) },
  ];
  assert.equal(pruefeListe(angrenzend), null);

  const mitOffenemBlock = [
    { id: 'a', typ: 'arbeit', start: um(14, 8, 0) },
    { id: 'b', typ: 'pause', start: um(14, 9, 0), ende: um(14, 9, 30) },
  ];
  assert.match(pruefeListe(mitOffenemBlock), /nicht überschneiden/);
});

test('alte Überschneidungen an anderen Tagen blockieren das Bearbeiten nicht', () => {
  const alle = [
    // vorgestern: Ende verlängert, Pause nicht mitgewandert
    { id: 'x1', typ: 'arbeit', start: um(12, 8, 0), ende: um(12, 12, 0) },
    { id: 'x2', typ: 'pause', start: um(12, 11, 30), ende: um(12, 12, 30) },
    { id: 'h1', typ: 'arbeit', start: um(14, 8, 0), ende: um(14, 12, 0) },
    { id: 'h2', typ: 'pause', start: um(14, 12, 0) },
  ];
  const neu = aendere(alle, 'h1', { start: um(14, 7, 45) });
  assert.equal(pruefeListe(neu, um(14, 7, 45)), null);
  assert.match(pruefeListe(neu, um(12, 8, 0)), /nicht überschneiden/);
});
