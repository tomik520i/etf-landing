// Výpočetní jádro kalkulačky. Čisté funkce bez DOM – testy: `npm test`.
//
// Model historického spoření (backtest):
//   - každý měsíc investuješ `monthlyCzk` Kč,
//   - převod na USD kurzem ČNB posledního obchodního dne měsíce,
//   - nákup podílů za adjusted close téhož měsíce (dividendy reinvestované),
//   - hodnota dnes = podíly × poslední adjusted close × poslední kurz.
// Zjednodušení: nákup za měsíční close (ne v den výplaty), bez poplatků brokera,
// bez daní, zlomkové podíly. TER fondu už je v adjusted close započtený.
//
// `extraFeePct` = dodatečný roční poplatek (např. 1 % u dražšího fondu nebo
// správce), strhává se měsíčně z držené hodnoty: podíly × (1 − p)^(1/12).
// Poplatek se v obou funkcích strhává za přesně ty měsíce, kdy jsou peníze
// investované: backtest nakupuje na KONCI měsíce (první měsíc bez výnosu i
// poplatku), projekce vkládá na ZAČÁTKU měsíce (první měsíc s výnosem i poplatkem).

/** Spojí ceny a kurzy podle měsíce (jen měsíce, kde existuje obojí). */
export function alignSeries(prices, fx) {
  const fxByMonth = new Map(fx.map((r) => [r.date, r.rate]));
  return prices
    .filter((p) => fxByMonth.has(p.date))
    .map((p) => ({ date: p.date, price: p.adjclose, fx: fxByMonth.get(p.date) }));
}

const monthlyKeep = (annualFeePct) => Math.pow(1 - annualFeePct / 100, 1 / 12);

/**
 * Historický backtest pravidelné investice.
 * @param {{date:string, price:number, fx:number}[]} series výstup alignSeries
 * @param {{monthlyCzk:number, years:number, extraFeePct?:number}} opts
 * @returns výsledek včetně měsíční řady pro graf, nebo null když chybí data
 */
export function backtest(series, { monthlyCzk, years, extraFeePct = 0 }) {
  const months = Math.round(years * 12);
  if (!(monthlyCzk > 0) || months < 1 || series.length < months) return null;

  const window = series.slice(series.length - months);
  const last = window[window.length - 1];
  const keep = monthlyKeep(extraFeePct);

  let units = 0;          // podíly bez extra poplatku
  let unitsFee = 0;       // podíly s extra poplatkem
  let invested = 0;
  let valueAtBuyFx = 0;   // hodnota, kdyby kurz zůstal jako v den nákupu (pro kurzový efekt)
  const points = [];

  for (const m of window) {
    unitsFee *= keep;
    const bought = monthlyCzk / m.fx / m.price;
    units += bought;
    unitsFee += bought;
    invested += monthlyCzk;
    points.push({
      date: m.date,
      invested,
      value: units * m.price * m.fx,
      valueWithFee: unitsFee * m.price * m.fx,
    });
  }
  for (const m of window) {
    valueAtBuyFx += (monthlyCzk / m.fx / m.price) * last.price * m.fx;
  }

  const value = units * last.price * last.fx;
  const valueWithFee = unitsFee * last.price * last.fx;
  return {
    from: window[0].date,
    to: last.date,
    months,
    invested,
    value,
    gain: value - invested,
    valueWithFee,
    feeCost: value - valueWithFee,
    fxEffect: value - valueAtBuyFx, // > 0 = koruna oslabila (pomohlo), < 0 = posílila
    points,
  };
}

/**
 * Projekce do budoucna při zvoleném průměrném ročním výnosu (scénář, ne předpověď).
 * Vklad na začátku měsíce, výnos i poplatek se úročí měsíčně.
 * @param {{monthlyCzk:number, years:number, annualReturnPct:number, extraFeePct?:number}} opts
 */
export function project({ monthlyCzk, years, annualReturnPct, extraFeePct = 0 }) {
  const months = Math.round(years * 12);
  if (!(monthlyCzk > 0) || months < 1) return null;

  const grow = Math.pow(1 + annualReturnPct / 100, 1 / 12);
  const keep = monthlyKeep(extraFeePct);

  let value = 0;
  let valueWithFee = 0;
  const points = [];
  for (let i = 1; i <= months; i++) {
    value = (value + monthlyCzk) * grow;
    valueWithFee = (valueWithFee + monthlyCzk) * grow * keep;
    if (i % 12 === 0 || i === months) {
      points.push({ month: i, invested: monthlyCzk * i, value, valueWithFee });
    }
  }
  const invested = monthlyCzk * months;
  return { months, invested, value, gain: value - invested, valueWithFee, feeCost: value - valueWithFee, points };
}

/** Průměrný roční výnos (CAGR) ceny za posledních `years` let z měsíční řady. */
export function cagr(series, years, field = 'price') {
  const months = Math.round(years * 12);
  if (series.length <= months) return null;
  const end = series[series.length - 1][field];
  const start = series[series.length - 1 - months][field];
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}
