# Session 01 – export konverzace

Export celé session z Claude Code (desktopová aplikace; příkaz `/export` v ní není dostupný, export proběhl přes menu session dne 2026-10-09), převedený do čitelného Markdownu.

| Soubor | Kdo | Co |
|---|---|---|
| [00-hlavni-session.md](00-hlavni-session.md) | Claude Code, Opus | celá konverzace s uživatelem: plán, architektura, review, nasazení, review designu od Codexu |
| [01-data-fetcher-haiku.md](01-data-fetcher-haiku.md) | Haiku | stažení cen ETF a kurzů ČNB |
| [02-data-verifier-sonnet.md](02-data-verifier-sonnet.md) | Sonnet | ověření TER, UCITS, SPIVA, daní |
| [03-testy-haiku.md](03-testy-haiku.md) | Haiku | testy kalkulačky |
| [04-copywriter-sonnet.md](04-copywriter-sonnet.md) | Sonnet | texty stránky a reklam |
| [05-backend-sonnet.md](05-backend-sonnet.md) | Sonnet | PHP API |
| [06-frontend-sonnet.md](06-frontend-sonnet.md) | Sonnet | první verze frontendu |
| [07-pdf-copywriter-sonnet.md](07-pdf-copywriter-sonnet.md) | Sonnet | obsah PDF |
| [08-analytika-backend-sonnet.md](08-analytika-backend-sonnet.md) | Sonnet | analytická stránka |
| [09-benchmark-sonnet.md](09-benchmark-sonnet.md) | Sonnet | benchmark konverze |

Práce **OpenAI Codexu** (design Liquid Glass) proběhla v Codexu, mimo tuto session – její přepis zde není; výsledek je ve větvi `design/codex`.

**Úpravy oproti surovému exportu** (zkontrolováno před commitem):
- tajné údaje: žádná hesla, API klíče ani tokeny v exportu nebyly (klíč Resend je v konverzaci jen zamaskovaný `••••`)
- soukromý e-mail uživatele a e-maily autorů reportu SPIVA nahrazeny zástupným textem
- výpisy konfigurace HAProxy a certbot hooku produkčního serveru (interní adresy a názvy jiných služeb uživatele) vynechány s poznámkou
- výsledky nástrojů zkrácené na 1 500 znaků; screenshoty, stažená PDF třetích stran a metadata aplikace nejsou součástí
- chyby a slepé uličky ponechány beze změny (viz i [`../errors.md`](../errors.md))
- konec konverzace (závěrečné shrnutí po tomto commitu) v exportu není
