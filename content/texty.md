# Texty landing page (copywriter, 2026-10-09)

Data k 09/2026. Ceny: Yahoo Finance (adjusted close, tj. s reinvestovanými dividendami), kurz: ČNB. Zástupci: `{{...}}` doplní hlavní session, `{...}` doplní JS.

## meta

**title:** Kalkulačka ETF: kolik by z 2 000 Kč měsíčně dnes bylo
**description:** Spočítej si, co by udělaly pravidelné vklady do S&P 500 od roku 2010 i s poplatky. Zdarma, bez e-mailu. Data k 09/2026, historie nezaručuje budoucnost.
**og_title:** Kolik by z 2 000 Kč měsíčně dnes bylo?
**og_description:** Kalkulačka s reálnými daty od roku 2010: co udělají poplatky a kurz. A jak koupit stejné ETF z Česka.

## hero-a

Reklama A, šok z poplatků.

**eyebrow:** Poplatky za 15 let
**h1:** Kolik tě za 15 let stojí 1% poplatek navíc?
**sub:** Při 2 000 Kč měsíčně do S&P 500 by to bylo zhruba 112 000 Kč. Spočítej si to s vlastní částkou.
**podtext:** Historická data 10/2011 až 09/2026 (Yahoo Finance, ČNB). Vloženo 360 000 Kč, hodnota 1 190 617 Kč, rozdíl kvůli 1% poplatku navíc 111 917 Kč. Minulé výnosy nezaručují budoucí výnosy.
**cta:** Spočítej si svůj poplatek

## hero-b

Reklama B, příběh 2 000 Kč od 2010.

**eyebrow:** Data od roku 2010
**h1:** 2 000 Kč měsíčně od 2010: kolik je dnes?
**sub:** Takhle by vypadal účet při pravidelném nákupu S&P 500 od 01/2010 do 09/2026: vloženo 402 000 Kč, hodnota zhruba 1,6 milionu.
**podtext:** Historická data 01/2010 až 09/2026 (Yahoo Finance, ČNB). Přesně: vloženo 402 000 Kč, hodnota 1 608 004 Kč. Kdyby fond stál o 1 % ročně víc, bylo by to 1 434 656 Kč, tedy o 173 348 Kč méně. Minulé výnosy nezaručují budoucí výnosy.
**cta:** Spočítej si svou částku

## hero-default

Bez parametru `?ad`.

**eyebrow:** Kalkulačka ETF
**h1:** Kolik by z tvých vkladů dnes bylo?
**sub:** Zadej měsíční částku a uvidíš, co by udělaly pravidelné nákupy ETF na reálných datech i s poplatky. Bez e-mailu.
**podtext:** Výpočet je z historických dat do 09/2026. Minulé výnosy nezaručují budoucí výnosy.
**cta:** Spočítej si to

## kalkulacka

**nadpis:** Spočítej si to s vlastní částkou
**uvod:** Vyber fond, zadej měsíční vklad a uvidíš, jak by si na reálných datech vedl i s poplatkem navíc.
**label_vklad:** Měsíční vklad (Kč)
**label_obdobi:** Investuju od roku
**label_fond:** Fond
**label_poplatek:** Poplatek navíc (% ročně)
**napoveda_poplatek:** Co kdyby fond stál o tolik víc, než stojí ve skutečnosti.
**vysledek_nadpis:** Výsledek za období {od} až {do}
**vysledek_vlozeno:** Vloženo by bylo {vlozeno} Kč.
**vysledek_hodnota:** Hodnota na konci by byla zhruba {hodnota} Kč.
**vysledek_poplatek:** Poplatek navíc by tě za tu dobu stál {poplatek} Kč.
**vysledek_kurz_kladny:** Kurz USD/CZK ti za období přidal {kurz_efekt} Kč.
**vysledek_kurz_zaporny:** Kurz USD/CZK ti za období ubral {kurz_efekt} Kč.
**kurzovy_efekt_vysvetleni:** Fond je v dolarech, takže když koruna oproti dolaru zeslábne, tvůj výsledek v korunách roste, a když zesílí, klesá.
**vysledek_upozorneni:** Jde o historii za období {od} až {do}. Minulé výnosy nezaručují budoucí výnosy.
**metodika:** Výnosy počítáme z adjusted close z Yahoo Finance, takže zahrnují reinvestované dividendy. Vklady přepočítáváme kurzem ČNB v daném měsíci. Výsledek je bez daní a bez poplatků tvého brokera.

