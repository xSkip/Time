import { berechne } from './rechner.js';
import {
  wechsle, laufender, bloeckeVonTag, schliesseAlte, aendere, loesche, fuegeHinzu, pruefe, pruefeListe, tagesbeginn,
} from './bloecke.js';
import { erstelleSpeicher } from './speicher.js';
import { dauer, uhrzeit, zeitAmTag, NAMEN } from './format.js';
import { exportiere, dateiname, liesSicherung, zusammenfuehren } from './sicherung.js';

const speicher = erstelleSpeicher();
let alle = speicher.lade();

const $ = (id) => document.getElementById(id);

function speichere(neu) {
  alle = neu;
  speicher.speichere(alle);
  zeichne();
}

function knopf(text, klasse, typ) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.className = klasse;
  b.addEventListener('click', () => speichere(wechsle(alle, typ, Date.now())));
  return b;
}

function zeichneKnoepfe(aktiv, schonGearbeitet) {
  const box = $('knoepfe');
  box.replaceChildren();
  if (aktiv?.typ === 'arbeit') {
    box.append(
      knopf('Pause', 'pause', 'pause'),
      knopf('Unterwegs', 'unterwegs', 'unterwegs'),
      knopf('Feierabend', 'feierabend', null),
    );
  } else {
    box.append(knopf(aktiv || schonGearbeitet ? 'Weiterarbeiten' : 'Arbeit starten', 'haupt', 'arbeit'));
    if (aktiv?.typ === 'pause') box.append(knopf('Unterwegs', 'unterwegs', 'unterwegs'));
    if (aktiv?.typ === 'unterwegs') box.append(knopf('Pause', 'pause', 'pause'));
    if (aktiv) box.append(knopf('Feierabend', 'feierabend', null));
  }
  // Pause/Unterwegs allein in einer Zeile über die volle Breite
  const einzeln = box.querySelectorAll('.pause, .unterwegs');
  if (einzeln.length === 1) einzeln[0].style.gridColumn = '1 / -1';
}

function zeichneAnzeige(r, aktiv) {
  const status = $('status');
  status.className = `status ${aktiv?.typ ?? ''}`;
  status.textContent = aktiv
    ? `${NAMEN[aktiv.typ]} seit ${uhrzeit(aktiv.start)}`
    : r.brutto === 0 ? 'Noch nicht gestartet' : r.offen > 0 ? 'Gerade nicht aktiv' : 'Feierabend';

  const gross = $('gross');
  if (r.offen > 0) {
    gross.textContent = dauer(r.offen, true);
    gross.classList.remove('plus');
    $('beschriftung').textContent = 'noch offen';
  } else {
    gross.textContent = `+${dauer(r.plus)}`;
    gross.classList.add('plus');
    $('beschriftung').textContent = 'Soll erreicht';
  }

  const ende = $('ende');
  if (r.ende) {
    const fertig = Math.ceil(r.ende / 60000) * 60000;
    const text = aktiv?.typ === 'arbeit'
      ? 'Fertig um'
      : r.brutto > 0 ? 'Wenn du jetzt weiterarbeitest: fertig um' : 'Wenn du jetzt startest: fertig um';
    ende.innerHTML = '';
    ende.append(`${text} `);
    const b = document.createElement('strong');
    b.textContent = uhrzeit(fertig);
    ende.append(b);
    if (r.pauseFaellig > 0) {
      const s = document.createElement('small');
      s.textContent = `inkl. ${Math.ceil(r.pauseFaellig / 60000)} min gesetzlicher Pause`;
      ende.append(s);
    }
  } else {
    ende.textContent = '';
  }

  $('summe-arbeit').textContent = dauer(r.netto);
  $('summe-pause').textContent = dauer(r.pausen);
  $('summe-unterwegs').textContent = dauer(r.unterwegs);
}

function zeichneListe(heute, jetzt) {
  const liste = $('liste');
  liste.replaceChildren();
  for (const b of heute) {
    const li = document.createElement('li');
    const zeile = document.createElement('button');
    zeile.type = 'button';
    zeile.className = 'eintrag';
    zeile.dataset.id = b.id;

    const punkt = document.createElement('span');
    punkt.className = `punkt ${b.typ}`;
    const art = document.createElement('span');
    art.className = 'art';
    art.textContent = NAMEN[b.typ];
    const zeit = document.createElement('span');
    zeit.className = 'zeit';
    zeit.textContent = `${uhrzeit(b.start)}–${b.ende ? uhrzeit(b.ende) : 'jetzt'}`;
    const d = document.createElement('span');
    d.className = 'dauer';
    d.textContent = dauer((b.ende ?? jetzt) - b.start);

    zeile.append(punkt, art, zeit, d);
    li.append(zeile);
    liste.append(li);
  }
  $('leer').hidden = heute.length > 0;
}

