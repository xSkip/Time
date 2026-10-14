import { berechne } from './rechner.js';
import { wechsle, laufender, bloeckeVonTag, schliesseAlte } from './bloecke.js';
import { erstelleSpeicher } from './speicher.js';
import { dauer, uhrzeit, NAMEN } from './format.js';

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

function zeichneKnoepfe(aktiv) {
  const box = $('knoepfe');
  box.replaceChildren();
  if (aktiv?.typ === 'arbeit') {
    box.append(
      knopf('Pause', 'pause', 'pause'),
      knopf('Unterwegs', 'unterwegs', 'unterwegs'),
      knopf('Feierabend', 'feierabend', null),
    );
  } else {
    box.append(knopf(aktiv ? 'Weiterarbeiten' : 'Arbeit starten', 'haupt', 'arbeit'));
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
    : (r.brutto > 0 ? 'Feierabend' : 'Noch nicht gestartet');

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
  zeichneKnoepfe(aktiv);
  zeichneListe(heute, jetzt);
}

zeichne();
setInterval(zeichne, 15000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) zeichne();
});