Příklad pro podtext hero B (přesné hodnoty): {od} = 01/2010, {do} = 09/2026, {vlozeno} = 402 000, {hodnota} = 1 608 004, {poplatek} = 173 348.

## cta-1

**nadpis:** Chceš to celé v jednom PDF?
**uvod:** Pošleme ti srovnání ETF a postup, jak je koupit z Česka. Dostaneš:
**odrazky:**
- Srovnání SPY, VOO a VT: poplatky (TER), co sledují a jak se vyplácí dividendy.
- U každého fondu jeho UCITS ekvivalent, který jde koupit z ČR, s tickery a ISIN.
- Postup krok za krokem: jak vybrat brokera, otevřít účet a zadat první nákup.
- Základy daní: časový test 3 roky a hranice 100 000 Kč ročních příjmů z prodeje.
**label_email:** Tvůj e-mail
**placeholder:** jmeno@email.cz
**souhlas:** Souhlasím se zpracováním e-mailu za účelem zaslání PDF a navazujících e-mailů o investování. Správce: {{SPRAVCE}}. Souhlas můžu kdykoli odvolat. Více v [zásadách zpracování osobních údajů](#zasady).
**tlacitko:** Pošlete mi PDF
**mikrotext:** Žádný spam. Odhlásíš se jedním klikem.

## form-stavy

**uspech:** PDF je na cestě do tvé schránky, obvykle dorazí do pár minut. Když ho nevidíš, mrkni do složky Spam nebo Promoce. Mezitím si můžeš v kalkulačce vyzkoušet jiný fond nebo jinou částku.
**chyba:** Něco se nepovedlo a e-mail jsme neodeslali. Zkus to prosím za chvíli znovu.
**neplatny_email:** Tenhle e-mail nevypadá správně. Zkontroluj ho prosím, třeba zavináč nebo koncovku.
**chybi_souhlas:** Bez souhlasu ti PDF poslat nemůžeme. Zaškrtni ho prosím.

## proc-pasivne

**nadpis:** Aktivní správci většinou index nepřekonají
**text:** Podle zprávy SPIVA U.S. Year-End 2025 za rok 2025 zaostalo za indexem S&P 500 zhruba 79 % aktivních fondů velkých amerických firem. Za 10 let to bylo zhruba 86 %, za 15 let zhruba 90 % a za 20 let zhruba 93 %. Proto v kalkulačce porovnáváme levné indexové ETF. Jde o historii, budoucnost nezaručuje.
**zdroj:** Zdroj: S&P Dow Jones Indices, SPIVA U.S. Scorecard Year-End 2025, Report 1a, All Large-Cap Funds vs. S&P 500, data k 31. 12. 2025. Přesně: 78,78 % (1 rok), 85,59 % (10 let), 89,93 % (15 let), 92,89 % (20 let).

## fondy

**nadpis:** Fondy, které porovnáváme, a ty, které opravdu koupíš
**uvod:** Porovnáváme americké ETF z NYSE Arca, protože mají nejdelší historii. Jenže evropské brokery je malým investorům neprodají, protože u nich chybí povinný klíčový informační dokument (pravidla PRIIPs). Proto ke každému ukazujeme irský UCITS fond, který koupíš z Česka.
**label_ucits:** Co koupíš z ČR

### SPY
**popis:** ETF na index S&P 500 (500 největších amerických firem), obchoduje se od roku 1993. Roční poplatek (TER) 0,0945 %.
**ucits:** iShares Core S&P 500 UCITS ETF (SXR8, na londýnské burze CSPX), TER 0,07 %. Stejný index, alternativa je VUAA s TER 0,07 %.

### VOO
**popis:** Vanguard ETF na stejný index S&P 500 jako SPY, jen s nižším poplatkem. Roční poplatek (TER) 0,03 %.
**ucits:** Stejný index kopíruje SXR8/CSPX (TER 0,07 %) nebo Vanguard S&P 500 UCITS ETF, VUAA (TER 0,07 %).

### VT
**popis:** Vanguard ETF na akcie z celého světa, USA i ostatní trhy. Roční poplatek (TER) 0,06 %.
**ucits:** Nejbližší je Vanguard FTSE All-World UCITS ETF, VWCE (TER 0,14 %). Není to stejný fond, sleduje trochu jiný index.

**poznamka:** TER k 09/2026 podle emitentů a justETF.

## cta-2

**nadpis:** Jsi na konci stránky. PDF si vezmi s sebou
**uvod:** V jednom souboru: srovnání SPY, VOO a VT, jejich UCITS ekvivalenty a postup nákupu z Česka krok za krokem.
**odrazky:** (stejné jako cta-1)
**label_email:** Tvůj e-mail
**placeholder:** jmeno@email.cz
**souhlas:** (stejný jako cta-1)
**tlacitko:** Pošlete mi PDF
**mikrotext:** Žádný spam. Odhlásíš se jedním klikem.

## faq

**nadpis:** Otázky, které se ptají skoro všichni

**q1:** Můžu tyhle ETF koupit z ČR?
**a1:** Americké SPY, VOO a VT většinou ne. Brokeři v EU je malým investorům neprodávají, protože tyto fondy nemají evropský klíčový informační dokument. Místo nich koupíš irské UCITS ETF na stejný nebo podobný index. Dostupnost si před založením účtu ověř u konkrétního brokera.

**q2:** Jak je to s daněmi?
**a2:** V ČR je prodej cenných papírů osvobozený, když je držíš déle než 3 roky. Osvobozené jsou i příjmy z prodeje do 100 000 Kč za rok. Testy se nekombinují. Zdanění dividend tu neřešíme. Není to daňové poradenství, pravidla si ověř u finanční správy.

**q3:** Kolik potřebuju na začátek?
**a3:** Záleží na brokeru a fondu. Řada brokerů umožňuje nákup od ceny jednoho podílu nebo i zlomků podílů. Kalkulačka počítá s pravidelným měsíčním vkladem. Zkus si ho nastavit podle toho, co ti zbývá každý měsíc, a poplatky brokera si porovnej předem.

**q4:** Co když trh spadne?
**a4:** Hodnota fondu může klesnout, i výrazně, a nikdo nezaručí, že se vrátí. Kalkulačka i data SPIVA ukazují jen minulost za uvedená období. Například S&P 500 (SPY) mezi 10/2007 a 02/2009 klesl o 51 % a na předchozí maximum se vrátil až v 03/2012 (měsíční data s dividendami). Investuj jen peníze, které v dohledné době nepotřebuješ.

**q5:** Proč ne bitcoin nebo jednotlivé akcie?
**a5:** Nezakazujeme je. Jen jsme se zaměřili na fondy, které drží stovky nebo tisíce firem najednou, takže nestavíš na jedné. U jednotlivých akcií a kryptoměn je rozptyl výsledků výrazně větší. Rozhodnutí je na tobě.

**q6:** Je to investiční doporučení?
**a6:** Ne. Stránka má vzdělávací charakter, ukazuje historická data a nezná tvoji situaci. Minulé výnosy nezaručují budoucí výnosy. Před rozhodnutím si zjisti víc nebo se poraď s licencovaným poradcem.

## paticka

**zdroje_nadpis:** Zdroje dat
**zdroje:** Ceny ETF: Yahoo Finance (adjusted close), staženo 09. 10. 2026. Kurz USD/CZK: ČNB. Poplatky a parametry fondů: emitenti SPDR/State Street a Vanguard a justETF, k 09. 10. 2026. Statistika aktivních fondů: S&P Dow Jones Indices, SPIVA U.S. Scorecard Year-End 2025 (data k 31. 12. 2025).
**varovani_1:** Minulé výnosy nezaručují budoucí výnosy.
**varovani_2:** Nejedná se o investiční doporučení, informace mají vzdělávací charakter. Hodnota investice může klesat i stoupat.
**spravce:** Správce osobních údajů: {{SPRAVCE}}.
**odkaz_zasady:** Zásady zpracování osobních údajů (#zasady)

## zasady

**nadpis:** Zásady zpracování osobních údajů
**text:**
Správce: {{SPRAVCE}}, kontakt: {{KONTAKT}}.

Co zpracováváme: tvůj e-mail a informaci o souhlasu. Případně označení reklamy, ze které ses na web dostal(a) (například kampaň).

Proč: abychom ti poslali PDF a navazující e-maily o investování. Právním základem je tvůj souhlas.

Jak dlouho: do odvolání souhlasu, nejdéle {{DOBA_ULOZENI}}. E-mail ti pomáhá odesílat zpracovatel, služba Resend.

Tvoje práva: máš právo na přístup, opravu, výmaz, omezení zpracování a přenositelnost. Souhlas můžeš kdykoli odvolat, stačí odkaz pro odhlášení v každém e-mailu nebo zpráva na {{KONTAKT}}. Odvolání nemá vliv na dřívější zpracování. Máš také právo podat stížnost u Úřadu pro ochranu osobních údajů.

Cookies a měření: web nepoužívá cookies. Měříme návštěvnost vlastním nástrojem bez IP adres a bez osobních údajů. Anonymní identifikátor relace je jen v paměti prohlížeče a po zavření se ztratí.

## email

**predmet:** Tvoje PDF: srovnání ETF a nákup z ČR
**text:**
Ahoj,

díky za zájem o PDF. Tady ho máš: {pdf_url}

Uvnitř najdeš srovnání SPY, VOO a VT, jejich UCITS ekvivalenty, které jde koupit z Česka, a postup nákupu krok za krokem. Čísla jsou historická data k 09/2026 a nejde o investiční doporučení.

Až budeš chtít, vrať se na kalkulačku a zkus jinou částku nebo jiný fond.

Další e-maily nechceš? Odhlásíš se jedním klikem: {unsubscribe_url}

{{SPRAVCE}}

## reklamy

### reklama-a

**primarni_text:** 1 % ročně navíc zní jako málo. U 2 000 Kč měsíčně za 15 let šlo o zhruba 112 000 Kč. Spočítej si to.
**nadpis:** Kolik tě stojí 1 % poplatek navíc?
**popis:** Kalkulačka s daty do 09/2026
**cta_tlacitko:** Zjistit více
**zduvodneni_navaznosti:** Hero A přebírá otázku o poplatcích i částku 2 000 Kč, takže návštěvník vidí ten samý příběh a hned pod ním kalkulačku.

### reklama-b

**primarni_text:** 2 000 Kč měsíčně do S&P 500 od roku 2010. Vloženo 402 000 Kč, dnes zhruba 1,6 mil. Kč. Historie, ne příslib.
**nadpis:** Co by z 2 000 Kč měsíčně bylo dnes
**popis:** Data 01/2010 až 09/2026
**cta_tlacitko:** Zjistit více
**zduvodneni_navaznosti:** Hero B opakuje stejné období, částku a výsledek jako reklama, takže návštěvník nemusí nic hledat a může si příběh rovnou přepočítat se svou částkou.

## zduvodneni

- Tykání: cílovka 25 až 40 let přichází z reklamy na mobilu, vykání by působilo jako banka a zvětšovalo vzdálenost u tématu, kterého se lidé bojí.
- CTA jsou konkrétní („Spočítej si svůj poplatek“, „Pošlete mi PDF“), protože říkají, co se stane po kliku. Hero vede ke kalkulačce zdarma bez e-mailu, e-mail se žádá až po výsledku.
- Čísla jsou zaokrouhlená („zhruba 1,6 milionu“, „zhruba 112 000 Kč“), aby se daly přečíst za pár sekund. Přesná hodnota je vždy v podtextu, kvůli důvěře a ověřitelnosti.
- Každé historické číslo má uvedené období a větu, že minulé výnosy nezaručují budoucí. Žádné sliby, žádné „zbohatni“, žádné odhady budoucnosti.
- PRIIPs vysvětlujeme lidsky („chybí evropský klíčový informační dokument“), zkratka není v nadpisu. Důvod, proč ukazujeme UCITS, je pro čtenáře užitečný, ne technický.
- VWCE je označeno jako „nejbližší“ ekvivalent VT, ne stejný fond, protože sleduje jiný index. Nepsali jsme, že jde o totéž.
- Vyhnuli jsme se limitu 40 mil. Kč (zrušen, novela neověřena), konkrétním poplatkům a minimům brokerů (nemáme ověřené zdroje) a konkrétním propadům trhu bez čísla v datech (hlavní session doplnila propad SPY spočítaný z našich dat).
- Nadpisy sekcí nejsou šablonové (žádné „Proč si vybrat nás“), nepoužíváme vykřičníky ani emoji. U bitcoinu a akcií nestrašíme, jen popisujeme rozptyl.
