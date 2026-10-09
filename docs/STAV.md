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
- ✅ Design: první verze tmavý styl (frontend / Sonnet); finální Liquid Glass – viz bod 8
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
- ✅ README (cílovka, pořadí sekcí, konverze se zdroji, A/B hypotézy, rozhodnutí, práce s AI)
- 🔄 `ai-log/errors.md` – kde se AI spletla (zatím 25 záznamů)
- ✅ `ai-log/usage.md` – tokeny a cena (ccusage)
- ⬜ Export konverzací (`/export`) a kontrola, že v nich nejsou hesla – dělá uživatel
- ✅ Test na mobilu + Lighthouse (mobil 95 / 100 / 100 / 100)
- ⬜ Odeslat e-mail s odkazy

## 8. Design – Codex (poslední bod)
- ✅ Zadání Codexu [`docs/codex-design-brief.md`](codex-design-brief.md); uživatel ho během práce upravil: **Liquid Glass, tradingové pozadí se zelenými a červenými svíčkami, bez vyjíždění karet**
- ✅ Design vytvořil **OpenAI Codex, GPT-6 Astra, reasoning effort Medium** – větev `design/codex` (`40547b9`, `69ec4a5`, `5c0413f`)
- ✅ Claude Code: review diffu (jen CSS/SVG/hlavičky HTML/styl adminu, logika beze změny), oprava přístupnosti šipky v tlačítku
- ✅ Claude Code: kontrola lokálně – 19/19 testů; `?ad=a` 1 365 315 Kč, `?ad=b` 1 608 004 Kč; přepínání fondů = nezávislý výpočet; oba formuláře validují; honeypot skrytý; 375 px bez přetečení; text nad pozadím čitelný
- ✅ Lighthouse mobil lokálně: 95 / 100 / 96 / 100 (96 = chyby 501 z lokálního serveru bez PHP)
- ✅ Pravidla a dokumentace aktualizované (CLAUDE.md, design-a-rozhrani.md, frontend agent, README, errors, usage)
- ✅ Nasazení posíleno: záloha DB + automatický návrat (`03-update.sh`), ruční návrat (`04-rollback.sh`)
- ✅ Sloučení do `main` (`c5c2aab`), push, GitHub Pages
- ✅ 1. nasazení: test měření „selhal“ kvůli chybě parseru v testu → **automatický návrat** na předchozí verzi zafungoval (errors #23); po opravě nasazeno `48c68c4`, VŠE OK
- ✅ Na přání uživatele (Claude Code): plynulé rozbalování FAQ, 3D náklon karet fondů a SPIVA za kurzorem s odleskem, jemné zvednutí ostatních karet – jen myš, ne dotyk; s „omezit pohyb“ vypnuto
- ⬜ Nasazení interakcí + ověření produkce (web, formuláře, měření, admin, Lighthouse, Pages)
