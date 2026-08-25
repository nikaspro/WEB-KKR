#!/usr/bin/env node

// Быстрая zero-dependency проверка legacy-прототипа, который не входит
// в основной Vite build: синтаксис inline-JS, дубли id и локальные ассеты.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { Script } from 'node:vm';

const root = resolve('.');
const entries = [
  'legacy/rd-hero-v4.html',
  'legacy/assets/embedded/plan-app.html'
];
const errors = [];
let checkedScripts = 0;
let checkedAssets = 0;

function isLocal(ref) {
  return ref && !/[${}]/.test(ref) && !/^(?:[a-z]+:|\/\/|#)/i.test(ref) && !ref.startsWith('data:');
}

function localPath(file, ref) {
  const clean = ref.split(/[?#]/, 1)[0];
  return ref.startsWith('/')
    ? join(root, clean.slice(1))
    : resolve(dirname(join(root, file)), clean);
}

function checkFile(file) {
  const full = join(root, file);
  if (!existsSync(full)) {
    errors.push(`${file}: файл не найден`);
    return;
  }

  const html = readFileSync(full, 'utf8');
  if (!/^\s*<!doctype html>/i.test(html) || !/<\/html>\s*$/i.test(html)) {
    errors.push(`${file}: документ должен содержать doctype и закрывающий </html>`);
  }

  const ids = new Map();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) {
    ids.set(match[1], (ids.get(match[1]) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) errors.push(`${file}: id="${id}" встречается ${count} раза`);
  }

  let scriptIndex = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    scriptIndex += 1;
    const attrs = match[1];
    const body = match[2];
    const src = (attrs.match(/\bsrc=["']([^"']+)["']/i) || [])[1];
    const type = (attrs.match(/\btype=["']([^"']+)["']/i) || [])[1] || '';
    if (src) {
      if (isLocal(src) && !existsSync(localPath(file, src))) {
        errors.push(`${file}: script src не найден: ${src}`);
      }
      continue;
    }
    if (type && !/(?:java|ecma)script|module/i.test(type)) continue;
    try {
      new Script(body, { filename: `${file}:inline-${scriptIndex}` });
      checkedScripts += 1;
    } catch (error) {
      errors.push(`${file}: синтаксис inline-script ${scriptIndex}: ${error.message}`);
    }
  }

  const refs = new Set();
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) refs.add(match[1]);
  for (const match of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) refs.add(match[1]);
  for (const match of html.matchAll(/["'](assets\/[^"']+\.(?:avif|gif|html|jpeg|jpg|mp4|png|svg|webm|webp|woff2?))["']/gi)) {
    refs.add(match[1]);
  }

  for (const ref of refs) {
    if (!isLocal(ref)) continue;
    checkedAssets += 1;
    if (!existsSync(localPath(file, ref))) errors.push(`${file}: ассет не найден: ${ref}`);
  }
}

for (const entry of entries) checkFile(normalize(entry));

if (errors.length) {
  console.error('\nLegacy check: ошибки');
  for (const error of errors) console.error(`  · ${error}`);
  console.error('');
  process.exit(1);
}

console.log(`Legacy check: OK · scripts ${checkedScripts} · local assets ${checkedAssets}`);
