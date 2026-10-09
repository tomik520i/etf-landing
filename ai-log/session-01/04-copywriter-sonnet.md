# Session 01 – agent 04-copywriter-sonnet

Čitelný přepis exportu z Claude Code (desktopová aplikace, `/export` v ní není – export přes menu session). Výsledky nástrojů jsou zkrácené na 1500 znaků, obrázky a stažené PDF nejsou součástí. Bloky uvažování modelu nejsou součástí přepisu.

---

## 👤 Uživatel · 2026-10-09 18:14:51

Pracovní adresář: C:\Users\Administrator\Desktop\junior_ai_developer. Přečti CLAUDE.md, .claude/agents/copywriter.md (jsi agent copywriter a řídíš se jím), docs/zadanie-B-poznamky.md (sekce 2 a 11), docs/overeni-fakta.md, public/data/funds.json, public/data/spiva.json.

Úkol: napiš všechny texty landing page do jednoho souboru content/texty.md. Nic jiného nevytvářej, necommituj, nečti .env.

POUŽITELNÁ ČÍSLA (spočítaná hlavní session z ověřených dat, nic jiného si nevymýšlej):
- Data k 09/2026, ceny Yahoo Finance (adjusted close = s reinvestovanými dividendami), kurz ČNB.
- Příběh B (SPY, S&P 500): 2 000 Kč měsíčně od 01/2010 do 09/2026 → vloženo 402 000 Kč, hodnota 1 608 004 Kč. Kdyby fond stál o 1 % ročně víc: 1 434 656 Kč, tj. poplatek by stál 173 348 Kč.
- Šok z poplatků A (SPY, posledních 15 let, 10/2011–09/2026, 2 000 Kč měsíčně): vloženo 360 000 Kč, hodnota 1 190 617 Kč, 1% poplatek navíc by stál 111 917 Kč.
- TER: SPY 0,0945 %, VOO 0,03 %, VT 0,06 %; UCITS: SXR8/CSPX 0,07 %, VUAA 0,07 %, VWCE 0,14 % (VWCE je „nejbližší“ ekvivalent VT, ne stejný fond – jiný index).
- SPIVA U.S. Year-End 2025: aktivní large-cap fondy zaostávající za S&P 500 – 1 rok 78,78 %, 5 let 88,96 %, 10 let 85,59 %, 15 let 89,93 %, 20 let 92,89 %.
- Daně dle docs/overeni-fakta.md (časový test 3 roky, hodnotový test 100 000 Kč). Limit 40 mil. Kč NEZMIŇUJ (zrušen, novela neověřena).
Minulé výnosy nezaručují budoucí – u každého historického čísla napiš, že jde o historii a za jaké období. Čísla zaokrouhluj srozumitelně („zhruba 1,6 milionu“) a přesnou hodnotu dej do poznámky/podtextu.