function zeichne() {
  const warnung = $('speicher-warnung');
  warnung.hidden = speicher.istDauerhaft();
  warnung.textContent = warnung.hidden
    ? ''
    : 'Speichern auf diesem Gerät ist nicht verfügbar. Deine Änderungen gehen verloren, wenn du die App schließt. Bitte exportiere jetzt eine Sicherung.';

  const jetzt = Date.now();
  const geschlossen = schliesseAlte(alle, jetzt);
  if (geschlossen !== alle) {
    alle = geschlossen;
    speicher.speichere(alle);
  }
  const heute = bloeckeVonTag(alle, jetzt);
  const aktiv = laufender(heute);
  const r = berechne(heute, jetzt);
  zeichneAnzeige(r, aktiv);
  zeichneKnoepfe(aktiv, r.brutto > 0);
  zeichneListe(heute, jetzt);
}

// Bearbeiten

const dialog = $('dialog');
const formular = $('formular');
let bearbeitet = null; // Block, der gerade bearbeitet wird; null = neuer Eintrag

function oeffne(block) {
  bearbeitet = block;
  const jetzt = Date.now();
  const heute = bloeckeVonTag(alle, jetzt);
  const letzterEnde = heute.at(-1)?.ende;
  const vorlage = block ?? {
    typ: 'arbeit',
    start: letzterEnde ?? jetzt - 60 * 60000,
    ende: jetzt,
  };
  $('dialog-titel').textContent = block ? 'Eintrag bearbeiten' : 'Eintrag nachtragen';
  formular.typ.value = vorlage.typ;
  formular.start.value = uhrzeit(vorlage.start);
  formular.ende.value = vorlage.ende ? uhrzeit(vorlage.ende) : '';
  $('loeschen').hidden = !block;
  $('fehler').textContent = '';
  dialog.showModal();
}

function speichereFormular() {
  const jetzt = Date.now();
  const tag = bearbeitet ? tagesbeginn(bearbeitet.start) : tagesbeginn(jetzt);
  const block = {
    typ: formular.typ.value,
    start: zeitAmTag(tag, formular.start.value),
    ende: formular.ende.value ? zeitAmTag(tag, formular.ende.value) : undefined,
  };

  let fehler = pruefe(block, jetzt);
  if (!fehler && block.ende == null) {
    const aktiv = laufender(alle);
    if (aktiv && aktiv.id !== bearbeitet?.id) fehler = 'Es läuft bereits ein anderer Eintrag. Bitte ein Ende angeben.';
  }
  const neu = fehler ? null : bearbeitet ? aendere(alle, bearbeitet.id, block) : fuegeHinzu(alle, block);
  if (!fehler) fehler = pruefeListe(neu, block.start);
  if (fehler) {
    $('fehler').textContent = fehler;
    return;
  }

  speichere(neu);
  dialog.close();
}

$('liste').addEventListener('click', (e) => {
  const zeile = e.target.closest('.eintrag');
  if (zeile) oeffne(alle.find((b) => b.id === zeile.dataset.id));
});
$('hinzufuegen').addEventListener('click', () => oeffne(null));
$('abbrechen').addEventListener('click', () => dialog.close());
$('loeschen').addEventListener('click', () => {
  if (bearbeitet && confirm('Diesen Eintrag löschen?')) {
    speichere(loesche(alle, bearbeitet.id));
    dialog.close();
  }
});
formular.addEventListener('submit', (e) => {
  e.preventDefault();
  speichereFormular();
});

// Sicherung

$('exportieren').addEventListener('click', async () => {
  const jetzt = Date.now();
  const datei = new File([exportiere(alle, jetzt)], dateiname(jetzt), { type: 'application/json' });
  // iPhone: Teilen-Menü, dort "In Dateien sichern". Sonst normaler Download.
  if (navigator.canShare?.({ files: [datei] })) {
    try {
      await navigator.share({ files: [datei] });
    } catch {
      // abgebrochen
    }
    return;
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(datei);
  link.download = datei.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

$('importieren').addEventListener('click', () => $('datei').click());
$('datei').addEventListener('change', async (e) => {
  const datei = e.target.files[0];
  e.target.value = '';
  if (!datei) return;
  try {
    const importiert = liesSicherung(await datei.text());
    if (confirm(`${importiert.length} Einträge importieren? Vorhandene Einträge bleiben erhalten.`)) {
      speichere(zusammenfuehren(alle, importiert));
    }
  } catch (fehler) {
    alert(fehler.message);
  }
});

zeichne();
setInterval(zeichne, 15000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) zeichne();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
