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

## 4. Stránka
- ⬜ Texty, 2 verze reklamy, FAQ (copywriter / Sonnet)
- ⬜ Design: tmavý styl, karty se scroll-reveal animací (frontend / Sonnet)
- ⬜ Kalkulačka na stránce + graf
- ⬜ Formulář (e-mail + GDPR souhlas)

## 5. Backend a měření
- ⬜ `lead.php` – uložení kontaktu + e-mail s PDF (Resend)
- ⬜ PDF „srovnání + jak koupit z ČR“
- ⬜ `event.php` – měření průchodu stránkou (funnel)
- ⬜ Admin přehled funnelu za heslem

## 6. Server (192.168.1.200)
- ✅ Postup a konfigurace připraveny (`deploy/`)
- ✅ DNS `aijunior.opicebot.cz` → veřejná IP funguje
- ✅ SSH přístup ověřen (klíčem)
- ⬜ Instalace Apache, PHP, MariaDB
- ⬜ Certifikát Let's Encrypt + backend v HAProxy
- ⬜ Nasazení kódu, test zvenku
- ⬜ GitHub Pages zrcadlo

## 7. Odevzdání
- ⬜ README (cílovka, pořadí sekcí, konverze, A/B hypotézy, rozhodnutí, práce s AI)
- 🔄 `ai-log/errors.md` – kde se AI spletla (zatím 5 záznamů)
- ⬜ `ai-log/usage.md` – tokeny a cena
- ⬜ Export konverzací (`/export`) a kontrola, že v nich nejsou hesla
- ⬜ Test na mobilu + Lighthouse
- ⬜ Odeslat e-mail s odkazy
