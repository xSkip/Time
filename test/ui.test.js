import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.TZ = 'UTC';

class Element {
  constructor(id = '') {
    this.id = id;
    this.children = [];
    this.listeners = new Map();
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.files = [];
    this.value = '';
    this._text = '';
    this._className = '';
  }

  set className(value) { this._className = value; }
  get className() { return this._className; }

  get classList() {
    return {
      add: (name) => {
        if (!this._className.split(/\s+/).includes(name)) this._className = `${this._className} ${name}`.trim();
      },
      remove: (name) => {
        this._className = this._className.split(/\s+/).filter((item) => item !== name).join(' ');
      },
    };
  }

  set textContent(value) {
    this._text = String(value);
    this.children = [];
  }

  get textContent() {
    return this._text + this.children.map((child) => typeof child === 'string' ? child : child.textContent).join('');
  }

  set innerHTML(value) {
    this._text = String(value);
    this.children = [];
  }

  append(...items) {
    this._text = '';
    this.children.push(...items);
  }

  replaceChildren(...items) {
    this._text = '';
    this.children = [...items];
  }

  querySelectorAll(selector) {
    const klassen = selector.split(',').map((item) => item.trim().replace('.', ''));
    return this.children.filter((child) => child instanceof Element
      && klassen.some((name) => child.className.split(/\s+/).includes(name)));
  }

  addEventListener(name, callback) {
    const callbacks = this.listeners.get(name) ?? [];
    callbacks.push(callback);
    this.listeners.set(name, callbacks);
  }

  dispatch(name, details = {}) {
    const event = {
      ...details,
      target: details.target ?? this,
      preventDefault: details.preventDefault ?? (() => {}),
    };
    for (const callback of this.listeners.get(name) ?? []) callback(event);
  }

  click() { this.dispatch('click'); }
  closest(selector) { return selector === '.eintrag' && this.className.split(/\s+/).includes('eintrag') ? this : null; }
  showModal() { this.open = true; }
  close() { this.open = false; }
}

test('UI: Start, Pause und Weiterarbeiten aktualisieren Status und Zeitblöcke', async () => {
  const elemente = new Map();
  const formular = new Element('formular');
  formular.typ = { value: 'arbeit' };
  formular.start = { value: '' };
  formular.ende = { value: '' };
  for (const id of [
    'status', 'gross', 'beschriftung', 'ende', 'summe-arbeit', 'summe-pause', 'summe-unterwegs',
    'liste', 'leer', 'knoepfe', 'speicher-warnung', 'dialog', 'dialog-titel', 'loeschen', 'fehler',
    'hinzufuegen', 'abbrechen', 'exportieren', 'importieren', 'datei',
  ]) elemente.set(id, id === 'formular' ? formular : new Element(id));
  elemente.set('formular', formular);

  const dokument = {
    hidden: false,
    getElementById: (id) => elemente.get(id),
    createElement: () => new Element(),
    addEventListener() {},
  };
  const daten = new Map();
  let speicherNichtVerfuegbar = false;
  Object.defineProperty(globalThis, 'document', { configurable: true, value: dokument });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => daten.get(key) ?? null,
      setItem: (key, value) => {
        if (speicherNichtVerfuegbar) throw new Error('storage unavailable');
        daten.set(key, String(value));
      },
    },
  });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  const vorherigesIntervall = globalThis.setInterval;
  globalThis.setInterval = (callback) => {
    dokument.aktualisiere = callback;
    return 1;
  };
  const vorherigesJetzt = Date.now;
  let jetzt = Date.UTC(2026, 9, 24, 8);
  Date.now = () => jetzt;

  try {
    await import('../app/js/ui.js');
    assert.equal(elemente.get('status').textContent, 'Noch nicht gestartet');
    assert.equal(elemente.get('speicher-warnung').hidden, true);

    const knopfMitText = (text) => elemente.get('knoepfe').children.find((knopf) => knopf.textContent === text);
    knopfMitText('Arbeit starten').click();
    assert.equal(elemente.get('status').textContent, 'Arbeit seit 08:00');
    assert.equal(JSON.parse(daten.get('time.bloecke')).bloecke.length, 1);

    jetzt = Date.UTC(2026, 9, 24, 9, 30);
    dokument.aktualisiere();
    assert.equal(elemente.get('summe-arbeit').textContent, '1:30');
    knopfMitText('Pause').click();

    jetzt = Date.UTC(2026, 9, 24, 10);
    dokument.aktualisiere();
    knopfMitText('Weiterarbeiten').click();
    const bloecke = JSON.parse(daten.get('time.bloecke')).bloecke;
    assert.deepEqual(bloecke.map((block) => [block.typ, block.start, block.ende]), [
      ['arbeit', Date.UTC(2026, 9, 24, 8), Date.UTC(2026, 9, 24, 9, 30)],
      ['pause', Date.UTC(2026, 9, 24, 9, 30), Date.UTC(2026, 9, 24, 10)],
      ['arbeit', Date.UTC(2026, 9, 24, 10), undefined],
    ]);

    elemente.get('hinzufuegen').click();
    formular.typ.value = 'arbeit';
    formular.start.value = '09:00';
    formular.ende.value = '10:00';
    formular.dispatch('submit');
    assert.match(elemente.get('fehler').textContent, /nicht überschneiden/);
    assert.equal(JSON.parse(daten.get('time.bloecke')).bloecke.length, 3);

    speicherNichtVerfuegbar = true;
    jetzt = Date.UTC(2026, 9, 24, 11);
    knopfMitText('Feierabend').click();
    assert.equal(elemente.get('speicher-warnung').hidden, false);
    assert.match(elemente.get('speicher-warnung').textContent, /gehen verloren/);
  } finally {
    Date.now = vorherigesJetzt;
    globalThis.setInterval = vorherigesIntervall;
  }
});
