// Stáhne měsíční kurz USD/CZK (kurz ČNB posledního obchodního dne v měsíci).
// Primárně ČNB (rok.txt?rok=RRRR, jeden request na rok). Záloha: Frankfurter – jen když ČNB
// nejde vůbec, a vždy se to vypíše do konzole a zapíše do výstupu (source/method).
// Výstup: public/data/fx/usdczk.json
// Spuštění: node scripts/fetch-fx.cjs
'use strict';
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CNB_TPL = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/rok.txt?rok=';
const FRANK_TPL = 'https://api.frankfurter.dev/v1/';
const OUT = path.join(__dirname, '..', 'public', 'data', 'fx', 'usdczk.json');
const METHOD_CNB = 'kurz ČNB posledního obchodního dne v měsíci';
const METHOD_FRANK = 'Frankfurter (ECB referenční kurz) posledního obchodního dne v měsíci – záloha, ČNB nedostupná';

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const currentYear = Number(today.slice(0, 4));
const FIRST_YEAR = 2008;

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} pro ${url}`);
  return new TextDecoder('utf-8').decode(await res.arrayBuffer());
}

// Vrátí { 'YYYY-MM-DD': rate } pro jeden rok ČNB souboru. Sloupec se hledá podle hlavičky.
function parseCnbYear(text, year) {
  const rows = {};
  let usdIdx = -1;
  let usdAmount = 1;
  let headerCount = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('Datum|')) {
      headerCount++;
      const cols = line.split('|').slice(1);
      usdIdx = cols.findIndex((c) => /^\d+\s+USD$/.test(c.trim()));
      if (usdIdx < 0) throw new Error(`ČNB ${year}: v hlavičce chybí USD`);
      usdAmount = Number(cols[usdIdx].trim().split(/\s+/)[0]);
      continue;
    }
    const parts = line.split('|');
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(parts[0]);
    if (!m) throw new Error(`ČNB ${year}: neočekávaný řádek "${line.slice(0, 60)}"`);
    if (usdIdx < 0) throw new Error(`ČNB ${year}: datový řádek před hlavičkou`);
    const iso = `${m[3]}-${m[2]}-${m[1]}`;
    if (Number(m[3]) !== year) throw new Error(`ČNB ${year}: datum mimo rok (${iso})`);
    const cell = parts[usdIdx + 1];
    if (cell == null || cell.trim() === '') throw new Error(`ČNB ${year}: prázdná hodnota USD pro ${iso}`);
    const value = Number(cell.trim().replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(value)) throw new Error(`ČNB ${year}: nečíselná hodnota "${cell}" pro ${iso}`);
    rows[iso] = value / usdAmount; // kurz za 1 USD
  }
  if (headerCount === 0) throw new Error(`ČNB ${year}: hlavička nenalezena`);
  return rows;
}

// Z denních hodnot vezme poslední obchodní den každého měsíce (bez nedokončeného měsíce).
function lastDayPerMonth(daily) {
  const byMonth = new Map();
  for (const iso of Object.keys(daily).sort()) {
    const month = iso.slice(0, 7);
    if (month >= currentMonth) continue;
    byMonth.set(month, { date: month, rate: Math.round(daily[iso] * 10000) / 10000 });
  }
  return [...byMonth.values()];
}

async function fromCnb() {
  const daily = {};
  for (let y = FIRST_YEAR; y <= currentYear; y++) {
    const url = CNB_TPL + y;
    const text = await getText(url);
    Object.assign(daily, parseCnbYear(text, y));
    console.log(`ČNB ${y}: ${Object.keys(parseCnbYear(text, y)).length} obchodních dnů`);
  }
  return { rows: lastDayPerMonth(daily), source: CNB_TPL + 'RRRR', method: METHOD_CNB };
}

async function fromFrankfurter() {
  const end = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const url = `${FRANK_TPL}${FIRST_YEAR}-01-01..${end}?base=USD&symbols=CZK`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const json = await res.json();
  const daily = {};
  for (const [d, v] of Object.entries(json.rates || {})) daily[d] = v.CZK;
  return { rows: lastDayPerMonth(daily), source: url, method: METHOD_FRANK };
}

(async () => {
  let result;
  try {
    result = await fromCnb();
  } catch (e) {
    console.error(`ČNB selhala: ${e.message}`);
    console.error('ZÁLOHA: přepínám na Frankfurter (ECB kurz, ne ČNB) – výstup to uvádí v source/method.');
    result = await fromFrankfurter();
  }
  const out = {
    pair: 'USD/CZK',
    method: result.method,
    source: result.source,
    retrieved: today,
    data: result.rows,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
  const d = result.rows;
  console.log(`USD/CZK: ${d.length} měsíců ${d[0].date}..${d[d.length - 1].date}`);
})().catch((e) => {
  console.error('CHYBA', e.message);
  process.exit(1);
});
