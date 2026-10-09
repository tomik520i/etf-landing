# Reklamy A/B: kde běží a co mění na stránce

## Kde se reklamy zobrazují

**Na webu žádná reklama není.** Reklamy běží mimo web, na sociálních sítích, kde je cílovka (25–40 let, mobil):

- **Instagram a Facebook:** Meta Ads Manager, formát obrázek/video + text + tlačítko
- **TikTok:** TikTok Ads Manager, krátké video + text + tlačítko

Návštěvník uvidí reklamu ve feedu nebo stories, klikne na tlačítko „Zjistit více“ a dostane se na landing page. **Odkaz v každé reklamě je jiný** a právě podle něj stránka pozná, ze které reklamy člověk přišel.

## Odkazy pro reklamy

| Reklama | Odkaz, který se vloží do reklamy |
|---|---|
| **A – šok z poplatků** | `https://aijunior.opicebot.cz/?ad=a&utm_source=instagram&utm_campaign=etf-poplatky` |
| **B – příběh 2 000 Kč od 2010** | `https://aijunior.opicebot.cz/?ad=b&utm_source=instagram&utm_campaign=etf-pribeh` |

- `ad=a` / `ad=b` → kterou variantu úvodu stránky ukázat
- `utm_source` → odkud návštěvník přišel (`instagram`, `facebook`, `tiktok` …), pro každou síť stačí tuto hodnotu změnit
- `utm_campaign` → název kampaně
- bez parametru `ad` se ukáže obecná varianta (např. když někdo odkaz sdílí dál)

## Texty reklam

Zdroj: [`content/texty.md`](../content/texty.md), sekce `reklamy`. Všechna čísla jsou spočítaná z dat na stránce.

| | Reklama A – šok z poplatků | Reklama B – konkrétní příběh |
|---|---|---|
| **Primární text** | 1 % ročně navíc zní jako málo. U 2 000 Kč měsíčně od roku 2011 šlo o zhruba 137 000 Kč. Spočítej si to. | 2 000 Kč měsíčně do S&P 500 od roku 2010. Vloženo 402 000 Kč, dnes zhruba 1,6 mil. Kč. Historie, ne příslib. |
| **Nadpis** | Kolik tě stojí 1 % poplatek navíc? | Co by z 2 000 Kč měsíčně bylo dnes |
| **Popis** | Kalkulačka s daty do 09/2026 | Data 01/2010 až 09/2026 |
| **Tlačítko** | Zjistit více | Zjistit více |

## Co parametr `?ad` na stránce mění

Mění se **jen úvod stránky (hero) a startovní scénář kalkulačky**. Zbytek stránky je pro všechny stejný.

| Co | Bez `?ad` | `?ad=a` | `?ad=b` |
|---|---|---|---|
| **Štítek nad nadpisem** | Kalkulačka ETF | Poplatky od roku 2011 | Data od roku 2010 |
| **Hlavní nadpis** | Kolik by z tvých vkladů dnes bylo? | Kolik by tě od roku 2011 stál 1% poplatek navíc? | 2 000 Kč měsíčně od 2010: kolik je dnes? |
| **Podnadpis** | obecný | ~137 000 Kč na poplatcích | vloženo 402 000 Kč, dnes ~1,6 mil. |
| **Tlačítko** | Spočítej si to | Spočítej si svůj poplatek | Spočítej si svou částku |
| **Kalkulačka startuje od roku** | 2010 | **2011** | **2010** |
| **Výsledek hned po načtení** | 1 608 004 Kč | **1 365 315 Kč** (poplatek 136 856 Kč) | **1 608 004 Kč** |

**Proč:** jde o *message match*. Kdo v reklamě viděl „137 000 Kč na poplatcích“, musí na stránce hned vidět stejnou otázku a stejné číslo, jinak má pocit, že je na špatném místě, a odejde. Kalkulačka proto startuje přesně ve scénáři z reklamy a návštěvník si ho pak přepočítá na svou částku.

## Jak se varianty vyhodnocují

1. Při příchodu se varianta (`a` / `b`) a UTM uloží do `sessionStorage` prohlížeče (bez cookies).
2. Ke **každému eventu** (zobrazení, práce s kalkulačkou, odeslání formuláře…) i ke **každému leadu** v databázi se uloží `ad_variant`.
3. **Analytika** (`/admin/`, `admin` / `admin`) ukazuje:
   - sekci **A/B srovnání:** návštěvy, leady a konverze A vs B, rozdíl, 95% interval a p-hodnotu. Pod 100 návštěv na variantu píše „Málo dat – zatím nerozhodovat“.
   - sekci **Zdroje návštěv** podle `utm_source`.
4. Rozhodnutí: když je rozdíl průkazný, horší reklamu vypnout a rozpočet přesunout na lepší. Další A/B hypotézy jsou v [README](../README.md#3-hypotézy-na-ab-test-podle-očekávaného-dopadu).

## Vyzkoušej si to

- https://aijunior.opicebot.cz/?ad=a&test=1
- https://aijunior.opicebot.cz/?ad=b&test=1
- https://aijunior.opicebot.cz/?test=1 (bez reklamy)

`test=1` označí návštěvu jako testovací, takže ji v analytice půjde odfiltrovat (filtr „Vyloučit testovací“).