STRUKTURA (každá sekce = nadpis `## id-sekce`, pod ním pojmenovaná pole `**pole:** text`, ať se dají snadno přenést do HTML):
1. `meta` – title (≤ 60 znaků), description (≤ 155), og_title, og_description
2. `hero-a` (reklama A, šok z poplatků) a `hero-b` (reklama B, příběh 2 000 Kč od 2010) – každý: eyebrow (≤ 5 slov), h1 (≤ 9 slov, 1:1 navazuje na reklamu), sub (≤ 25 slov), cta (≤ 4 slova, scroll na kalkulačku)
3. `hero-default` – obecná varianta bez parametru ?ad
4. `kalkulacka` – nadpis, krátký úvod (1 věta), labely polí (měsíční vklad v Kč, kolik let zpět / období, fond, poplatek navíc), texty výsledku se zástupnými symboly {vlozeno}, {hodnota}, {poplatek}, {kurz_efekt}, {od}, {do}, vysvětlení kurzového efektu (1 věta, kladný i záporný případ), poznámka k metodice (2–3 věty: adjusted close, kurz ČNB, bez daní a poplatků brokera)
5. `cta-1` – nadpis, co dostane (PDF „Srovnání ETF + jak je koupit z ČR krok za krokem“: konkrétně 3–4 odrážky), label e-mailu, placeholder, text souhlasu GDPR (se zástupcem {{SPRAVCE}} a odkazem na zásady), tlačítko, mikrotext pod tlačítkem (žádný spam, odhlášení jedním klikem)
6. `form-stavy` – úspěch (na stejné stránce: „PDF je na cestě“ + co dál, 2–3 věty), chyba (obecná), neplatný e-mail, chybějící souhlas
7. `proc-pasivne` – nadpis, 2–4 věty s čísly SPIVA, popisek zdroje
8. `fondy` – nadpis, úvod (1–2 věty: proč porovnáváme NYSE ETF a ukazujeme UCITS, které jde koupit z ČR – vysvětli PRIIPs lidsky, bez zkratky v nadpisu), pro každý fond SPY/VOO/VT: krátký popis (1 věta, co to je), label „Co koupíš z ČR“ + 1 věta k UCITS ekvivalentu
9. `cta-2` – jiný nadpis než cta-1 (pro ty, co dočetli až sem), jinak stejný formulář
10. `faq` – 5–6 otázek: Můžu tyhle ETF koupit z ČR? Jak je to s daněmi? Kolik potřebuju na začátek? (bez nepodložených čísel brokerů – piš obecně), Co když trh spadne? (historie: použij jen fakta, která máš, např. že SPIVA/data jsou historie; nepiš konkrétní propady bez čísla z dat → {{ZDROJ?}}), Proč ne bitcoin / jednotlivé akcie? (krátce, bez strašení), Je to investiční doporučení? – odpovědi max. 60 slov
11. `paticka` – zdroje dat s datem (Yahoo Finance, ČNB, emitenti, SPIVA, justETF), „Minulé výnosy nezaručují budoucí výnosy“, „Nejedná se o investiční doporučení…“, správce dat {{SPRAVCE}}, odkaz na zásady
12. `zasady` – krátké zásady zpracování osobních údajů (účel: zaslání PDF a navazujících e-mailů, právní základ souhlas, doba uložení, práva, žádné cookies, měření bez osobních údajů) – max. 200 slov, {{SPRAVCE}} a {{KONTAKT}} jako zástupci
13. `email` – e-mail s PDF: předmět (≤ 50 znaků), text (≤ 120 slov, tykání, odkaz {pdf_url}, odhlášení {unsubscribe_url})
14. `reklamy` – finální texty obou reklam (A, B) pro IG/FB: primární text (≤ 125 znaků), nadpis (≤ 40), popis (≤ 30), CTA tlačítko; plus 1 věta zdůvodnění, proč hero na ně navazuje
15. `zduvodneni` – 5–8 odrážek: klíčová rozhodnutí v textech (tykání, proč takové CTA, proč čísla zaokrouhlená, čemu ses vyhnul)

Tón: tykání, krátké věty, konkrétní, klidný, žádné „zbohatni“, žádné vykřičníky v nadpisech, žádné emoji, žádné AI fráze. Nadpisy sekcí nesmí znít jako šablona („Proč si vybrat nás“, „Odemkni“, „Revoluce“).

Vrať: cestu k souboru, počet slov celkem a seznam všech zástupců {{…}} / {{ZDROJ?}}, které jsi musel použít.

---

## 👤 Uživatel · 2026-10-09 18:14:51

