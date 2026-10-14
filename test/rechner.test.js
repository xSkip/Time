import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechne, pausenabzug, MINUTE, STUNDE } from '../app/js/rechner.js';

const um = (h, m) => new Date(2026, 9, 14, h, m).getTime();
const block = (typ, von, bis) => ({ typ, start: um(...von), ende: bis ? um(...bis) : undefined });
const min = (ms) => ms / MINUTE;
const uhr = (ms) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

test('Beispiel aus den Anforderungen: Büro, Mittag, Fitness, Heimfahrt, Home Office', () => {
  const tag = [
    block('arbeit', [8, 0], [12, 0]),
    block('pause', [12, 0], [12, 20]),
    block('arbeit', [12, 20], [14, 30]),
    block('pause', [14, 30], [16, 15]),
    block('unterwegs', [16, 15], [16, 45]),
  ];
  const r = berechne(tag, um(16, 45));
  assert.equal(min(r.netto), 6 * 60 + 10);
  assert.equal(min(r.pausen), 125);
  assert.equal(min(r.unterwegs), 30);
  assert.equal(min(r.abzug), 0);
  assert.equal(min(r.offen), 92);
  assert.equal(uhr(r.ende), '18:17');
});

test('leerer Tag: das volle Soll ist offen, Ende inkl. Mindestpause', () => {
  const r = berechne([], um(8, 0));
  assert.equal(min(r.offen), 7 * 60 + 42);
  assert.equal(min(r.pauseFaellig), 30);
  assert.equal(uhr(r.ende), '16:12');
});

test('laufender Arbeitsblock zählt bis jetzt', () => {
  const r = berechne([block('arbeit', [8, 0])], um(10, 30));
  assert.equal(min(r.brutto), 150);
  assert.equal(min(r.netto), 150);
});

test('genau 6 h ohne Pause: noch kein Abzug', () => {
  const r = berechne([block('arbeit', [8, 0], [14, 0])], um(14, 0));
  assert.equal(min(r.abzug), 0);
  assert.equal(min(r.netto), 360);
});

test('über 6 h ohne Pause: Zeit über 6 h zählt bis zu 30 min nicht', () => {
  const r1 = berechne([block('arbeit', [8, 0])], um(14, 10));
  assert.equal(min(r1.abzug), 10);
  assert.equal(min(r1.netto), 360);

  const r2 = berechne([block('arbeit', [8, 0])], um(15, 0));
  assert.equal(min(r2.abzug), 30);
  assert.equal(min(r2.netto), 6 * 60 + 30);
});

test('nur 15 min Pause: 15 min werden zusätzlich abgezogen', () => {
  const tag = [
    block('arbeit', [8, 0], [12, 0]),
    block('pause', [12, 0], [12, 15]),
    block('arbeit', [12, 15], [16, 15]),
  ];
  const r = berechne(tag, um(16, 15));
  assert.equal(min(r.brutto), 480);
  assert.equal(min(r.abzug), 15);
  assert.equal(min(r.netto), 465);
  assert.equal(min(r.plus), 3);
  assert.equal(r.ende, null);
});

test('Wegzeit zählt nicht als Pause', () => {
  const tag = [
    block('arbeit', [8, 0], [12, 0]),
    block('unterwegs', [12, 0], [12, 45]),
    block('arbeit', [12, 45], [16, 0]),
  ];
  const r = berechne(tag, um(16, 0));
  assert.equal(min(r.pausen), 0);
  assert.equal(min(r.abzug), 30);
  assert.equal(min(r.netto), 7 * 60 + 15 - 30);
});

test('mehr als 30 min Pause: kein zusätzlicher Abzug', () => {
  const tag = [
    block('arbeit', [8, 0], [12, 0]),
    block('pause', [12, 0], [13, 0]),
    block('arbeit', [13, 0]),
  ];
  const r = berechne(tag, um(16, 0));
  assert.equal(min(r.abzug), 0);
  assert.equal(min(r.netto), 7 * 60);
  assert.equal(min(r.pauseFaellig), 0);
  assert.equal(uhr(r.ende), '16:42');
});

test('Ende rechnet eine noch fällige Pausendifferenz ein', () => {
  const tag = [
    block('arbeit', [8, 0], [12, 0]),
    block('pause', [12, 0], [12, 10]),
    block('arbeit', [12, 10]),
  ];
  const r = berechne(tag, um(13, 0));
  assert.equal(min(r.netto), 290);
  assert.equal(min(r.offen), 172);
  assert.equal(min(r.pauseFaellig), 20);
  // 13:00 + 172 min + 20 min fällige Pause
  assert.equal(uhr(r.ende), '16:12');
});

test('Ende bleibt gleich, egal ob die Pause noch gemacht wird oder abgezogen wird', () => {
  const ohnePause = berechne([block('arbeit', [8, 0])], um(10, 0));
  const tag = [block('arbeit', [8, 0], [10, 0]), block('pause', [10, 0], [10, 30]), block('arbeit', [10, 30])];
  const mitPause = berechne(tag, um(10, 30));
  assert.equal(uhr(ohnePause.ende), uhr(mitPause.ende));
});

test('Soll genau erreicht: weder offen noch Plus', () => {
  const tag = [
    block('arbeit', [8, 0], [12, 0]),
    block('pause', [12, 0], [12, 30]),
    block('arbeit', [12, 30], [16, 12]),
  ];
  const r = berechne(tag, um(16, 12));
  assert.equal(r.offen, 0);
  assert.equal(r.plus, 0);
  assert.equal(r.ende, null);
});

test('pausenabzug ist nie größer als die Zeit über 6 h', () => {
  assert.equal(pausenabzug(6 * STUNDE + 5 * MINUTE, 0), 5 * MINUTE);
  assert.equal(pausenabzug(5 * STUNDE, 0), 0);
  assert.equal(pausenabzug(8 * STUNDE, 20 * MINUTE), 10 * MINUTE);
});
