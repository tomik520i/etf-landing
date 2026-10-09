# ETF kalkulačka – konverzní landing page

Landing page pro českého drobného investora: kalkulačka „kolik by z mých vkladů dnes bylo“ na skutečných historických datech, srovnání ETF z NYSE (Arca) s jejich UCITS ekvivalenty, které jde reálně koupit z ČR, a PDF návod za e-mail.

| | |
|---|---|
| **Web** | https://aijunior.opicebot.cz (varianty reklamy: [`?ad=a`](https://aijunior.opicebot.cz/?ad=a), [`?ad=b`](https://aijunior.opicebot.cz/?ad=b)) |
| **Analytika** | https://aijunior.opicebot.cz/admin/ – přihlášení `admin` / `admin` (záměrně veřejné: jen souhrnná čísla, žádné e-maily ani osobní údaje) |
| **Zrcadlo** | https://tomik520i.github.io/etf-landing/ – statika na GitHub Pages; formulář a měření posílá přes CORS na vlastní server |
| **Reklamy** | [`content/texty.md`](content/texty.md), sekce `reklamy` (verze A a B) |
| **AI log** | [`ai-log/`](ai-log/) – exporty konverzací, [kde se AI spletla](ai-log/errors.md), [tokeny a cena](ai-log/usage.md) |
| **Průběh** | [`docs/STAV.md`](docs/STAV.md) |

---

## Cílová skupina a výměna hodnoty

**Kdo:** Čech 25–40 let, má pár tisíc měsíčně navíc, slyšel o ETF, neví kde začít, bojí se poplatků a toho, že „to podělá“. Přichází z reklamy na Instagramu/Facebooku/TikToku, **na mobilu**, a na stránce je pár sekund.

**Co dostane zdarma, bez e-mailu:** kalkulačku s výsledkem hned v první obrazovce. Kolik by měl dnes, kdyby od roku X dával Y Kč měsíčně do S&P 500 nebo do celého světa: v korunách, s kurzem ČNB, s dividendami a s tím, **kolik by ho stál poplatek navíc**.

**Co dostane za e-mail:** 4stránkové PDF *Srovnání ETF a jak je koupit z Česka*: tabulka SPY/VOO/VT, UCITS ekvivalenty s ISIN, postup nákupu v 8 krocích, daně (časový a hodnotový test), statistika SPIVA.

