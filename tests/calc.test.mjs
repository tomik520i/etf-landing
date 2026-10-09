// Testy výpočetního jádra public/js/calc.js.
// Spuštění: node --test tests/
//
// Očekávané hodnoty jsou spočítané ručně (výpočet je v komentářích), ne opsáním
// algoritmu z calc.js. Tam, kde je to možné, se kontrolují matematické vlastnosti.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { alignSeries, backtest, project, cagr } from '../public/js/calc.js';

// Pomocník: měsíční řada 'YYYY-MM' počínaje 2020-01.
function monthLabel(i) {
  const y = 2020 + Math.floor(i / 12);
  const m = (i % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

// Pomocník: relativní porovnání s tolerancí.
function assertRel(actual, expected, rel, msg) {
  const tol = rel * Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} vs ${expected} (tol ${tol})`);
}

// ---------------------------------------------------------------------------
// 1. alignSeries
// ---------------------------------------------------------------------------
test('alignSeries: měsíce bez kurzu vypadnou, pořadí zachováno', () => {
  const prices = [
    { date: '2020-01', adjclose: 10 },
    { date: '2020-02', adjclose: 11 }, // chybí kurz -> vypadne
    { date: '2020-03', adjclose: 12 },
    { date: '2020-04', adjclose: 13 }, // chybí kurz -> vypadne
    { date: '2020-05', adjclose: 14 },
  ];
  const fx = [
    { date: '2020-01', rate: 20 },
    { date: '2020-03', rate: 21 },
    { date: '2020-05', rate: 22 },
    { date: '2020-06', rate: 23 }, // cena chybí -> nevznikne záznam
  ];
  const out = alignSeries(prices, fx);
  assert.deepEqual(out, [
    { date: '2020-01', price: 10, fx: 20 },
    { date: '2020-03', price: 12, fx: 21 },
    { date: '2020-05', price: 14, fx: 22 },
  ]);
});

test('alignSeries: pořadí podle vstupních cen (ne podle kurzů)', () => {
  const prices = [
    { date: '2021-03', adjclose: 3 },
    { date: '2021-01', adjclose: 1 },
    { date: '2021-02', adjclose: 2 },
  ];
  const fx = [
    { date: '2021-02', rate: 2 },
    { date: '2021-01', rate: 1 },
    { date: '2021-03', rate: 3 },
  ];
  const out = alignSeries(prices, fx);
  assert.deepEqual(out.map((r) => r.date), ['2021-03', '2021-01', '2021-02']);
});

// ---------------------------------------------------------------------------
// 2. backtest – konstantní cena a kurz, bez poplatku
// ---------------------------------------------------------------------------
test('backtest: konstantní cena a kurz, 0 % poplatek -> value = invested', () => {
  // Cena 50 USD, kurz 25 Kč/USD, vklad 1000 Kč, 12 měsíců.
  // Každý měsíc koupím 1000/25/50 = 0,8 podílu; celkem 9,6 podílu.
  // Hodnota = 9,6 * 50 * 25 = 12000 = investováno (12 * 1000).
  const series = Array.from({ length: 12 }, (_, i) => ({ date: monthLabel(i), price: 50, fx: 25 }));
  const r = backtest(series, { monthlyCzk: 1000, years: 1 });
  assert.ok(r);
  assert.ok(Math.abs(r.value - r.invested) < 1e-9);
  assert.equal(r.invested, 12000);
  assert.ok(Math.abs(r.gain) < 1e-9);
  assert.ok(Math.abs(r.feeCost) < 1e-9);
  assert.ok(Math.abs(r.fxEffect) < 1e-9);
});

// ---------------------------------------------------------------------------
// 3. backtest – ruční příklad
// ---------------------------------------------------------------------------
test('backtest: ručně spočítaný 3měsíční příklad', () => {
  // Ceny 10, 20, 40 USD, kurz 20 po celou dobu, vklad 1000 Kč měsíčně.
  // Nákupy: 1000/20/10 = 5 ks; 1000/20/20 = 2,5 ks; 1000/20/40 = 1,25 ks.
  // Celkem 8,75 ks. Poslední cena 40, kurz 20 -> hodnota = 8,75 * 40 * 20 = 7000 Kč.
  // Investováno 3000 Kč -> zisk 4000 Kč. Kurz konstantní -> fxEffect 0.
  // Body grafu: měsíc 1: 5*10*20 = 1000; měsíc 2: 7,5*20*20 = 3000; měsíc 3: 7000.
  const series = [
    { date: '2020-01', price: 10, fx: 20 },
    { date: '2020-02', price: 20, fx: 20 },
    { date: '2020-03', price: 40, fx: 20 },
  ];
  const r = backtest(series, { monthlyCzk: 1000, years: 0.25 }); // 0,25 * 12 = 3 měsíce
  assert.ok(r);
  assert.equal(r.months, 3);
  assert.ok(Math.abs(r.invested - 3000) < 1e-9);
  assert.ok(Math.abs(r.value - 7000) < 1e-9);
  assert.ok(Math.abs(r.gain - 4000) < 1e-9);
  assert.ok(Math.abs(r.fxEffect) < 1e-9);
  assert.deepEqual(r.points.map((p) => Math.round(p.value * 1e9) / 1e9), [1000, 3000, 7000]);
  assert.deepEqual(r.points.map((p) => p.invested), [1000, 2000, 3000]);
});

// ---------------------------------------------------------------------------
// 4. backtest – kurzový efekt
// ---------------------------------------------------------------------------
test('backtest: kurz 20 -> 25 při konstantní ceně dává kladný fxEffect', () => {
  // Cena 10 USD po celou dobu, vklad 1000 Kč, 2 měsíce, kurz 20 pak 25.
  // Nákupy: 1000/20/10 = 5 ks (kurz 20); 1000/25/10 = 4 ks (kurz 25). Celkem 9 ks.
  // Hodnota dnes = 9 * 10 * 25 = 2250 Kč. Investováno 2000 Kč.
  // Hodnota při kurzu z nákupu: 5 ks * 10 * 20 + 4 ks * 10 * 25 = 1000 + 1000 = 2000 Kč.
  // fxEffect = 2250 - 2000 = 250 > 0 (koruna oslabila). value - fxEffect = 2000.
  const series = [
    { date: '2020-01', price: 10, fx: 20 },
    { date: '2020-02', price: 10, fx: 25 },
  ];
  const r = backtest(series, { monthlyCzk: 1000, years: 2 / 12 });
  assert.ok(r);
  assert.ok(Math.abs(r.value - 2250) < 1e-9);
  assert.ok(Math.abs(r.fxEffect - 250) < 1e-9);
  assert.ok(r.fxEffect > 0);
  assert.ok(Math.abs(r.value - r.fxEffect - 2000) < 1e-9);
});

// ---------------------------------------------------------------------------
// 5. backtest – extraFeePct
// ---------------------------------------------------------------------------
test('backtest: 1 měsíc s poplatkem -> valueWithFee === value (poplatek se neúčtuje z nového nákupu)', () => {
  // Jeden nákup 1000 Kč za cenu 10 USD při kurzu 20 -> 5 ks, hodnota 5*10*20 = 1000.
  // Kód strhává poplatek z držených podílů PŘED nákupem, takže nový nákup se v měsíci nákupu nestrhává.
  const series = [{ date: '2020-01', price: 10, fx: 20 }];
  const r = backtest(series, { monthlyCzk: 1000, years: 1 / 12, extraFeePct: 1 });
  assert.ok(r);
  assert.equal(r.value, 1000);
  assert.equal(r.valueWithFee, r.value);
  assert.equal(r.feeCost, r.value - r.valueWithFee);
  assert.equal(r.feeCost, 0);
});

test('backtest: 2 měsíce s poplatkem 1 % -> valueWithFee < value, měsíční úbytek odpovídá roční sazbě', () => {
  // Cena 10 USD, kurz 20, vklad 1000 Kč: nákupy po 5 ks, hodnota 200 Kč/ks.
  // value = 10 ks * 200 = 2000 Kč.
  // Při poplatku p za rok se držené podíly každý měsíc násobí k = (1-p)^(1/12) a první nákup
  // (z měsíce 1) prodělá jedno takové snížení před druhým nákupem:
  // valueWithFee = (5k + 5) * 200 = 1000 * (1 + k).
  // Ověření nezávisle na kódu: k^12 musí být 1 - p = 0,99.
  const series = [
    { date: '2020-01', price: 10, fx: 20 },
    { date: '2020-02', price: 10, fx: 20 },
  ];
  const r = backtest(series, { monthlyCzk: 1000, years: 2 / 12, extraFeePct: 1 });
  assert.ok(r);
  assert.equal(r.value, 2000);
  assert.ok(r.valueWithFee < r.value);
  assert.ok(r.feeCost > 0);
  assert.equal(r.feeCost, r.value - r.valueWithFee);
  const k = r.valueWithFee / 1000 - 1;
  assert.ok(Math.abs(Math.pow(k, 12) - 0.99) < 1e-9, `k^12 = ${Math.pow(k, 12)}`);
});

// ---------------------------------------------------------------------------
// 6. backtest – null případy
// ---------------------------------------------------------------------------
test('backtest: vrací null pro neplatné vstupy', () => {
  const series = Array.from({ length: 24 }, (_, i) => ({ date: monthLabel(i), price: 10, fx: 20 }));
  assert.equal(backtest(series, { monthlyCzk: 0, years: 1 }), null);
  assert.equal(backtest(series, { monthlyCzk: -500, years: 1 }), null);
  assert.equal(backtest(series, { monthlyCzk: 1000, years: 100 }), null); // chybí data
  assert.equal(backtest(series, { monthlyCzk: 1000, years: 0 }), null);
});

// ---------------------------------------------------------------------------
// 7. backtest – posledních years*12 měsíců
// ---------------------------------------------------------------------------
test('backtest: bere poslední years*12 měsíců řady', () => {
  // 30 měsíců: prvních 18 má extrémní ceny a kurzy, posledních 12 má cenu 50 a kurz 25.
  // Pokud by se použil začátek řady, výsledek by nebyl 12000.
  const series = Array.from({ length: 30 }, (_, i) =>
    i < 18 ? { date: monthLabel(i), price: 1e9, fx: 1e9 } : { date: monthLabel(i), price: 50, fx: 25 }
  );
  const r = backtest(series, { monthlyCzk: 1000, years: 1 });
  assert.ok(r);
  assert.equal(r.months, 12);
  assert.equal(r.points.length, 12);
  assert.equal(r.from, monthLabel(18));
  assert.equal(r.to, monthLabel(29));
  assert.ok(Math.abs(r.value - 12000) < 1e-6);
  // Investováno roste lineárně: 1000, 2000, ..., 12000.
  r.points.forEach((p, i) => assert.equal(p.invested, 1000 * (i + 1)));
  // Hodnota v bodě i: (i+1) * 0,8 ks * 50 * 25 = 1000 * (i+1).
  r.points.forEach((p, i) => assertRel(p.value, 1000 * (i + 1), 1e-9, `value bod ${i}`));
});

// ---------------------------------------------------------------------------
// 8. project
// ---------------------------------------------------------------------------
test('project: 0 % výnos a 0 % poplatek -> value === invested', () => {
  const r = project({ monthlyCzk: 1000, years: 10, annualReturnPct: 0 });
  assert.ok(r);
  assert.equal(r.months, 120);
  assert.equal(r.invested, 120000);
  assertRel(r.value, 120000, 1e-9, 'value');
  assert.ok(Math.abs(r.feeCost) < 1e-6);
});

test('project: srovnání s uzavřeným vzorcem anuity splatné předem', () => {
  // FV = P * ((1+i)^n - 1) / i * (1+i), i = (1+r)^(1/12) - 1.
  // Příklad: P = 1000 Kč, n = 120, r = 6 % ročně.
  const P = 1000;
  const n = 120;
  const i = Math.pow(1.06, 1 / 12) - 1;
  const fv = (P * (Math.pow(1 + i, n) - 1)) / i * (1 + i);
  const r = project({ monthlyCzk: P, years: 10, annualReturnPct: 6 });
  assert.ok(r);
  assertRel(r.value, fv, 1e-6, 'FV');
  assert.equal(r.invested, 120000);
  assert.ok(Math.abs(r.gain - (r.value - 120000)) < 1e-6);
});

test('project: s poplatkem je valueWithFee < value a feeCost = value - valueWithFee', () => {
  const r = project({ monthlyCzk: 1000, years: 10, annualReturnPct: 6, extraFeePct: 1 });
  assert.ok(r);
  assert.ok(r.valueWithFee < r.value);
  assert.ok(r.feeCost > 0);
  assert.equal(r.feeCost, r.value - r.valueWithFee);
});

test('project: points mají záznam na konci každého roku a na posledním měsíci', () => {
  const r15 = project({ monthlyCzk: 1000, years: 1.5, annualReturnPct: 5 });
  assert.ok(r15);
  assert.deepEqual(r15.points.map((p) => p.month), [12, 18]);
  assert.equal(r15.points[r15.points.length - 1].month, 18);
  assert.equal(r15.points[r15.points.length - 1].invested, 18000);

  const r2 = project({ monthlyCzk: 1000, years: 2, annualReturnPct: 5 });
  assert.deepEqual(r2.points.map((p) => p.month), [12, 24]);

  // Při celém roce se bod 12 nesmí zapsat dvakrát.
  const r1 = project({ monthlyCzk: 1000, years: 1, annualReturnPct: 5 });
  assert.deepEqual(r1.points.map((p) => p.month), [12]);
});

test('project: vrací null pro neplatné vstupy', () => {
  assert.equal(project({ monthlyCzk: 0, years: 5, annualReturnPct: 5 }), null);
  assert.equal(project({ monthlyCzk: 1000, years: 0, annualReturnPct: 5 }), null);
});

// ---------------------------------------------------------------------------
// 10. cagr
// ---------------------------------------------------------------------------
test('cagr: řada zdvojnásobená za 12 měsíců -> 100 %', () => {
  // 13 bodů: cena 100 na začátku, 200 po 12 měsících. (200/100)^(1/1) - 1 = 100 %.
  const series = Array.from({ length: 13 }, (_, i) => ({ date: monthLabel(i), price: i === 12 ? 200 : 100 }));
  assert.ok(Math.abs(cagr(series, 1) - 100) < 1e-9);
});

test('cagr: zdvojnásobení za 24 měsíců -> (sqrt(2) - 1) * 100 % ročně', () => {
  // 2^(1/2) - 1 = 0,41421356... -> 41,421356 %
  const series = Array.from({ length: 25 }, (_, i) => ({ date: monthLabel(i), price: 100 * Math.pow(2, i / 24) }));
  assertRel(cagr(series, 2), (Math.SQRT2 - 1) * 100, 1e-9, 'cagr 2 let');
});

test('cagr: null, když je málo dat', () => {
  const short = Array.from({ length: 12 }, (_, i) => ({ date: monthLabel(i), price: 100 + i }));
  assert.equal(cagr(short, 1), null);
  assert.equal(cagr([], 1), null);
});

test('cagr: výchozí pole je price, lze zadat adjclose', () => {
  const series = Array.from({ length: 13 }, (_, i) => ({ date: monthLabel(i), adjclose: i === 12 ? 300 : 100 }));
  assert.ok(Math.abs(cagr(series, 1, 'adjclose') - 200) < 1e-9);
});

// ---------------------------------------------------------------------------
// 11. Reálná data: VOO + USD/CZK
// ---------------------------------------------------------------------------
test('reálná data: VOO, 10 let, 2000 Kč měsíčně, poplatek 1 %', () => {
  const root = new URL('../public/data/', import.meta.url);
  const prices = JSON.parse(readFileSync(new URL('prices/VOO.json', root), 'utf8')).data;
  const fx = JSON.parse(readFileSync(new URL('fx/usdczk.json', root), 'utf8')).data;
  const series = alignSeries(prices, fx);
  const r = backtest(series, { monthlyCzk: 2000, years: 10, extraFeePct: 1 });
  assert.ok(r, 'backtest vrátil null');
  assert.equal(r.months, 120);
  assert.equal(r.invested, 240000);
  assert.ok(r.value > r.invested);
  assert.ok(r.feeCost > 0 && r.feeCost < r.value);
  assert.equal(r.points.length, 120);
  const last = r.points[r.points.length - 1];
  assertRel(last.value, r.value, 1e-6, 'poslední bod grafu vs value');
  assert.equal(last.invested, r.invested);
});
