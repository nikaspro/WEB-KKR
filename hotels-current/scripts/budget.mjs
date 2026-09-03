#!/usr/bin/env node
// Гейт бюджета. Ноль зависимостей: только встроенные fs, path, zlib.
// Считает transferred (brotli q11), как видит устройство, и raw справочно.
// Падает с кодом 1 при превышении лимита, при постороннем origin в отдаче
// или при нарушении правил шрифтов.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, sep } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

const cfg = JSON.parse(readFileSync('budget.json', 'utf8'));
const root = cfg.root;

if (!existsSync(root)) {
  console.error(`\nБюджет: каталога ${root}/ нет. Сначала npm run build.\n`);
  process.exit(1);
}

// ---- обход файлов ----
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(relative(root, p).split(sep).join('/'));
  }
  return acc;
}

// ---- матчер глобов: поддерживает * и ** ----
function match(file, pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*\*/g, '\u0001')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?')
    .replace(/\u0001/g, '.*');
  const rx = new RegExp(`^${escaped}$`);
  return rx.test(file);
}

// ---- размеры ----
const BROTLI = { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } };
// Медиа и woff2 уже сжаты: brotli q11 по ним это минуты работы и ноль выигрыша.
const PRECOMPRESSED = new Set(['.webp', '.avif', '.png', '.jpg', '.jpeg', '.gif',
                               '.mp4', '.webm', '.woff2', '.woff', '.gz', '.br']);
const sizes = new Map();
function size(file) {
  if (sizes.has(file)) return sizes.get(file);
  const buf = readFileSync(join(root, file));
  const v = PRECOMPRESSED.has(extname(file).toLowerCase())
    ? { raw: buf.length, transferred: buf.length }
    : { raw: buf.length, transferred: brotliCompressSync(buf, BROTLI).length };
  sizes.set(file, v);
  return v;
}

const kb = n => (n / 1024).toFixed(1) + ' КБ';
const files = walk(root);
const fails = [];
const report = [];

// ---- корзины ----
for (const [name, bucket] of Object.entries(cfg.buckets)) {
  const excludes = bucket.exclude || [];
  const list = files.filter(
    f => bucket.include.some(p => match(f, p)) && !excludes.some(p => match(f, p)),
  );
  const sum = list.reduce((a, f) => {
    const s = size(f);
    return { raw: a.raw + s.raw, transferred: a.transferred + s.transferred };
  }, { raw: 0, transferred: 0 });

  const lim = cfg.limits[name] || {};
  const line = { name, files: list.length, ...sum, lim };
  report.push(line);

  for (const key of ['transferred', 'raw']) {
    if (lim[key] != null && sum[key] > lim[key]) {
      fails.push(`${name}.${key}: ${kb(sum[key])} > лимит ${kb(lim[key])}`);
    }
  }
  if (lim.maxFiles != null && list.length > lim.maxFiles) {
    fails.push(`${name}: файлов ${list.length} > лимит ${lim.maxFiles}`);
  }
  if (lim.allowExt) {
    for (const f of list) {
      if (!lim.allowExt.includes(extname(f))) fails.push(`${name}: запрещённый формат ${f}`);
    }
  }
}

