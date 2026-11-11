// Verschlüsselt eine Inhaltsdatei mit einem Klassencode (AES-256-GCM, Schlüssel per PBKDF2).
// Aufruf: node tools/encrypt.mjs <quelle.mjs> <CODE> <ziel.enc.json>
// Die Klartext-Inhalte und die Codes gehören NICHT in dieses Repository.
import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [src, code, out] = process.argv.slice(2);
if (!src || !code || !out) { console.error('Aufruf: node tools/encrypt.mjs <quelle.mjs> <CODE> <ziel.enc.json>'); process.exit(1); }
const ITER = 600000;
const norm = c => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '');
const data = (await import(pathToFileURL(resolve(src)).href)).default;
const te = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', te.encode(norm(code)), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(data))));
const b64 = u => Buffer.from(u).toString('base64');
writeFileSync(out, JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
console.log('ok', out, ct.length, 'Bytes');
