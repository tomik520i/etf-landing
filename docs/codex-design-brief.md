# Zadání pro Codex: komplexnější design

**Úkol: jen vizuální design.** Žádná nová funkce, žádné změny textů, dat, výpočtů, měření ani serveru. Až budeš hotový, hlavní session (Claude Code) změny zreviewuje, otestuje a nasadí.

## Kontext projektu

- Konverzní landing page: kalkulačka „kolik by z 2 000 Kč měsíčně dnes bylo“ pro českého investora (25–40 let, přichází z reklamy na Instagramu/TikToku **na mobilu**, na stránce je pár sekund). Cíl stránky = e-mail za PDF.
- Živě: https://aijunior.opicebot.cz (`?ad=a`, `?ad=b`), repo https://github.com/tomik520i/etf-landing
- Hodnotí se: „Mohli bychom na to zítra pustit reklamu?“ – a **nesmí to vypadat jako generický AI výstup**.
- Aktuální design je funkční, ale jednoduchý. Specifikace současného stylu: [`docs/design-a-rozhrani.md`](design-a-rozhrani.md). Texty: [`content/texty.md`](../content/texty.md).

## Co chceme

**Moderní tmavý styl** s výraznější osobností a **obsahem v kartách, které se při scrollu postupně zobrazují / vyjíždějí** (scroll-reveal). Konkrétně:

- Silnější vizuální hierarchie: hero a **velké číslo výsledku kalkulačky** jsou dominanta stránky.
- Propracovanější karty: hloubka, jemné okraje/světla, hover stavy na desktopu, lepší rytmus mezer.
- Bohatší scroll-reveal: různé typy vstupu podle sekce (vyjetí, postupné odhalení položek v kartě, stagger u mřížek), ale decentně – finance, ne kryptoweb.
- Lepší kalkulačka: nastylované posuvníky, výběr fondu, výsledkové „dlaždice“ (vloženo / výnos / poplatek / kurz), graf v kartě s čitelnou legendou.
- Sekce SPIVA (pruhy) a fondy (3 karty) vizuálně zajímavější. FAQ s plynulým rozbalením.
- Konzistentní systém: design tokeny v CSS proměnných (barvy, mezery, rádiusy, stíny, easing, délky animací).

## Tvrdá omezení (porušení = změna se nepřijme)

1. **Jen soubory designu:** `public/css/style.css`, markup v `public/index.html` a `public/zasady.html` (struktura/třídy/obalové prvky), případně nové soubory v `public/css/` nebo `public/fonts/`. Volitelně styl `public/admin/index.php` (jen `<style>` a třídy, ne PHP logika ani SQL).
2. **Nesahat na:** `public/js/calc.js`, `public/js/track.js`, `public/api/**`, `public/data/**`, `public/pdf/**`, `config.php`, `deploy/**`, `scripts/**`, `tests/**`. `public/js/app.js` měnit jen pokud je to nutné pro animace – a pak jen přidat, neměnit existující logiku.
3. **Texty beze změny** – obsah je ověřený proti datům (každé číslo má zdroj). Nepřidávat čísla, tvrzení, recenze, loga médií, „počet spokojených investorů“ apod.
4. **Zachovat všechna ID a selektory, na kterých závisí JavaScript:**
   - ID: `hero-eyebrow`, `hero-h1`, `hero-sub`, `hero-podtext`, `hero-cta`, `kalkulacka`, `in-monthly`, `in-monthly-range`, `in-year`, `out-year`, `in-fee`, `out-fee`, `fund-SPY`, `fund-VOO`, `fund-VT` (`input[name=fund]`), `res-title`, `res-value-num`, `res-stats`, `chart`, `chart-wrap`, `legend`, `res-fx-note`, `res-warn`, `res-error`, `pdf`, `pdf-2`, `f1-*`, `f2-*`, `spiva`, `fondy`, `faq` (a ostatní `*-h2` kvůli `aria-labelledby`)
   - třídy/atributy: `form.lead-form` + `data-position`, `[data-form-wrap]`, `[data-err=email|consent|server]`, pole `name=email|consent|website` (website = honeypot, musí zůstat skryté mimo obrazovku), `button[type=submit]`
   - scroll-reveal: prvky `.reveal`, JS přidává `.is-visible`; `.funds` = mřížka se staggerem (`--reveal-delay`). Skrývat jen pod `html.js` (bez JS musí být vše vidět; `<head>` má pojistku, která po 3 s třídu `js` odebere).
   - JS generuje: `li.fee`, `li.fx`, `.form-success`, v SVG grafu `line.grid` a čáry s `stroke="var(--accent|--fee|--invested)"` → tyto CSS proměnné musí existovat.
5. **Výkon a přístupnost:** Lighthouse mobil zůstane **≥ 90 ve všech kategoriích** (teď 95/100/100/100). Žádný framework, žádné knihovny animací (jen CSS + IntersectionObserver, který už je). Fonty jen self-hosted (WOFF2 + licence). Kontrast WCAG AA, viditelný focus, cílové plochy ≥ 44 px.
6. **Animace:** jen `transform` a `opacity` (žádné animování layoutu), respektovat `prefers-reduced-motion: reduce` (vše hned vidět, bez pohybu). **Hero a kalkulačka se při načtení neanimují** (rychlé LCP).
7. **Mobile-first:** 375 px bez vodorovného posunu, první obrazovka na 390×844 = hero + začátek kalkulačky. Desktop od 900 px (kalkulačka ve 2 sloupcích, fondy ve 3).
8. **Zakázané klišé:** fialové/neonové gradienty přes plochu, glassmorphism, emoji v nadpisech, stock ilustrace, generické ikony „raketa / graf nahoru“.

## Jak to spustit a ověřit

```bash
python -m http.server 8765 --directory public
```
Pak http://localhost:8765/?ad=a a `?ad=b` (data se načítají fetchem, `file://` nestačí; POST na `/api/*` lokálně vrací 501 – to je v pořádku).

Před předáním zkontroluj: kalkulačka počítá (výchozí `?ad=b` = **1 608 004 Kč**, `?ad=a` = **1 365 315 Kč**), přepínání fondů, graf se překresluje při změně šířky, oba formuláře ukazují chyby validace, scroll-reveal funguje a s reduced-motion je vše hned vidět, `npm test` prochází (19 testů), Lighthouse mobil ≥ 90.

## Předání

- Pracuj ve větvi `design/codex`, malé commity s popisem (česky, např. `style: karty kalkulačky`).
- Na konci krátký soupis: co se změnilo, které soubory, screenshoty mobil + desktop, výsledek Lighthouse, a co jsi případně musel v `app.js` přidat a proč.
