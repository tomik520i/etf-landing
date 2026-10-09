import { alignSeries, backtest } from './calc.js';
import { track, API_BASE, getContext } from './track.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt = (n) => nf.format(Math.round(n));
const mmYYYY = (d) => `${d.slice(5, 7)}/${d.slice(0, 4)}`;

/* ---------- Scroll-reveal (hero a kalkulačka se neanimují) ---------- */
function initReveal() {
  window.__lpReady = true; // pojistka v <head>: bez app.js se po 3 s zobrazí vše
  const items = $$('.reveal');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  // zpoždění mezi sourozenci
  $$('.funds').forEach((g) => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--reveal-delay', `${i * 80}ms`)));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
}

/* ---------- Hero varianty ---------- */
const HERO = {
  a: {
    year: 2011,
    eyebrow: 'Poplatky od roku 2011',
    h1: 'Kolik by tě od roku 2011 stál 1% poplatek navíc?',
    sub: 'Při 2 000 Kč měsíčně do S&P 500 zhruba 137 000 Kč. Spočítej si to s vlastní částkou.',
    podtext: 'Historická data 01/2011 až 09/2026 (Yahoo Finance, ČNB). Vloženo 378 000 Kč, hodnota 1 365 315 Kč, s 1% poplatkem navíc 1 228 459 Kč, rozdíl 136 856 Kč. Minulé výnosy nezaručují budoucí výnosy.',
    cta: 'Spočítej si svůj poplatek',
  },
  b: {
    year: 2010,
    eyebrow: 'Data od roku 2010',
    h1: '2 000 Kč měsíčně od 2010: kolik je dnes?',
    sub: 'Takhle by vypadal účet při pravidelném nákupu S&P 500 od 01/2010 do 09/2026: vloženo 402 000 Kč, hodnota zhruba 1,6 milionu.',
    podtext: 'Historická data 01/2010 až 09/2026 (Yahoo Finance, ČNB). Přesně: vloženo 402 000 Kč, hodnota 1 608 004 Kč. Kdyby fond stál o 1 % ročně víc, bylo by to 1 434 656 Kč, tedy o 173 348 Kč méně. Minulé výnosy nezaručují budoucí výnosy.',
    cta: 'Spočítej si svou částku',
  },
};
function initHero() {
  const v = HERO[new URLSearchParams(location.search).get('ad')];
  if (!v) return;
  $('#hero-eyebrow').textContent = v.eyebrow;
  $('#hero-h1').textContent = v.h1;
  $('#hero-sub').textContent = v.sub;
  $('#hero-podtext').textContent = v.podtext;
  $('#hero-cta').textContent = v.cta;
  // kalkulačka startuje ve stejném scénáři, jaký slibuje reklama
  $('#in-year').value = v.year;
  $('#out-year').textContent = v.year;
}

/* ---------- Kalkulačka ---------- */
const prices = {};        // ticker -> Promise<aligned series>
let fxPromise = null;
const loadJson = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); });
function getSeries(ticker) {
  fxPromise ||= loadJson('data/fx/usdczk.json');
  prices[ticker] ||= Promise.all([loadJson(`data/prices/${ticker}.json`), fxPromise])
    .then(([p, fx]) => alignSeries(p.data, fx.data));
  return prices[ticker];
}

const el = {
  monthly: $('#in-monthly'), monthlyRange: $('#in-monthly-range'),
  year: $('#in-year'), outYear: $('#out-year'),
  fee: $('#in-fee'), outFee: $('#out-fee'),
  value: $('#res-value-num'), title: $('#res-title'), stats: $('#res-stats'),
  chart: $('#chart'), chartWrap: $('#chart-wrap'),
  fxNote: $('#res-fx-note'), warn: $('#res-warn'), error: $('#res-error'),
};
const state = { fund: 'SPY', series: null, interacted: false, resultViewed: false, raf: 0, last: null };

