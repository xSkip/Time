// Operationen auf der Liste aller Blöcke. Rein funktional: jede Funktion
// liefert eine neue Liste und verändert die übergebene nicht.

export const TYPEN = ['arbeit', 'pause', 'unterwegs'];

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

export function aendere(alle, id, felder) {
  return sortiert(alle.map((b) => (b.id === id ? { ...b, ...felder } : b)));
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
