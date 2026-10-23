// Operationen auf der Liste aller Blöcke. Rein funktional: jede Funktion
// liefert eine neue Liste und verändert die übergebene nicht.

export const TYPEN = ['arbeit', 'pause', 'unterwegs'];

export function istGueltigerBlock(block) {
  return !!block
    && typeof block === 'object'
    && typeof block.id === 'string'
    && block.id.length > 0
    && TYPEN.includes(block.typ)
    && Number.isSafeInteger(block.start)
    && Math.abs(block.start) <= 8.64e15
    && (block.ende == null || (
      Number.isSafeInteger(block.ende)
      && Math.abs(block.ende) <= 8.64e15
      && block.ende >= block.start
    ));
}

export function bereinigeBloecke(bloecke) {
  return Array.isArray(bloecke) ? bloecke.filter(istGueltigerBlock) : [];
}

export function tagesbeginn(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function naechsterTag(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

function sortiert(bloecke) {
  return [...bloecke].sort((a, b) => a.start - b.start);
}

export function bloeckeVonTag(alle, jetzt) {
  const von = tagesbeginn(jetzt);
  const bis = naechsterTag(jetzt);
  return sortiert(alle.filter((b) => b.start >= von && b.start < bis));
}

export function laufender(alle) {
  return alle.find((b) => b.ende == null) ?? null;
}

// Beendet den laufenden Block und startet einen neuen vom Typ typ.
// typ = null beendet nur (Feierabend).
export function wechsle(alle, typ, jetzt, neueId = () => crypto.randomUUID()) {
  const aktiv = laufender(alle);
  if (aktiv && aktiv.typ === typ) return alle;
  const neu = alle.map((b) => (b === aktiv ? { ...b, ende: Math.max(b.start, jetzt) } : b));
  if (typ) neu.push({ id: neueId(), typ, start: jetzt });
  return sortiert(neu);
}

// Ein Block, der vor heute begonnen hat und noch läuft (z. B. Feierabend
// vergessen), wird um Mitternacht seines Tages beendet.
export function schliesseAlte(alle, jetzt) {
  const heute = tagesbeginn(jetzt);
  let geaendert = false;
  const neu = alle.map((b) => {
    if (b.ende == null && b.start < heute) {
      geaendert = true;
      return { ...b, ende: naechsterTag(b.start) };
    }
    return b;
  });
  return geaendert ? neu : alle;
}

export function fuegeHinzu(alle, block, neueId = () => crypto.randomUUID()) {
  return sortiert([...alle, { ...block, id: neueId() }]);
}

// Ändert einen Block. Grenzt der Block davor oder danach direkt an, wandert
// dessen Ende bzw. Beginn mit, damit keine Lücke entsteht.
export function aendere(alle, id, felder) {
  const liste = sortiert(alle);
  const i = liste.findIndex((b) => b.id === id);
  if (i < 0) return liste;
  const alt = liste[i];
  const neu = { ...alt, ...felder };
  const davor = liste[i - 1];
  const danach = liste[i + 1];
  return sortiert(liste.map((b) => {
    if (b === alt) return neu;
    if (b === davor && b.ende === alt.start && neu.start !== alt.start) return { ...b, ende: neu.start };
    if (b === danach && alt.ende != null && b.start === alt.ende && neu.ende != null && neu.ende !== alt.ende) {
      return { ...b, start: neu.ende };
    }
    return b;
  }));
}

// Prüft die ganze Liste nach einer Änderung, z. B. ob ein mitgezogener
// Nachbar dadurch ein Ende vor seinem Beginn bekommen hat.
export function pruefeListe(alle) {
  return alle.some((b) => b.ende != null && b.ende < b.start)
    ? 'Die neue Zeit reicht über den Eintrag davor oder danach hinaus.'
    : null;
}

export function loesche(alle, id) {
  return alle.filter((b) => b.id !== id);
}

// Prüft einen Block vor dem Speichern. Liefert eine Fehlermeldung oder null.
export function pruefe(block, jetzt) {
  if (!TYPEN.includes(block.typ)) return 'Unbekannte Art.';
  if (!Number.isFinite(block.start)) return 'Beginn fehlt.';
  if (block.ende != null && block.ende < block.start) return 'Ende liegt vor dem Beginn.';
  if (block.start > jetzt) return 'Beginn liegt in der Zukunft.';
  if (block.ende != null && block.ende > jetzt) return 'Ende liegt in der Zukunft.';
  return null;
}
