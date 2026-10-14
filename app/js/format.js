import { MINUTE } from './rechner.js';

// Dauer als "h:mm". aufrunden = true, damit z. B. "noch offen" nicht
// 0:00 zeigt, solange noch Sekunden fehlen.
export function dauer(ms, aufrunden = false) {
  const minuten = aufrunden ? Math.ceil(ms / MINUTE) : Math.floor(ms / MINUTE);
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function uhrzeit(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Kombiniert den Tag von tagMs mit einer Uhrzeit "HH:MM".
export function zeitAmTag(tagMs, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(tagMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime();
}

export const NAMEN = { arbeit: 'Arbeit', pause: 'Pause', unterwegs: 'Unterwegs' };
