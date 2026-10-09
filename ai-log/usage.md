# Tokeny a cena

Zdroj: `npx ccusage@latest session --json` a `daily --breakdown`, stav k 2026-10-09 ~21:30 (session-01 ještě běží, na konci aktualizovat).
Na předplatném jde o **odhad ekvivalentu API ceny podle ceníku v ccusage**, ne o reálně zaplacenou částku.

## Session-01 (plán, data, kalkulačka, texty, frontend, backend, nasazení, analytika)

| Model | Role | Input tok | Output tok | Cache zápis | Cache čtení | Odhad USD (ccusage) |
|---|---|---:|---:|---:|---:|---:|
| claude-opus-5-5 | hlavní session: architektura, výpočetní jádro, review, deploy, integrace | 324 | 176 303 | 338 660 | 34 535 788 | 13,14 |
| claude-sonnet-5-5 | 7 agentů: data-verifier, copywriter ×2, frontend, backend ×2, benchmark | 146 | 7 142* | 505 595 | 5 196 460 | 1,86 |
| claude-haiku-5-5 | 2 agenti: data-fetcher, testy kalkulačky | 32 | 101* | 105 432 | 836 649 | 0,02 |
| **Celkem** | | | | | | **15,02** |

\* **Výstupní tokeny podagentů jsou v lokálních logách podhodnocené.** Sonnet napsal desítky kB kódu a textu, což nemůže být 7 142 tokenů. Logy ukládají každou zprávu průběžně během streamování a finální počet výstupních tokenů u podagentů zřejmě chybí. Cena agentů je proto **dolní odhad**. Cache čtení a zápis (většina ceny) sedí.

### Celkové tokeny agentů podle hlášení Claude Code po dokončení
| Agent | Model | Úkol | Tokeny celkem |
|---|---|---|---:|
| data-fetcher | Haiku | fetch skripty, ceny + kurz | 67 724 |
| testy | Haiku | 19 testů kalkulačky | 77 392 |
| data-verifier | Sonnet | TER, UCITS, SPIVA, daně | 126 643 |
| copywriter | Sonnet | texty stránky, reklamy, e-mail | 84 597 |
| copywriter | Sonnet | obsah PDF | 74 545 |
| backend | Sonnet | API, odhlášení, admin | 75 229 |
| frontend | Sonnet | HTML/CSS/JS, graf, formuláře | 109 312 |
| backend | Sonnet | analytická stránka | 89 146 |
| výzkum | Sonnet | benchmark konverze | 67 077 |
| **Celkem** | | | **771 665** |

## Vyplatilo se rozdělení na menší modely?
- **Ano, cenově.** Hlavní session na Opusu tvoří ~87 % ceny, přestože 9 agentů udělalo většinu psaní (texty, frontend, backend, data). Každá z těch úloh by v hlavní session znovu načítala velký kontext za cenu Opusu.
- **Haiku** zvládl mechanické úlohy (stažení dat, testy) prakticky zadarmo a bez chyby v datech. Jediný rozpor, mezi dvěma mými pokyny, sám nahlásil.
- **Sonnet** psal kvalitní kód i texty, ale každý výstup potřeboval review. Review našlo 9 chyb (`errors.md` #6–#13, #18), od neověřených tvrzení po bezpečnostní slabinu v odhlášení.
- **Náklad navíc:** review a integrace na Opusu nejsou zadarmo. U malých úloh (pár řádků) se delegování nevyplatilo a dělal jsem je přímo.

## Poznámky k měření
- `ccusage daily` za 2026-10-09 ukazuje i Codex a jiné projekty na tomtéž počítači. Do tabulky výše patří jen session tohoto projektu (`claude`, poslední aktivita 2026-10-09).
- Vlastní přepočet z logů s cenami „z paměti“ dal úplně jiný výsledek (~24 USD za Opus) → ceník z paměti jsem zahodil, viz `errors.md` #19.
