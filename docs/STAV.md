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
- 🔄 `ai-log/errors.md` – kde se AI spletla (zatím 27 záznamů + záznam neúspěšné simulace skla)
- ✅ `ai-log/usage.md` – tokeny a cena (ccusage)
- ✅ Export konverzace → [`ai-log/session-01/`](../ai-log/session-01/) (export přes aplikaci; zkontrolováno: bez hesel a klíčů, soukromé údaje a konfigurace jiných služeb vynechány)
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
- ✅ Na přání uživatele (Claude Code): plynulé rozbalování FAQ, 3D náklon karet fondů a SPIVA (náklon později odstraněn – viz bod 9)
- ✅ Nasazeno `b667f92` (záloha DB, kontroly, test měření VŠE OK)
- ✅ Ověření produkce (bez odesílání e-mailů a s blokovaným měřením, aby se neznečistila analytika):
  - `?ad=a` 1 365 315 Kč, `?ad=b` 1 608 004 Kč; fondy VT 1 163 047 / 1 021 112 (od 2011), VOO 1 371 440 = nezávislý výpočet
  - oba formuláře validují; FAQ plynule; náklon karet; `.env` a `_bootstrap.php` 403; admin 401 bez hesla; CORS jen pro GitHub Pages; TLS do 7. 1. 2027
  - měření + admin s reálnou DB: test na serveru (event.php → MariaDB → analytika, 9 kombinací filtrů, bez e-mailů ve stránce) – VŠE OK
  - Lighthouse mobil (produkce): **91 / 100 / 100 / 100**
  - GitHub Pages: nový design i interakce nasazené, PHP na zrcadle není
- ✅ Vysvětlení reklam A/B: [`docs/reklamy.md`](reklamy.md)
- ⬜ Neověřeno: admin vizuálně na produkci za heslem (ověřen přes CLI na serveru), plynulost skla a animací na reálném slabším telefonu

## 9. Design – 2. kolo: lom skla (Codex) + review a nasazení (Claude Code)
- ✅ **Design a iterace Liquid Glass: OpenAI Codex, GPT-6 Astra, reasoning effort Medium** – větev `codex/glass-optics` (`ede4b43`, `f0f7d32`, `673f6ff`, `9356013`)
  - CSS simulace lomu (`ede4b43`) byla trhavá → nahrazena knihovnou **Liquid Glass Canvas 0.1.0** (MIT, `public/js/vendor/`) přes `public/js/glass.js`; čiré sklo, plynulý lom svíček na hranách; náklon karet odstraněn
- ✅ Claude Code – review celého diffu proti `main`: knihovna = upstream (SHA-256), bez síťových volání a `eval`; WebGL jen pozadí, HTML zůstává; bez nečinné smyčky; fallbacky
- ✅ Claude Code – opravy: cache (`no-cache` pro HTML/CSS/JS/SVG + `?v=20261010`, errors #26), text licence MIT ke knihovně (#27)
- ✅ Claude Code – kontrola lokálně (Chrome s GPU NVIDIA/D3D11, měření bez odesílání eventů):
  - `?ad=a` 1 365 315 Kč, `?ad=b` 1 608 004 Kč; vklad 5 000 Kč (A) 3 413 287 Kč; poplatek 2 % 647 884 Kč; VT 2 552 781 Kč = nezávislý výpočet; graf se překresluje
  - oba formuláře validují, FAQ se plynule otevře/zavře, zásady OK, žádné chyby v konzoli
  - WebGL aktivní; fallback bez WebGL a s „omezit pohyb“ → CSS sklo; náklon karet odstraněn (`transform: none`)
  - plynulost (časy snímků): desktop scroll 2 snímky nad 33 ms, 0 nad 50 ms (CSS fallback max 125 ms); hover bez trhání; mobilní šířka ~3 snímky ~100 ms / 5 s scrollu (jen s WebGL, JS < 8 ms/snímek)
  - 19/19 testů; Lighthouse mobil lokálně: výkon 86 / 95 / 91 (3 běhy), přístupnost 100, best practices 100, SEO 100
- ✅ Sloučeno do `main` (`fcaaca8`), push, nasazeno (VŠE OK)
- ✅ Na přání uživatele (Claude Code): sklo o trochu tmavší kvůli čitelnosti – karta s WebGL 24 → 36 % krytí, box formuláře / UCITS 35 → 50 %, CSS fallback 35 → 44 %; verze odkazů `?v=20261010-2`
- ⬜ Nasazení ztmavení + ověření produkce