**Kdy o kontakt žádám:** až **po výsledku kalkulačky** (CTA #1 hned pod ní), kdy návštěvník viděl svoje číslo a je nejvíc „nahřátý“. Druhá šance (CTA #2) přichází po argumentech pro ty, kdo váhají. Formulář má 1 pole + souhlas.

## Pořadí sekcí a proč

| # | Sekce | Proč tady |
|---|---|---|
| 1 | **Hero** navazující 1:1 na reklamu (`?ad=a/b`) | Message match: návštěvník vidí stejnou otázku i stejné číslo jako v reklamě. Kalkulačka startuje ve stejném scénáři. |
| 2 | **Kalkulačka** s grafem | Hodnota hned v první obrazovce, bez e-mailu (zadání to chce). Výsledek je vizuální dominanta. |
| 3 | **CTA #1** – PDF za e-mail | Moment nejvyššího zájmu: právě viděl svůj výsledek. |
| 4 | **Proč pasivně** (SPIVA) | Pro váhající: 79 % aktivních fondů za 1 rok, 93 % za 20 let zaostalo za S&P 500. |
| 5 | **Fondy** + co koupíš z ČR | Odpovídá na hlavní námitku („tohle stejně nekoupím“) a zároveň je to výtah z PDF. |
| 6 | **CTA #2** | Pro ty, kdo dočetli. Jiný nadpis, stejný formulář. |
| 7 | **FAQ** | Daně, minimum, propad trhu, „je to doporučení?“ – poslední námitky. |
| 8 | **Patička** | Zdroje dat s datem, upozornění, správce údajů. |

Žádná navigace: landing page má jeden cíl.

## Očekávaná konverze

**Odhad: 2–6 % návštěva → e-mail, střed 3,5 %.** Rozbor zdrojů je v [`docs/benchmark-konverze.md`](docs/benchmark-konverze.md).

- **Kotva:** Unbounce Conversion Benchmark Report (CBR 2024) uvádí medián landing pages v oboru *investing* **3,9 %**. Pro financial services celkem je to 8,3 % a pro paid social 9,3 % (napříč obory). Unbounce konverzi nedefinuje a měří stránky z vlastního nástroje, takže jde spíš o horní hranici.
- **Proč spíš spodní polovina:** finance mají nízkou důvěru, provoz je studený z reklamy, návštěvník je na mobilu, doména je nová a formulář obsahuje souhlas se zpracováním údajů.
- **Proč ne úplně dole:** hodnota (výsledek kalkulačky) je před formulářem a formulář má jen jedno pole.
- **Přímý benchmark pro přesně tuto kombinaci jsem nenašel.** Rozsah je můj úsudek odvozený ze zdrojů, ne číslo převzaté ze zdroje.
- **Jak s tím pracovat:** pod 2 % hledat chybu (nabídka, rychlost, tření). Nad 6 % ověřit kvalitu leadů a měření. Po ~1 000 návštěvách odhad nahradit vlastními čísly z analytiky.

## 3 hypotézy na A/B test (podle očekávaného dopadu)

1. **Výsledek kalkulačky zdarma vs. částečně zamčený za e-mail** (např. graf a dopad poplatků až po e-mailu). *Největší dopad:* mění samotnou výměnu hodnoty. Zamčení pravděpodobně zvedne počet e-mailů, ale sníží jejich kvalitu a důvěru. Měřit konverzi i odhlášení a otevření PDF.
2. **Hero navazující na reklamu vs. obecný hero.** *Střední dopad:* message match ovlivňuje odchody v prvních sekundách. Je to připravené: `?ad=a/b` vs. bez parametru. V analytice je srovnání A/B se z-testem a 95% intervalem.
3. **Jen e-mail vs. e-mail + jméno.** *Menší dopad:* každé pole navíc obvykle snižuje konverzi, jméno ale umožní osobnější follow-up. Malý rozdíl potřebuje hodně provozu, proto je až třetí.

## Rozhodnutí v nejasných bodech zadání

- **NYSE vs. co Čech reálně koupí.** Porovnávám ETF z **NYSE Arca** (SPY, VOO, VT; burza skupiny NYSE, kde se velká ETF obchodují; QQQ je na Nasdaqu, proto ho vynechávám). Mají nejdelší historii dat. Čech je ale přes evropského brokera **nekoupí** (PRIIPs: chybí klíčový informační dokument), proto u každého ukazuji **UCITS ekvivalent** (SXR8/CSPX, VUAA, VWCE). VWCE je označený jako *nejbližší*, ne stejný fond (jiný index, vyšší TER).
- **Historie místo „real-time“ a místo předpovědi.** Data jsou stažená jednou skriptem do JSON se zdrojem a datem. Stránka tak nemá API klíče, nemůže spadnout kvůli limitům a každé číslo jde ověřit. Kalkulačka ukazuje, co **by bylo**, ne co **bude**.
- **Vlastní hosting místo Vercelu.** Vlastní Ubuntu server: HAProxy (TLS, Let's Encrypt) → Apache + PHP-FPM → MariaDB. Leady zůstávají u mě, měření je first-party, nejsou vendor limity a je vidět DevOps část. Riziko výpadku domácí infrastruktury kryje zrcadlo na GitHub Pages (kalkulačka funguje vždy, formulář jen při běžícím serveru).
- **Vlastní měření místo PostHogu.** Eventy jdou do vlastní DB: bez cookies, bez IP adres, takže není potřeba cookie lišta a měření neblokují adblockery. Analytika pokrývá funnel, A/B se z-testem, scroll, pozice CTA, chyby formuláře, UTM zdroje a trend.
- **E-mail přes Resend API.** Je to jeden vyžádaný e-mail s odkazem na PDF (ne příloha), odesílaný z ověřené domény, s odkazem na odhlášení.
- **Tykání.** Cílovka 25–40 let přichází z reklamy na sociálních sítích. Vykání by působilo jako banka a zvětšovalo by odstup u tématu, kterého se lidé bojí.

## Jak jsem pracoval s AI

**Nástroje:** plán v claude.ai chatu ([záznam](ai-log/00-planovani-claude-chat.md)), implementace v Claude Code.

**Rozdělení práce podle modelů** (definice agentů s přesnými pokyny jsou v [`.claude/agents/`](.claude/agents/)):

| Kdo | Model | Co dělal |
|---|---|---|
| Hlavní session | Opus | Architektura, specifikace ([`docs/design-a-rozhrani.md`](docs/design-a-rozhrani.md)), **výpočetní jádro kalkulačky**, review každého výstupu, bezpečnost, nasazení a skripty pro server, integrace |
| data-fetcher | Haiku | Skripty pro stažení cen (Yahoo, adjusted close) a kurzů (ČNB) |
| testy | Haiku | 19 testů kalkulačky; výpočet ověřují nezávisle (ruční příklady, uzavřený vzorec anuity) |
| data-verifier | Sonnet | TER, burza, UCITS ekvivalenty, SPIVA, daně – jen z načtených primárních zdrojů |
| copywriter | Sonnet | Texty stránky, 2 reklamy, e-mail, zásady, obsah PDF |
| frontend / backend | Sonnet | HTML/CSS/JS, PHP API, analytická stránka |

**Pravidla pro agenty** ([`CLAUDE.md`](CLAUDE.md)): žádné číslo bez zdroje (jinak `NENALEZENO`), `.env` nikdy nečíst (vynuceno i v [`.claude/settings.json`](.claude/settings.json)), prepared statements, žádný „AI“ design, nic nespouštět na serveru bez potvrzení.

**Jak jsem kontroloval výstup:**
- **Data proti emitentům:** spočítané výnosy SPY/VOO/VT se od oficiálních výnosů State Street a Vanguard liší max. o **0,05 p.b.**
- **Testy:** `npm test` (19 testů), ověření na reálných datech, kontrola, že agent opravdu běžel na Haiku (log: `claude-haiku-5-5`).
- **Review každého výstupu agenta:** texty proti datům, kód proti specifikaci a bezpečnosti, web v prohlížeči (mobil 375 px, desktop, obě varianty reklamy).
- **Server:** úpravy produkčního `haproxy.cfg` nejdřív nanečisto na kopii; skripty se zálohou a automatickým vrácením.
- **End-to-end test měření** ([`smoke-analytics.sh`](deploy/server/smoke-analytics.sh)): testovací návštěva přes API → DB → analytika, po sobě uklidí.
- **Lighthouse (mobil):** výkon 95, přístupnost 100, best practices 100, SEO 100.

**Kde se AI spletla:** 19 záznamů v [`ai-log/errors.md`](ai-log/errors.md). Výběr:
- **Plán z chatu:** neúplná daňová pravidla (limit 40 mil. Kč od 2026 neplatí), VWCE jako „stejný“ fond jako VT, zastaralé verze GitHub Actions.
- **Copywriter:** neověřené tvrzení („nejstarší ETF“) a slib e-mailové série, která neexistuje.
- **Backend:** odhlášení na GET (spustil by ho skener odkazů), jakákoli DB chyba se tvářila jako duplicita.
- **Já (Opus):** reklama A slibovala jiné číslo, než ukázala kalkulačka. `sed` by rozbil produkční HAProxy (zachyceno simulací). Ceník tokenů jsem dosadil z paměti a byl špatně.

**Tokeny a cena:** [`ai-log/usage.md`](ai-log/usage.md). Session-01 stála ~15 USD (odhad podle ccusage). Opus ~87 %, ačkoli většinu psaní udělali agenti na Sonnetu a Haiku.

## Technicky

- **Frontend:** statické HTML/CSS + vanilla JS (ES moduly), vlastní SVG graf bez knihovny, self-hosted font, scroll-reveal s ohledem na `prefers-reduced-motion`.
- **Data:** [`public/data/`](public/data/) – měsíční adjusted close (Yahoo Finance), kurz USD/CZK (ČNB), parametry fondů a SPIVA se zdroji. Obnova: `npm run fetch-data`.
- **Backend:** PHP 8.3 + PDO (prepared statements), MariaDB s uživatelem jen `SELECT, INSERT`, honeypot, rate limit bez ukládání IP, CORS jen pro GitHub Pages.
- **Konfigurace:** v `.env` (vzor v [`.env.example`](.env.example)). Leží mimo document root a Claude Code má čtení `.env` zakázané.
- **Nasazení:** [`deploy/server/`](deploy/server/) – instalace, TLS + HAProxy, aktualizace s testem; [`deploy/INSTALL.md`](deploy/INSTALL.md).
- **Testy:** `npm test`

## Co chybí / známá omezení

- **Design projde ještě jedním kolem** (komplexnější vizuál), viz poslední bod v [`docs/STAV.md`](docs/STAV.md).
- **Výstupní tokeny podagentů** jsou v lokálních logách podhodnocené, takže cena agentů je dolní odhad.
- **Číslo novely**, která zrušila daňový limit 40 mil. Kč, se nepodařilo dohledat. Na stránce ani v PDF limit proto není.
- **SPIVA PDF:** oficiální web S&P vracel 403, čísla jsou z kopie stejného PDF reportu (uvedeno v `public/data/spiva.json`).
- **Výpadek serveru:** při výpadku domácího serveru na zrcadle nefunguje formulář ani měření.
- **Odhad konverze** zatím není ověřený vlastním provozem.
