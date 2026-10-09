# Design a rozhraní (zadání pro agenty frontend a backend)

Rozhodnutí hlavní session. Agenti se jich drží, odchylku nejdřív nahlásí.

## 1. Vizuální styl

**Charakter:** klidný tmavý „finanční nástroj“, ne kryptoweb. Hlavní je velké číslo výsledku. Dekorace jen tam, kde nese informaci.

### Barvy (CSS proměnné na `:root`)
| Token | Hodnota | Použití |
|---|---|---|
| `--bg` | `#0E1113` | pozadí stránky (grafit) |
| `--surface` | `#161A1D` | karty |
| `--surface-2` | `#1D2226` | vstupy, vnořené bloky |
| `--border` | `#2A3035` | 1px okraje karet |
| `--text` | `#ECE9E3` | text (teplá lomená bílá) |
| `--muted` | `#9BA1A6` | popisky, poznámky |
| `--accent` | `#F2A541` | peníze, výsledek, hlavní CTA (jantarová) |
| `--accent-ink` | `#1A1205` | text na jantarovém tlačítku |
| `--fee` | `#E8735A` | „kolik sežerou poplatky“ |
| `--invested` | `#6F7C85` | vložená částka v grafu |

Kontrast textu vůči pozadí musí splnit WCAG AA. Žádné gradienty přes celou plochu, žádný glassmorphism ani neon.

