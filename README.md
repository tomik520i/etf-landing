# ETF kalkulačka – konverzní landing page

Landing page pro českého drobného investora: kalkulačka „kolik budu mít za X let“ se srovnáním ETF z NYSE a jejich UCITS ekvivalentů, které jde reálně koupit z ČR.

- Web: https://aijunior.opicebot.cz
- Zrcadlo (jen statika): GitHub Pages *(připravuje se)*

> Rozpracováno – průběh: [`docs/STAV.md`](docs/STAV.md). Plán: [`docs/zadanie-B-poznamky.md`](docs/zadanie-B-poznamky.md), pravidla pro AI: [`CLAUDE.md`](CLAUDE.md).

## Stack
- Frontend: statické HTML/CSS + vanilla JS, data jako statické JSON
- Backend: PHP 8 + PDO, MariaDB
- Infra: Ubuntu server, HAProxy (TLS, Let's Encrypt) → Apache + PHP-FPM, MariaDB – vše na jednom stroji
- E-mail: Resend (HTTP API)
- Měření: vlastní first-party funnel do MariaDB, bez cookies

Konfigurace je v `.env` (vzor v `.env.example`), leží mimo document root a Claude Code má čtení `.env` zakázané (`.claude/settings.json`).

## Práce s AI
*Doplní se: agenti a jejich pokyny (`.claude/agents/`), kontrola výstupu, kde se AI spletla (`ai-log/errors.md`), tokeny a cena (`ai-log/usage.md`).*

## Cílová skupina a výměna hodnoty
*Doplní se.*

## Pořadí sekcí
*Doplní se.*

## Očekávaná konverze
*Doplní se (benchmark se zdrojem).*

## A/B hypotézy
*Doplní se.*

## Rozhodnutí v nejasných bodech zadání
*Doplní se: NYSE vs UCITS, vlastní hosting místo Vercelu, vlastní měření.*

## Co chybí
*Doplní se.*
