// Projde public/data/prices a public/data/fx a sestaví public/data/meta.json.
// Cesty ve "files" jsou relativní k public/data/ (např. "prices/VOO.json").
// Spuštění: node scripts/build-meta.js
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'public', 'data');
const SUBDIRS = ['prices', 'fx'];

const today = new Date().toISOString().slice(0, 10);
const files = {};

for (const sub of SUBDIRS) {
  const dir = path.join(DATA, sub);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const rel = `${sub}/${name}`;
    const json = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    if (!Array.isArray(json.data) || json.data.length === 0) throw new Error(`${rel}: prázdná data`);
    if (!json.source || !json.retrieved) throw new Error(`${rel}: chybí source/retrieved`);
    const months = json.data.map((r) => r.date);
    const sorted = [...months].sort();
    if (JSON.stringify(months) !== JSON.stringify(sorted)) throw new Error(`${rel}: data nejsou seřazena`);
    if (new Set(months).size !== months.length) throw new Error(`${rel}: duplicitní měsíce`);
    files[rel] = {
      source: json.source,
      retrieved: json.retrieved,
      from: months[0],
      to: months[months.length - 1],
      records: json.data.length,
    };
  }
}

const meta = { generated: today, files };
fs.writeFileSync(path.join(DATA, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
console.log(`meta.json: ${Object.keys(files).length} souborů`);
for (const [k, v] of Object.entries(files)) console.log(`  ${k}: ${v.from}..${v.to}, ${v.records} záznamů`);
