#!/usr/bin/env node
// Карта фаз: печатает окна и падает на пересечении.
// Пересечение допустимо только когда одна из фаз помечена
// overlap: true и объяснена полем why.
// Тайминги живут в src/scene/phases.js и только там.

import { phases } from '../src/scene/phases.js';

const fails = [];
const win = p => ({ ...p, from: p.at, to: p.at + p.len });

// ---- целостность записей ----
const seen = new Set();
for (const p of phases) {
  if (!p.id) fails.push(`фаза без id: ${JSON.stringify(p)}`);
  else if (seen.has(p.id)) fails.push(`дубль id: ${p.id}`);
  else seen.add(p.id);

  if (typeof p.at !== 'number' || Number.isNaN(p.at)) fails.push(`${p.id}: at не число`);
  if (typeof p.len !== 'number' || Number.isNaN(p.len)) fails.push(`${p.id}: len не число`);
  else if (p.len <= 0) fails.push(`${p.id}: len должен быть больше нуля, сейчас ${p.len}`);
  if (p.overlap === true && !p.why) fails.push(`${p.id}: overlap: true без why`);
}

const map = phases.map(win).sort((a, b) => a.from - b.from);

// ---- пересечения ----
for (let i = 0; i < map.length; i++) {
  for (let j = i + 1; j < map.length; j++) {
    const a = map[i], b = map[j];
    if (b.from >= a.to) break;               // отсортировано: дальше только правее
    if (a.overlap === true || b.overlap === true) continue;
    const len = (Math.min(a.to, b.to) - b.from).toFixed(3);
    fails.push(`${a.id} и ${b.id} пересекаются на ${len} (${b.from.toFixed(3)}…${Math.min(a.to, b.to).toFixed(3)})`);
  }
}

// ---- карта окон ----
const end = Math.max(...map.map(p => p.to));
const W = 44;
console.log(`\nКарта фаз · ${phases.length} фаз, p от ${map[0].from.toFixed(3)} до ${end.toFixed(3)}\n`);
for (const p of map) {
  const a = Math.round(p.from / end * W);
  const b = Math.max(a + 1, Math.round(p.to / end * W));
  const bar = ' '.repeat(a) + '█'.repeat(b - a);
  const mark = p.overlap === true ? ' overlap' : '';
  console.log(
    p.id.padEnd(8) +
    `${p.from.toFixed(3)}…${p.to.toFixed(3)}  ` +
    bar.padEnd(W + 1) + mark
  );
}

if (fails.length) {
  console.log('\nПРОБЛЕМЫ:');
  for (const f of fails) console.log('  · ' + f);
  console.log('\nПересечение разрешается пометкой overlap: true и полем why у одной из фаз.\n');
  process.exit(1);
}
console.log('\nокна не пересекаются\n');
