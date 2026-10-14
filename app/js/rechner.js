// Reine Berechnungslogik: keine Abhängigkeit zu Bildschirm oder Speicher.
// Alle Zeiten in Millisekunden.

export const MINUTE = 60 * 1000;
export const STUNDE = 60 * MINUTE;

export const SOLL = 7 * STUNDE + 42 * MINUTE;
export const PAUSENGRENZE = 6 * STUNDE;
export const MINDESTPAUSE = 30 * MINUTE;

function dauer(block, jetzt) {
  const ende = block.ende ?? jetzt;
  return Math.max(0, ende - block.start);
}

function summe(bloecke, typ, jetzt) {
  return bloecke
    .filter((b) => b.typ === typ)
    .reduce((s, b) => s + dauer(b, jetzt), 0);
}

// Gesetzliche Pause: Arbeitszeit über 6 h zählt erst, sobald insgesamt
// 30 min Pause gemacht wurden. Fehlende Pause wird bis zu ihrer vollen
// Länge abgezogen, aber nie mehr als die Zeit über 6 h. So springt die
// Nettozeit bei 6 h nicht plötzlich nach unten.
export function pausenabzug(brutto, pausen) {
  const fehlend = Math.max(0, MINDESTPAUSE - pausen);
  const ueberGrenze = Math.max(0, brutto - PAUSENGRENZE);
  return Math.min(ueberGrenze, fehlend);
}

// bloecke: Einträge eines Tages { typ: 'arbeit' | 'pause' | 'unterwegs', start, ende? }
// Ein Block ohne ende läuft noch und zählt bis jetzt.
export function berechne(bloecke, jetzt, soll = SOLL) {
  const brutto = summe(bloecke, 'arbeit', jetzt);
  const pausen = summe(bloecke, 'pause', jetzt);
  const unterwegs = summe(bloecke, 'unterwegs', jetzt);
  const abzug = pausenabzug(brutto, pausen);
  const netto = brutto - abzug;
  const offen = soll - netto;

  // Noch fehlende Pause, die bis zum Erreichen des Solls fällig wird.
  const fehlendePause = Math.max(0, MINDESTPAUSE - pausen);
  const pauseFaellig = soll > PAUSENGRENZE ? fehlendePause : 0;

  // Wann ist das Soll erreicht, wenn ab jetzt ohne weitere Pause gearbeitet wird?
  // Dafür nötige Bruttozeit: soll + fällige Pause.
  const restBrutto = Math.max(0, soll + pauseFaellig - brutto);
  const ende = offen > 0 ? jetzt + restBrutto : null;

  return {
    brutto,
    netto,
    pausen,
    unterwegs,
    abzug,
    offen: Math.max(0, offen),
    plus: Math.max(0, -offen),
    pauseFaellig: offen > 0 ? Math.max(0, pauseFaellig - abzug) : 0,
    ende,
  };
}