// ---- проверки разметки: инлайн-CSS, ленивость картинок, размеры под CLS ----
const chk = cfg.checks || {};
const textExt0 = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.webmanifest']);
const htmlFiles = files.filter(f => extname(f) === '.html');
for (const f of htmlFiles) {
  const txt = readFileSync(join(root, f), 'utf8');

  if (chk.inlineCssMax != null) {
    let inline = 0;
    for (const m of txt.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) inline += Buffer.byteLength(m[1]);
    if (inline > chk.inlineCssMax) {
      fails.push(`${f}: инлайн-CSS ${kb(inline)} > лимит ${kb(chk.inlineCssMax)}`);
    }
  }

  // <img> и <video> вне белого списка: lazy обязателен, размеры обязательны
  const eager = new Set(chk.eagerAllow || []);
  for (const m of txt.matchAll(/<(img|video)\b[^>]*>/gi)) {
    const tag = m[0], kind = m[1].toLowerCase();
    const src = (tag.match(/\bsrc=["']?([^"'\s>]+)/i) || [])[1] || '(без src)';
    // Вложенный HTML получает от Vite ../assets/* вместо ./assets/*.
    // Сводим оба варианта к форме из eagerAllow, не расширяя сам белый список.
    const eagerSrc = src.replace(/^(?:\.\.\/)+/, './');
    const whitelisted = eager.has(src) || eager.has(eagerSrc);

    if (chk.requireLazyImages && kind === 'img' && !whitelisted && !/\bloading=["']?lazy/i.test(tag)) {
      fails.push(`${f}: ${src} без loading="lazy" и не в eagerAllow`);
    }
    if (chk.requireLazyImages && kind === 'video' && !/\bpreload=["']?none/i.test(tag)) {
      fails.push(`${f}: видео ${src} без preload="none"`);
    }
    if (chk.requireDimensions && !(/\bwidth=/i.test(tag) && /\bheight=/i.test(tag))) {
      fails.push(`${f}: ${src} без width/height (риск CLS)`);
    }
  }
}

// ---- data: URI длиннее лимита ----
if (chk.dataUriMax != null) {
  for (const f of files.filter(f => textExt0.has(extname(f)))) {
    const txt = readFileSync(join(root, f), 'utf8');
    for (const m of txt.matchAll(/data:[^"')\s]+/gi)) {
      if (m[0].length > chk.dataUriMax) {
        fails.push(`${f}: data: URI ${kb(m[0].length)} > лимит ${kb(chk.dataUriMax)} — ассет должен быть файлом`);
        break;                       // одного сообщения на файл достаточно
      }
    }
  }
}

// ---- статический will-change в CSS ----
if (chk.forbidStaticWillChange) {
  for (const f of files.filter(f => extname(f) === '.css')) {
    const txt = readFileSync(join(root, f), 'utf8');
    if (/will-change\s*:/i.test(txt)) {
      fails.push(`${f}: статический will-change в CSS — включается по фазе из скрипта`);
    }
  }
}

// ---- сторонние origin в отдаче ----
const allow = new Set([...(cfg.thirdParty.allow || []), ...(cfg.thirdParty.selfOrigin || [])]);
// Неймспейсы и словари это не загрузка ресурса.
const NAMESPACE_HOSTS = new Set(['www.w3.org', 'w3.org', 'schema.org', 'www.schema.org']);
const TEXT_ONLY_HOSTS = new Set(['gsap.com']);
const textExt = textExt0;
const seen = new Map();
for (const f of files.filter(f => textExt.has(extname(f)))) {
  const txt = readFileSync(join(root, f), 'utf8');
  // URL в лицензионном block comment npm-бандла не создаёт сетевой запрос.
  const blockComments = [...txt.matchAll(/\/\*[\s\S]*?\*\//g)]
    .map(m => [m.index, m.index + m[0].length]);
  for (const m of txt.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    if (blockComments.some(([from, to]) => m.index >= from && m.index < to)) continue;
    const host = m[1].toLowerCase();
    if (allow.has(host)) continue;
    // XML-неймспейсы не являются загрузкой: не считаем их сторонним origin
    const before = txt.slice(Math.max(0, m.index - 40), m.index);
    if (NAMESPACE_HOSTS.has(host) || TEXT_ONLY_HOSTS.has(host) || /xmlns|xlink|@context/i.test(before)) continue;
    if (!seen.has(host)) seen.set(host, new Set());
    seen.get(host).add(f);
  }
}
for (const [host, where] of seen) {
  fails.push(`сторонний origin ${host} в ${[...where].join(', ')}`);
}

// ---- вывод ----
console.log(`\nБюджет · ${root}\n`);
console.log('корзина      файлов   transferred        raw          лимит');
for (const r of report) {
  const l = r.lim.transferred != null ? kb(r.lim.transferred) : '—';
  console.log(
    r.name.padEnd(12) +
    String(r.files).padStart(5) + '   ' +
    kb(r.transferred).padStart(11) + '   ' +
    kb(r.raw).padStart(11) + '   ' +
    l.padStart(11)
  );
}

if (fails.length) {
  console.log('\nПРЕВЫШЕНИЕ:');
  for (const f of fails) console.log('  · ' + f);
  console.log('');
  process.exit(1);
}
console.log('\nв бюджете\n');