function setPct(input) {
  const min = +input.min, max = +input.max;
  input.style.setProperty('--pct', `${((+input.value - min) / (max - min)) * 100}%`);
}

function yearRange(series) {
  const first = series[0].date;
  const minYear = +first.slice(0, 4) + (first.slice(5, 7) === '01' ? 0 : 1);
  const maxYear = +series[series.length - 1].date.slice(0, 4) - 1;
  return [minYear, maxYear];
}

function applyYearRange() {
  const [min, max] = yearRange(state.series);
  el.year.min = min; el.year.max = max;
  let y = +el.year.value;
  if (y < min) y = min;
  if (y > max) y = max;
  el.year.value = y;
  el.outYear.textContent = y;
  setPct(el.year);
}

function sentence(tpl, vals) {
  const li = document.createElement('li');
  tpl.split(/(\{\w+\})/).forEach((part) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (m) { const s = document.createElement('strong'); s.textContent = vals[m[1]]; li.append(s); }
    else if (part) li.append(part);
  });
  return li;
}

function compute() {
  const s = state.series;
  if (!s) return null;
  const monthlyCzk = +el.monthly.value;
  const startYear = +el.year.value;
  const lastDate = s[s.length - 1].date;
  const months = (+lastDate.slice(0, 4) - startYear) * 12 + +lastDate.slice(5, 7);
  return backtest(s, { monthlyCzk, years: months / 12, extraFeePct: +el.fee.value });
}

function render() {
  state.raf = 0;
  const r = compute();
  state.last = r;
  if (!r) {
    el.error.hidden = false;
    el.error.textContent = 'Pro tuto kombinaci nemáme dost dat. Zkus později začít nebo změnit vklad.';
    return;
  }
  el.error.hidden = true;
  const od = mmYYYY(r.from), toStr = mmYYYY(r.to);
  el.title.textContent = `Výsledek za období ${od} až ${toStr}`;
  el.value.textContent = fmt(r.value);
  el.stats.textContent = '';
  el.stats.append(
    sentence('Vloženo by bylo {vlozeno} Kč.', { vlozeno: fmt(r.invested) }),
    sentence('Z toho výnos {zisk} Kč.', { zisk: fmt(r.gain) }),
  );
  const feeLi = sentence('Poplatek navíc by tě za tu dobu stál {poplatek} Kč.', { poplatek: fmt(r.feeCost) });
  feeLi.className = 'fee';
  const pos = r.fxEffect >= 0;
  const fxLi = sentence(
    pos ? 'Kurz USD/CZK ti za období přidal {kurz_efekt} Kč.' : 'Kurz USD/CZK ti za období ubral {kurz_efekt} Kč.',
    { kurz_efekt: fmt(Math.abs(r.fxEffect)) },
  );
  fxLi.className = 'fx';
  el.stats.append(feeLi, fxLi);
  el.warn.textContent = `Jde o historii za období ${od} až ${toStr}. Minulé výnosy nezaručují budoucí výnosy.`;
  drawChart(r, od, toStr);
}

function schedule() {
  if (!state.raf) state.raf = requestAnimationFrame(render);
}

/* ---------- SVG graf ---------- */
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}
function yLabel(v) {
  if (v === 0) return '0';
  if (v >= 1e6) return `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 }).format(v / 1e6)} mil.`;
  return `${nf.format(v / 1e3)} tis.`;
}

