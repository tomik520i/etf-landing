# Stav projektu

Průběžný přehled. Deadline odevzdání: **16. 10. 2026**.
Legenda: ✅ hotovo · 🔄 rozpracováno · ⬜ čeká

## 1. Základ
- ✅ Plán a rozdělení práce mezi modely (Opus / Sonnet / Haiku)
- ✅ Git repo, `.gitignore` jako první commit, zákaz čtení `.env` pro AI
- ✅ Pravidla pro AI (`CLAUDE.md`) a 5 podagentů (`.claude/agents/`)
- ✅ Veřejný GitHub: https://github.com/tomik520i/etf-landing

## 2. Data
- ✅ Měsíční ceny SPY, VOO, VT (adjusted close, Yahoo Finance)
- ✅ Kurz USD/CZK (ČNB, 2008–2026)
- ✅ Ověření proti emitentům – odchylka výnosů max. 0,05 p.b.
- ✅ TER, burza NYSE Arca, UCITS ekvivalenty, SPIVA 2025, daně
- ⬜ Dohledat číslo novely, která zrušila limit 40 mil. Kč (daně)

## 3. Kalkulačka
- ✅ Výpočet v Kč: pravidelná investice, kurz, dopad poplatků, projekce
- ✅ 19 automatických testů (`npm test`)
- ✅ Specifikace designu a rozhraní (`docs/design-a-rozhrani.md`)

## 4. Stránka
- ✅ Texty, 2 verze reklamy, FAQ, e-mail, zásady (copywriter / Sonnet + review)
- ✅ Design: tmavý styl, karty se scroll-reveal animací (frontend / Sonnet + review)
- ✅ Kalkulačka na stránce + graf, varianty reklamy A/B
- ✅ Formulář (e-mail + GDPR souhlas) – test proti API až na serveru

## 5. Backend a měření
- ✅ Analytická stránka podle zadání (/admin/, admin / admin) + end-to-end test měření
- ✅ Správce osobních údajů, kontakt, doba uložení
- ✅ `php -l` a test API na serveru
- ✅ Resend: doména ověřená, e-mail s PDF doručen
- ✅ `lead.php` – uložení kontaktu + e-mail s PDF (Resend)
- ✅ PDF „srovnání + jak koupit z ČR“ (4 strany)
- ✅ `event.php` – měření průchodu stránkou (funnel)
- ✅ Admin přehled funnelu za heslem

## 6. Server (192.168.1.200)
- ✅ Postup a konfigurace připraveny (`deploy/`)
- ✅ DNS `aijunior.opicebot.cz` → veřejná IP funguje
- ✅ SSH přístup ověřen (klíčem)
- ✅ Instalace Apache, PHP, MariaDB (skript 01, testy OK)
- ✅ Certifikát Let's Encrypt + backend v HAProxy (skript 02)
- ✅ Nasazení kódu, test zvenku – https://aijunior.opicebot.cz
- ✅ GitHub Pages zrcadlo – https://tomik520i.github.io/etf-landing/ (CORS ověřen)

## 7. Odevzdání
- ⬜ README (cílovka, pořadí sekcí, konverze, A/B hypotézy, rozhodnutí, práce s AI)
- 🔄 `ai-log/errors.md` – kde se AI spletla (zatím 17 záznamů)
- ⬜ `ai-log/usage.md` – tokeny a cena
- ⬜ Export konverzací (`/export`) a kontrola, že v nich nejsou hesla
- ⬜ Test na mobilu + Lighthouse
- ⬜ Odeslat e-mail s odkazy