<system-reminder>
Your final report is delivered through SubagentHandback: when your work is complete, call SubagentHandback({message: <your full report>}). The call ends your run, so make it your last step. Only a SubagentHandback call reaches your caller as your result; plain text you write at the end is not delivered.
</system-reminder>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\CLAUDE.md"
}
```

<details><summary>výsledek nástroje</summary>

```
1	# CLAUDE.md – pravidla projektu
2	
3	Konverzní landing page pro českého drobného investora: kalkulačka „kolik budu mít za X let“ se srovnáním ETF z NYSE (vč. NYSE Arca) a jejich UCITS ekvivalentů, lead za PDF srovnání + návod na nákup z ČR.
4	
5	Detailní plán: `docs/zadanie-B-poznamky.md`. Kde se liší od rozhodnutí níže, **platí tento soubor**.
6	
7	## Rozhodnutí (aktuální, přebíjí poznámky)
8	- Doména: **aijunior.opicebot.cz** (ne etf.opicebot.cz)
9	- Vše na Ubuntu serveru **192.168.1.200**: HAProxy (TLS, Let's Encrypt) → **Apache na 127.0.0.1:8081** + PHP-FPM → **MariaDB na 127.0.0.1**. Server .175 / nginx se nepoužívá.
10	- E-mail: **Resend SMTP**
11	- Zrcadlo statiky: GitHub Pages, API přes CORS na aijunior.opicebot.cz
12	- Design: moderní **tmavý** styl, obsah v kartách se **scroll-reveal** animací
13	- Jazyk webu: čeština, **tykání**
14	
15	## Struktura
16	'''
17	public/        document root (index.html, css/, js/, data/, api/*.php, admin/)
18	config.php     načítá .env – leží MIMO public/
19	scripts/       Node skripty pro stažení dat → public/data/*.json
20	deploy/        Apache vhost, HAProxy snippet, schema.sql, INSTALL.md
21	ai-log/        exporty session, errors.md, usage.md
22	docs/          plánovací poznámky
23	.claude/agents definice podagentů
24	'''
25	
26	## Tvrdá pravidla
27	1. **Tajné údaje:** `.env` nikdy nečti, nevypisuj, necommituj. Hesla/klíče nepiš do kódu, logů ani chatu. Vzor je v `.env.example`.
28	2. **Data:** žádné číslo si nevymýšlej ani „nepa
… [zkráceno, celkem 3291 znaků]
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\.claude\\agents\\copywriter.md"
}
```

<details><summary>výsledek nástroje</summary>

```
1	---
2	name: copywriter
3	description: Píše české texty landing page, dvě verze reklamy a FAQ pro cílovku 25–40 let. Použij pro jakýkoli text, který uvidí návštěvník.
4	model: sonnet
5	tools: Read, Write, Edit, Glob
6	---
7	Jsi konverzní copywriter pro český trh.
8	
9	Cílovka: 25–40 let, pár tisíc měsíčně navíc, slyšeli o ETF, nevědí kde začít, bojí se poplatků a „nechci to podělat“. Přichází z reklamy na mobilu, na stránce jsou pár sekund.
10	
11	Pravidla:
12	- Česky, **tykání**, krátké věty, konkrétní čísla místo přídavných jmen.
13	- Žádné „zbohatni rychle“, žádné sliby výnosů, žádné generické AI fráze („odemkni svůj potenciál“, „v dnešním rychlém světě“), žádné emoji v nadpisech.
14	- Každé číslo v textu musí existovat v `public/data/` nebo mít zdroj – jinak ho nepiš, dej placeholder `{{ZDROJ?}}`.
15	- Hero má dvě varianty navazující 1:1 na reklamu: A = šok z poplatků, B = konkrétní příběh (2 000 Kč měsíčně do S&P 500).
16	- Povinné texty: „Minulé výnosy nezaručují budoucí výnosy“, „Nejedná se o investiční doporučení“.
17	
18	Výstup ukládej do `content/` jako Markdown nebo JSON podle zadání a vrať krátké zdůvodnění hlavních formulací.
19	
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\docs\\overeni-fakta.md"
}
```

<details><summary>výsledek nástroje</summary>

```
1	# Ověření faktů (data-verifier, 2026-10-09)
2	
3	Každé tvrzení má zdroj načtený v době ověření. Co nešlo načíst, je označeno NENALEZENO. Nejde o právní ani investiční poradenství.
4	
5	## 1. PRIIPs / KID – proč běžný retail investor v EU/ČR nekoupí US ETF
6	
7	- Nařízení PRIIPs vyžaduje u každého balíčkového investičního produktu prodávaného retailovým investorům Klíčový informační dokument (KID). Platí od začátku roku 2018.
8	- Americké ETF (SPY, VOO, VT) KID pro EU nevydávají, proto je EU brokeři retailovým klientům neumožní koupit. justETF: stávající držitelé mohou držet nebo prodat, ale „won’t be able to buy more until a PRIIPs compatible KID becomes available“.
9	- Česká zkušenost: při pokusu o nákup se zobrazí hláška „This product is unavailable to clients classified as retail clients.“
10	- Nejde o zákaz vlastnit, ale o distribuční omezení na straně brokera. Výjimky mohou existovat u klientů klasifikovaných jako profesionální (podle brokera, neověřeno u konkrétního brokera).
11	- UCITS ETF (irský domicil) KID mají, proto jdou koupit z ČR.
12	
13	Zdroje:
14	- justETF, „US-domiciled ETFs: why they are no longer available from many online brokers“ (článek z 28. 3. 2018): https://www.justetf.com/en/news/etf/us-domiciled-etfs.html
15	- Finhacker.cz (článek z 13. 8. 2020, uvádí, že omezení platí od začátku 2018): https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast
16	
17	Omezení ověření: oba zdroje jsou starší (2018, 2020). Primární předpis (
… [zkráceno, celkem 5946 znaků]
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\docs\\zadanie-B-poznamky.md"
}
```

<details><summary>výsledek nástroje</summary>

```
1	# Zadání B – Konverzní landing page (ETF pro českého drobného investora)
2	
3	Pracovní poznámky. Deadline: **16. 10. 2026** (odpověď na e-mail Mateje Lörince, Clientelo).
4	
5	> Plánovací poznámky vytvořené v Claude chatu před začátkem implementace. Jak vznikly: `ai-log/00-planovani-claude-chat.md`.
6	
7	---
8	
9	## 1. Co zadání reálně chce (checklist)
10	
11	**Odevzdává se:**
12	- [ ] Odkaz na veřejný GitHub repozitář
13	- [ ] URL nasazené stránky (vlastní infra, zrcadlo frontendu na GitHub Pages)
14	- [ ] V repu: obě verze reklamy, kód s **průběžnou historií commitů** (ne jeden mega commit na konci)
15	- [ ] Složka `ai-log/` s exportem konverzací z Claude Code (příkaz `/export`)
16	- [ ] README
17	
18	**README musí obsahovat:**
19	- [ ] Jak jsem pracoval s AI: jaké pokyny dostali agenti, jak jsem kontroloval jejich výstup, **kde se spletli**
20	- [ ] Cílovou skupinu, co návštěvník dostane za kontakt a v jakém momentu o něj žádám
21	- [ ] Zdůvodnění pořadí sekcí
22	- [ ] Očekávanou konverzi (a z čeho odhad vychází)
23	- [ ] 3 hypotézy na A/B test seřazené podle očekávaného dopadu
24	- [ ] Rozhodnutí v nejasných bodech zadání + proč (NYSE vs UCITS, vlastní hosting místo Vercelu, vlastní měření)
25	- [ ] Co v řešení chybí (pokud něco nestihnu)
26	
27	**Hlavní hodnoticí otázka:** „Mohli bychom na to zítra pustit reklamu?“
28	Takže: funguje na mobilu, rychle se načte, formulář reálně ukládá, po odeslání něco přijde, měření běží, stránka je dostupná, nic nevypadá jako generický
… [zkráceno, celkem 24870 znaků]
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\data\\funds.json"
}
```

<details><summary>výsledek nástroje</summary>

```
1	{
2	  "retrieved": "2026-10-09",
3	  "report": "SPIVA U.S. Scorecard Year-End 2025",
4	  "publisher": "S&P Dow Jones Indices",
5	  "data_as_of": "2025-12-31",
6	  "landing_page": "https://www.spglobal.com/spdji/en/spiva/article/spiva-us/",
7	  "pdf_official_url": "https://www.spglobal.com/spdji/en/documents/spiva/spiva-us-year-end-2025.pdf",
8	  "pdf_official_url_note": "Oficialni URL pri nacteni vraci HTTP 403 (stejne jako stranka spglobal.com). Cisla byla nactena z kopie stejneho PDF (nazev dokumentu SPIVA U.S. Scorecard Year-End 2025, autori Ganti, Di Gioia, Didio, Flaherty).",
9	  "pdf_read_from": "https://www.ariesadvisors.com/files/spiva-us-year-end-2025.pdf",
10	  "location_in_report": "Report 1a: Percentage of U.S. Equity Funds Underperforming Their Benchmarks (Based on Absolute Return), radek 'All Large-Cap Funds', benchmark S&P 500, strana 12 PDF",
11	  "headline_quote_en": "79% of all active large-cap U.S. equity funds underperformed the S&P 500",
12	  "headline_location": "Summary na prvni strane reportu; Exhibit 1",
13	  "large_cap_vs_sp500_pct_underperforming": {
14	    "1y": 78.78,
15	    "3y": 66.84,
16	    "5y": 88.96,
17	    "10y": 85.59,
18	    "15y": 89.93,
19	    "20y": 92.89
20	  },
21	  "notes": "Metodika SPIVA: pocet fondu, ktere zaostaly za benchmarkem, vcetne zanikelych fondu (bez survivorship bias), po poplatcich. Zaokrouhleno: 79 / 67 / 89 / 86 / 90 / 93 %. Report 1b (risk-adjusted) ma jina cisla (15y 98.61, 20y 97.76) - nepouzito."
22	}
23	
```
</details>

<details><summary>výsledek nástroje</summary>

```
1	{
2	  "retrieved": "2026-10-09",
3	  "note": "Hodnoty z webu emitenta (SPY: ssga.com; VOO a VT: oficialni Vanguard fact sheet PDF na fund-docs.vanguard.com, protoze investor.vanguard.com/advisors.vanguard.com vraci pri nacteni jen nadpis stranky - data se dotahuji JavaScriptem). UCITS udaje z justETF (emitentovy stranky nebyly nacteny). TER v procentech (0.03 = 0,03 %). Oficialni vynosy jsou rocni prumerne (annualised), po uhrade nakladu, s reinvestici dividend; urceno ke kontrole nasich vypoctu z adjusted close, ne k zobrazeni.",
4	  "funds": [
5	    {
6	      "ticker": "SPY",
7	      "name": "State Street SPDR S&P 500 ETF Trust",
8	      "issuer": "State Street Investment Management (SPDR)",
9	      "structure": "unit investment trust",
10	      "index": "S&P 500 Index",
11	      "ter": 0.0945,
12	      "ter_note": "Gross expense ratio uvedeny na strance; cista (net) hodnota na strance neuvedena.",
13	      "ter_source": "https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy",
14	      "inception": "1993-01-22",
15	      "exchange": "NYSE Arca",
16	      "exchange_source": "https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy",
17	      "distribution": "distributing",
18	      "distribution_frequency": "quarterly",
19	      "official_returns": {
20	        "as_of": "2026-09-30",
21	        "source": "https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy",
22	        "unit": "percent p.a. (annualised)",
23	        "nav": 
… [zkráceno, celkem 6469 znaků]
```
</details>

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\content\\texty.md",
 "content": "# Texty landing page (copywriter, 2026-10-09)\n\nData k 09/2026. Ceny: Yahoo Finance (adjusted close, tj. s reinvestovanými dividendami), kurz: ČNB. Zástupci: `{{...}}` doplní hlavní session, `{...}` doplní JS.\n\n## meta\n\n**title:** Kalkulačka ETF: kolik by z 2 000 Kč měsíčně dnes bylo\n**description:** Spočítej si, co by udělaly pravidelné vklady do S&P 500 od roku 2010 i s poplatky. Zdarma, bez e-mailu. Data k 09/2026, historie nezaručuje budoucnost.\n**og_title:** Kolik by z 2 000 Kč měsíčně dnes bylo?\n**og_description:** Kalkulačka s reálnými daty od roku 2010: co udělají poplatky a kurz. A jak koupit stejné ETF z Česka.\n\n## hero-a\n\nReklama A, šok z poplatků.\n\n**eyebrow:** Poplatky za 15 let\n**h1:** Kolik tě za 15 let stojí 1% poplatek navíc?\n**sub:** Při 2 000 Kč měsíčně do S&P 500 by to bylo zhruba 112 000 Kč. Spočítej si to s vlastní částkou.\n**podtext:** Historická data 10/2011 až 09/2026 (Yahoo Finance, ČNB). Vloženo 360 000 Kč, hodnota 1 190 617 Kč, rozdíl kvůli 1% poplatku navíc 111 917 Kč. Minulé výnosy nezaručují budoucí výnosy.\n**cta:** Spočítej si svůj poplatek\n\n## hero-b\n\nReklama B, příběh 2 000 Kč od 2010.\n\n**eyebrow:** Data od roku 2010\n**h1:** 2 000 Kč měsíčně od 2010: kolik je dnes?\n**sub:** Takhle by vypadal účet při pravidelném nákupu S&P 500 od 01/2010 do 09/2026: vloženo 402 000 Kč, hodnota zhruba 1,6 milionu.\n**podtext:** Hi
… [zkráceno, celkem 13143 znaků]
```

**→ Bash**

```
{
 "command": "cd /c/Users/Administrator/Desktop/junior_ai_developer/content && wc -w texty.md && grep -o '{{[^}]*}}' texty.md | sort | uniq -c"
}
```

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\content\texty.md (file state is current in your context — no need to Read it back)
```
</details>

<details><summary>výsledek nástroje</summary>

```
1982 texty.md
      1 {{...}}
      1 {{DOBA_ULOZENI}}
      2 {{KONTAKT}}
      4 {{SPRAVCE}}
      2 {{ZDROJ?}}
```
</details>

**→ Bash**

```
{
 "command": "cd /c/Users/Administrator/Desktop/junior_ai_developer/content && sed -i 's/díky, že sis řekl o PDF/díky za zájem o PDF/; s/Vložil bys {vlozeno} Kč\\./Vloženo by bylo {vlozeno} Kč./; s/ze které jsi přišel/ze které ses na web dostal(a)/; s/Dočetl jsi to až sem\\./Dočetlo se to až sem?/' texty.md && grep -n \"dostal(a)\\|Dočetlo\\|za zájem\\|Vloženo by\" texty.md | head"
}
```

<details><summary>výsledek nástroje</summary>

```
52:**vysledek_vlozeno:** Vloženo by bylo {vlozeno} Kč.
113:**nadpis:** Dočetlo se to až sem? Ber si PDF na cestu
159:Co zpracováváme: tvůj e-mail a informaci o souhlasu. Případně označení reklamy, ze které ses na web dostal(a) (například kampaň).
175:díky za zájem o PDF. Tady ho máš: {pdf_url}
```
</details>

**→ Bash**

```
{
 "command": "cd /c/Users/Administrator/Desktop/junior_ai_developer/content && sed -i 's/Dočetlo se to až sem? Ber si PDF na cestu/Jsi na konci stránky. PDF si vezmi s sebou/' texty.md && wc -w texty.md"
}
```

<details><summary>výsledek nástroje</summary>

```
1983 texty.md
```
</details>

**→ SubagentHandback**

```
{
 "message": "Soubor je hotový: C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\content\\texty.md. Má všech 15 sekcí s poli `**pole:** text`. Obsahuje zhruba 1 983 slov podle `wc -w`, včetně značek a metadat. Nic jiného jsem nevytvářel, necommitoval ani nečetl `.env`.\n\nPoužití zástupci:\n- `{{SPRAVCE}}`: souhlas GDPR v cta-1 a cta-2, patička, zásady, podpis e-mailu.\n- `{{KONTAKT}}`: zásady, 2×.\n- `{{ZDROJ?}}`: FAQ q4 „Co když trh spadne?“, kde chybí číslo největšího propadu v datech.\n- `{{DOBA_ULOZENI}}`: zásady. Ta doba není nikde ve zdrojích, dej tam skutečnou hodnotu.\n\nZástupci pro JS, které jsem použil: `{vlozeno}`, `{hodnota}`, `{poplatek}`, `{kurz_efekt}`, `{od}`, `{do}`, `{pdf_url}`, `{unsubscribe_url}`.\n\nCo zkontrolovat:\n- **Odchylky od zadání:**\n  - Přidal jsem pole `podtext` do heroes. Obsahuje přesná čísla, období a větu o minulých výnosech, protože se nevešly do `sub` (≤ 25 slov).\n  - U výsledku v kalkulačce jsou dvě varianty věty o kurzu, kladná a záporná (`vysledek_kurz_kladny` a `vysledek_kurz_zaporny`). Obecné vysvětlení kurzu je jedna věta.\n- **Odkazy a stránky:**\n  - Odkaz na zásady je kotva `#zasady`.\n  - Jako zpracovatele e-mailů zmiňuji Resend podle CLAUDE.md.\n- **Daně:** Limit 40 mil. Kč jsem nezmínil. FAQ o daních obsahuje jen časový test 3 roky, hranici 100 000 Kč, nekombinování testů a upozornění, že dividendy neřešíme.\n- **PRIIPs:** Slovo PRIIPs je jen v úvodu sekce `fondy`, ne v nadpisu.\n- **Brokeři:** FAQ q3 je obecná, be
… [zkráceno, celkem 1702 znaků]
```

<details><summary>výsledek nástroje</summary>

```
{"success":true,"message":"Report delivered to your caller."}
```
</details>