function drawChart(r, od, toStr) {
  const w = Math.max(280, Math.round(el.chartWrap.clientWidth));
  if (!w) return;
  const h = w < 480 ? 240 : 300;
  const m = { t: 12, r: 12, b: 28, l: w < 480 ? 48 : 56 };
  const pts = r.points;
  const n = pts.length;
  const maxV = niceMax(Math.max(...pts.map((p) => Math.max(p.value, p.valueWithFee, p.invested))));
  const ticks = 4;
  const x = (i) => m.l + (n > 1 ? (i / (n - 1)) * (w - m.l - m.r) : 0);
  const y = (v) => m.t + (1 - v / maxV) * (h - m.t - m.b);
  const line = (k) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[k]).toFixed(1)}`).join('');

  let g = '';
  for (let i = 0; i <= ticks; i++) {
    const v = (maxV / ticks) * i;
    g += `<line class="grid" x1="${m.l}" x2="${w - m.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`;
    g += `<text x="${m.l - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${yLabel(v)}</text>`;
  }
  const years = n / 12;
  const pxPerYear = (w - m.l - m.r) / Math.max(years, 1);
  const stepY = Math.max(1, Math.ceil(44 / pxPerYear));
  const y0 = +pts[0].date.slice(0, 4);
  pts.forEach((p, i) => {
    if (p.date.slice(5, 7) !== '01') return;
    const yr = +p.date.slice(0, 4);
    if ((yr - y0) % stepY) return;
    g += `<text x="${x(i).toFixed(1)}" y="${h - 8}" text-anchor="middle">${yr}</text>`;
  });
  g += `<path d="${line('invested')}" fill="none" stroke="var(--invested)" stroke-width="1.5" stroke-linejoin="round"/>`;
  g += `<path d="${line('valueWithFee')}" fill="none" stroke="var(--fee)" stroke-width="2" stroke-dasharray="6 4" stroke-linejoin="round"/>`;
  g += `<path d="${line('value')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

  el.chart.setAttribute('viewBox', `0 0 ${w} ${h}`);
  el.chart.setAttribute('width', w);
  el.chart.setAttribute('height', h);
  el.chart.innerHTML = g;
  el.chart.setAttribute('aria-label',
    `Graf vývoje investice od ${od} do ${toStr}: vloženo ${fmt(r.invested)} Kč, hodnota ${fmt(r.value)} Kč, hodnota s poplatkem navíc ${fmt(r.valueWithFee)} Kč.`);
}

/* ---------- Události kalkulačky ---------- */
function onInteract() {
  if (state.interacted) return;
  state.interacted = true;
  track('calc_interact');
  if (state.resultViewed || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting) || state.resultViewed) return;
    state.resultViewed = true;
    track('calc_result_viewed');
    io.disconnect();
  }, { threshold: 0.5 });
  io.observe($('#res-value-num').parentElement);
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function initCalc() {
  [el.monthlyRange, el.year, el.fee].forEach(setPct);

  el.monthlyRange.addEventListener('input', () => {
    el.monthly.value = el.monthlyRange.value; setPct(el.monthlyRange); onInteract(); schedule();
  });
  el.monthly.addEventListener('input', () => {
    const v = +el.monthly.value;
    if (v >= 500 && v <= 20000) { el.monthlyRange.value = v; setPct(el.monthlyRange); schedule(); }
    onInteract();
  });
  el.monthly.addEventListener('change', () => {
    const v = clamp(Math.round((+el.monthly.value || 2000) / 500) * 500, 500, 20000);
    el.monthly.value = v; el.monthlyRange.value = v; setPct(el.monthlyRange); schedule();
  });
  el.year.addEventListener('input', () => {
    el.outYear.textContent = el.year.value; setPct(el.year); onInteract(); schedule();
  });
  el.fee.addEventListener('input', () => {
    el.outFee.textContent = `${nf1.format(+el.fee.value)} %`; setPct(el.fee); onInteract(); schedule();
  });
  el.outFee.textContent = `${nf1.format(+el.fee.value)} %`;

  $$('input[name=fund]').forEach((radio) => radio.addEventListener('change', async () => {
    if (!radio.checked) return;
    onInteract();
    state.fund = radio.value;
    try {
      state.series = await getSeries(radio.value);
      if (state.fund !== radio.value) return;
      applyYearRange();
      schedule();
    } catch { showLoadError(); }
  }));

  if ('ResizeObserver' in window) {
    let lastW = 0;
    new ResizeObserver(() => {
      const w = el.chartWrap.clientWidth;
      if (w !== lastW) { lastW = w; if (state.last) drawChart(state.last, mmYYYY(state.last.from), mmYYYY(state.last.to)); }
    }).observe(el.chartWrap);
  }
}

function showLoadError() {
  el.error.hidden = false;
  el.error.textContent = 'Data se nepodařilo načíst. Zkus stránku načíst znovu.';
}

async function startCalc() {
  initCalc();
  try {
    state.series = await getSeries('SPY');
    applyYearRange();
    render();
    // ostatní fondy na pozadí, ať je přepnutí okamžité
    ['VOO', 'VT'].forEach((t) => (window.requestIdleCallback || setTimeout)(() => getSeries(t).catch(() => {})));
  } catch { showLoadError(); }
}

/* ---------- Formuláře ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function initForms() {
  $$('form.lead-form').forEach((form) => {
    const position = +form.dataset.position;
    const email = $('[name=email]', form), consent = $('[name=consent]', form), hp = $('[name=website]', form);
    const btn = $('button[type=submit]', form);
    const errs = { email: $('[data-err=email]', form), consent: $('[data-err=consent]', form), server: $('[data-err=server]', form) };
    const btnText = btn.textContent;
    let focused = false, sending = false;

    form.addEventListener('focusin', () => { if (!focused) { focused = true; track('form_focus', { position }); } });
    btn.addEventListener('click', () => track('cta_click', { position }));

    const clear = () => {
      Object.values(errs).forEach((e) => { e.hidden = true; });
      email.removeAttribute('aria-invalid'); consent.removeAttribute('aria-invalid');
    };
    const fail = (key, reason, focusEl) => {
      errs[key].hidden = false;
      if (focusEl) { focusEl.setAttribute('aria-invalid', 'true'); focusEl.focus(); }
      track('form_error', { reason, position });
    };

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (sending) return;
      clear();
      const val = email.value.trim();
      if (!EMAIL_RE.test(val)) return fail('email', 'invalid_email', email);
      if (!consent.checked) return fail('consent', 'consent_required', consent);

      sending = true; btn.disabled = true; btn.textContent = 'Odesílám…';
      track('form_submit', { position });
      const ctx = getContext();
      const body = { email: val, consent: true, website: hp.value, position, ...ctx };
      try {
        const res = await fetch(API_BASE + '/api/lead.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          track('form_success', { position });
          const wrap = form.closest('[data-form-wrap]');
          const box = document.createElement('div');
          box.className = 'form-success';
          box.setAttribute('role', 'status');
          box.textContent = 'PDF je na cestě do tvé schránky, obvykle dorazí do pár minut. Když ho nevidíš, mrkni do složky Spam nebo Promoce. Mezitím si můžeš v kalkulačce vyzkoušet jiný fond nebo jinou částku.';
          form.replaceWith(box);
          wrap.setAttribute('aria-live', 'polite');
          return;
        }
        const code = data.error || (res.status === 429 ? 'rate_limited' : 'server');
        if (code === 'invalid_email') fail('email', code, email);
        else if (code === 'consent_required') fail('consent', code, consent);
        else fail('server', code);
      } catch {
        fail('server', 'network');
      } finally {
        sending = false; btn.disabled = false; btn.textContent = btnText;
      }
    });
  });
}

/* ---------- Scroll hloubka ---------- */
function initScrollDepth() {
  const sent = { 50: false, 90: false };
  const check = () => {
    const doc = document.documentElement;
    const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
    for (const k of [50, 90]) {
      if (!sent[k] && pct >= k) { sent[k] = true; track(`scroll_${k}`); }
    }
    if (sent[50] && sent[90]) window.removeEventListener('scroll', check);
  };
  window.addEventListener('scroll', check, { passive: true });
}

/* ---------- Start ---------- */
initReveal();
initHero();
initForms();
initScrollDepth();
const c = getContext();
track('page_view', { utm_source: c.utm_source, utm_campaign: c.utm_campaign });
startCalc();
