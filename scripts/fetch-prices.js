// Stáhne měsíční ceny ETF z Yahoo Finance chart API (bez klíče).
// Výstup: public/data/prices/<TICKER>.json (adjclose = hlavní hodnota, close = kontrola).
// Spuštění: node scripts/fetch-prices.js
'use strict';
const fs = require('fs');
const path = require('path');

const TICKERS = ['SPY', 'VOO', 'VT'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'prices');

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);

function url(ticker) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=max&events=div%7Csplit`;
}

function utcMonth(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 7);
}

const round4 = (x) => Math.round(x * 10000) / 10000;

async function fetchTicker(ticker) {
  const src = url(ticker);
  const res = await fetch(src, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${ticker}: HTTP ${res.status}`);
  const json = await res.json();
  const r = json.chart && json.chart.result && json.chart.result[0];
  if (!r) throw new Error(`${ticker}: neplatná odpověď (chart.result chybí)`);

  const ts = r.timestamp || [];
  const closes = r.indicators.quote[0].close || [];
  const adj = (r.indicators.adjclose && r.indicators.adjclose[0].adjclose) || null;
  if (!adj) throw new Error(`${ticker}: chybí indicators.adjclose`);
  if (closes.length !== ts.length || adj.length !== ts.length) {
    throw new Error(`${ticker}: nesouhlasí délky polí (ts=${ts.length}, close=${closes.length}, adj=${adj.length})`);
  }

  const seen = new Map();
  let skippedNull = 0;
  let skippedCurrent = 0;
  for (let i = 0; i < ts.length; i++) {
    const month = utcMonth(ts[i]);
    if (month >= currentMonth) { skippedCurrent++; continue; } // nedokončený měsíc
    if (closes[i] == null || adj[i] == null) { skippedNull++; continue; }
    if (seen.has(month)) throw new Error(`${ticker}: duplicitní měsíc ${month}`);
    seen.set(month, { date: month, adjclose: round4(adj[i]), close: round4(closes[i]) });
  }

  const data = [...seen.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (data.length === 0) throw new Error(`${ticker}: žádná data`);

  const out = {
    ticker,
    currency: r.meta.currency || 'USD',
    field: 'adjclose',
    interval: '1mo',
    source: src,
    retrieved: today,
    data,
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${ticker}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`${ticker}: ${data.length} měsíců ${data[0].date}..${data[data.length - 1].date} (vynecháno null: ${skippedNull}, nedokončený měsíc: ${skippedCurrent})`);
}

(async () => {
  let failed = false;
  for (const t of TICKERS) {
    try {
      await fetchTicker(t);
    } catch (e) {
      failed = true;
      console.error('CHYBA', e.message);
    }
  }
  if (failed) process.exit(1);
})();
