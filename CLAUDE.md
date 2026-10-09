# CLAUDE.md – pravidla projektu

Konverzní landing page pro českého drobného investora: kalkulačka „kolik budu mít za X let“ se srovnáním ETF z NYSE (vč. NYSE Arca) a jejich UCITS ekvivalentů, lead za PDF srovnání + návod na nákup z ČR.

Detailní plán: `docs/zadanie-B-poznamky.md`. Kde se liší od rozhodnutí níže, **platí tento soubor**.

## Rozhodnutí (aktuální, přebíjí poznámky)
- Doména: **aijunior.opicebot.cz** (ne etf.opicebot.cz)
- Vše na Ubuntu serveru **192.168.1.200**: HAProxy (TLS, Let's Encrypt) → **Apache na 127.0.0.1:8081** + PHP-FPM → **MariaDB na 127.0.0.1**. Server .175 / nginx se nepoužívá.
- E-mail: **Resend HTTP API** (cURL, bez Composeru); PDF jako odkaz, ne příloha
- Specifikace designu a rozhraní: `docs/design-a-rozhrani.md`
- Zrcadlo statiky: GitHub Pages, API přes CORS na aijunior.opicebot.cz
- Design: moderní **tmavý** styl, obsah v kartách se **scroll-reveal** animací
- Jazyk webu: čeština, **tykání**

## Struktura
```
public/        document root (index.html, css/, js/, data/, api/*.php, admin/)
config.php     načítá .env – leží MIMO public/
scripts/       Node skripty pro stažení dat → public/data/*.json
deploy/        Apache vhost, HAProxy snippet, schema.sql, INSTALL.md
ai-log/        exporty session, errors.md, usage.md
docs/          plánovací poznámky
.claude/agents definice podagentů
```

## Tvrdá pravidla
1. **Tajné údaje:** `.env` nikdy nečti, nevypisuj, necommituj. Hesla/klíče nepiš do kódu, logů ani chatu. Vzor je v `.env.example`.
2. **Data:** žádné číslo si nevymýšlej ani „nepamatuj“. Každé číslo na stránce má `source` (URL) + `retrieved` (datum). Výnosy vždy z **adjusted close**. Když zdroj nenajdeš, napiš `NENALEZENO`.
3. **Žádné real-time API na stránce** – frontend čte jen statické JSON z `public/data/`.
4. **PHP:** PDO + prepared statements, `ATTR_EMULATE_PREPARES=false`, validace vstupů, žádné vypisování výjimek uživateli. `require __DIR__ . '/../../config.php'`.
5. **Frontend:** vanilla HTML/CSS/JS, mobile-first, žádný framework bez důvodu. Hero a kalkulačka se neanimují (rychlé LCP). Bez JS musí být obsah vidět; respektuj `prefers-reduced-motion`.
6. **Design:** žádné fialové gradienty, glassmorphism, emoji v nadpisech, generické „AI“ fráze. Vlastní paleta (CSS proměnné), 1 výrazný font.
7. **Měření:** first-party, bez cookies a bez IP; `session_id` v `sessionStorage`; eventy přes `sendBeacon` jako `text/plain`.
8. **Chyby AI:** každou nalezenou chybu agenta zapiš do `ai-log/errors.md` (co udělal → jak se poznalo → jak opraveno). Nemazat slepé uličky.
9. **Commity:** malé, po každém hotovém kroku, Conventional Commits česky (`feat: kalkulačka – výpočet v CZK`).
10. Na serveru se **nic nespouští bez potvrzení uživatele** – připravuj jen konfigurace a postupy do `deploy/`.

## Podagenti (`.claude/agents/`)
| Agent | Model | Úkol |
|---|---|---|
| data-fetcher | haiku | fetch skripty, uložení JSON |
| data-verifier | sonnet | ověření čísel proti primárním zdrojům |
| copywriter | sonnet | české texty, 2 verze reklamy |
| frontend | sonnet | HTML/CSS/JS podle zadání designu |
| backend | sonnet | PHP endpointy, SQL |

Hlavní session (Opus) = architektura, výpočetní jádro kalkulačky, bezpečnost, integrace, deploy, review. Výstup každého agenta se před commitem reviewuje.
