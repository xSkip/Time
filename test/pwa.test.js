import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const app = path.join(import.meta.dirname, '..', 'app');
const sw = fs.readFileSync(path.join(app, 'sw.js'), 'utf8');
const dateien = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);

test('alle Dateien im Offline-Cache existieren', () => {
  for (const d of dateien) assert.ok(fs.existsSync(path.join(app, d)), `fehlt: ${d}`);
});

test('alle JavaScript-Module sind im Offline-Cache', () => {
  for (const d of fs.readdirSync(path.join(app, 'js'))) {
    assert.ok(dateien.includes(`js/${d}`), `nicht im Cache von sw.js: js/${d}`);
  }
});

test('Manifest ist gültig und seine Icons existieren', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(app, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(app, icon.src)), `fehlt: ${icon.src}`);
});