### Typografie
- Nadpisy a velká čísla: **Bricolage Grotesque** (Google Fonts, `latin-ext` kvůli češtině, `display=swap`, jen váhy 600 a 800).
- Text: systémový stack `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (rychlost).
- Čísla vždy `font-variant-numeric: tabular-nums`, formát `Intl.NumberFormat('cs-CZ')`, „1 608 004 Kč“.
- Výsledek kalkulačky: `clamp(2.5rem, 9vw, 4.5rem)`.

### Layout
- Mobile-first, jeden sloupec, boční okraj 16 px. Od 900 px max. šířka 1100 px a fondy ve 3 sloupcích.
- Obsah v **kartách**: `--surface`, 1px `--border`, `border-radius: 16px`, padding 20–28 px.
- Žádná navigace (landing page), jen malé logo/text vlevo nahoře.

### Scroll-reveal
- Karty pod první obrazovkou: start `opacity: 0; transform: translateY(24px)`, cíl `opacity: 1; transform: none`, 600 ms, `cubic-bezier(.2,.7,.2,1)`.
- Sourozenci v mřížce se zpožděním 80 ms (`--reveal-delay`).
- `IntersectionObserver`, `threshold: 0.15`, každá karta se odhalí jen jednou (potom `unobserve`).
- **Progressive enhancement:** skrývá se jen pod `html.js .reveal` (třídu `js` přidá inline skript v `<head>`). Bez JS je vše vidět.
- `@media (prefers-reduced-motion: reduce)`: žádná animace, vše hned vidět.
- **Hero a kalkulačka se neanimují** (LCP).

### Graf
Vlastní inline **SVG** bez knihovny (výkon). Tři čáry v čase:
- hodnota (`--accent`, 2.5 px)
- hodnota s poplatkem navíc (`--fee`, přerušovaná)
- vloženo (`--invested`, 1.5 px)

Osa Y v Kč (zkráceně „1,2 mil.“), osa X roky, legenda pod grafem. Graf musí mít `role="img"` a `aria-label` se shrnutím výsledku.

## 2. Pořadí sekcí (`index.html`)
1. hero (varianta podle `?ad=a|b`, jinak default)
2. kalkulačka (karta) s výsledkem + graf
3. CTA #1 (karta s formulářem)
4. proč pasivně (SPIVA)
5. fondy (3 karty)
6. CTA #2 (stejný formulář, jiný nadpis)
7. FAQ (`<details>`)
8. patička (zdroje, upozornění, správce dat)

Zásady zpracování: `public/zasady.html`, stejný styl.

## 3. Kalkulačka – UI ⇄ `js/calc.js`
`calc.js` je hotový a otestovaný (vlastní ho hlavní session), **neměnit**. UI je v `js/app.js`.

Vstupy:
| Pole | Prvek | Rozsah | Výchozí |
|---|---|---|---|
| Měsíční vklad | range + number | 500–20 000 Kč, krok 500 | 2 000 |
| Investuju od roku | range | od prvního celého roku fondu (s kurzem ČNB od 2008) do aktuálního roku − 1 | 2010 |
| Fond | segmentované tlačítko | SPY, VOO, VT | SPY |
| Poplatek navíc | range | 0–2,5 % ročně, krok 0,1 | 1,0 |

Výpočet: `years = (počet měsíců od ledna zvoleného roku do posledního měsíce dat) / 12` → `backtest(alignSeries(prices, fx), { monthlyCzk, years, extraFeePct })`.

Výsledek je vidět **hned po načtení** s výchozími hodnotami a přepočítá se při každé změně (`requestAnimationFrame`). Zobrazuje se:
- velké číslo `value`
- vloženo, zisk, kolik stojí poplatek navíc (`feeCost`), kurzový efekt (`fxEffect`, znaménko a vysvětlení), období `from`–`to`

Data: `data/prices/<TICKER>.json`, `data/fx/usdczk.json`, `data/funds.json`, `data/meta.json`. Načíst paralelně, fond až při výběru (SPY hned).

## 4. Měření – `js/track.js`
```js
track(event, props = {})   // globální funkce
```
- `session_id`: `crypto.randomUUID()` v `sessionStorage` (klíč `lp_sid`), žádné cookies.
- `ad_variant`: `a` / `b` / `null` z `?ad=`; `utm_source`, `utm_campaign` z URL (uložit do `sessionStorage`).
- Odeslání: `navigator.sendBeacon(API_BASE + '/api/event.php', new Blob([JSON.stringify(payload)], { type: 'text/plain' }))`.
- Payload: `{ session_id, event, ad_variant, props }`.
- `API_BASE`: `''` na vlastní doméně, `'https://aijunior.opicebot.cz'` když `location.hostname.endsWith('github.io')`.

Eventy: `page_view` (props: utm), `scroll_50`, `scroll_90`, `calc_interact` (jen první změna), `calc_result_viewed` (výsledek ve viewportu po interakci, jednou), `cta_click` (`{position: 1|2}`), `form_focus` (jednou na formulář), `form_submit`, `form_success`, `form_error` (`{reason}`).

## 5. Formulář ⇄ `api/lead.php`
Request: `POST`, `Content-Type: application/json`
```json
{ "email": "…", "consent": true, "website": "", "position": 1,
  "ad_variant": "a", "utm_source": "…", "utm_campaign": "…" }
```
- `website` = honeypot (skryté pole, `tabindex="-1"`, `autocomplete="off"`). Vyplněné → server vrátí `{ "ok": true }` a nic neuloží.
- Odpověď: `200 { "ok": true }` | `400 { "ok": false, "error": "invalid_email" | "consent_required" }` | `429 { "ok": false, "error": "rate_limited" }` | `500 { "ok": false, "error": "server" }`.
- Duplicitní e-mail = `200 { "ok": true }`.
- Po úspěchu se formulář na místě nahradí stavem úspěchu (`aria-live="polite"`).

## 6. Výkon a dostupnost
- Lighthouse mobil ≥ 90 ve všech kategoriích.
- Žádný framework ani knihovna. CSS v jednom souboru, JS jako ES moduly (`type="module"`).
- `<html lang="cs">`, labely u všech polí, viditelný focus (`--accent` outline), cílové plochy ≥ 44 px.
- Meta: title, description, OG, `theme-color` `#0E1113`, favicon jako inline SVG.
