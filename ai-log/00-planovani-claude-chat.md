# 00 – Plánování v Claude chatu (před implementací)

Záznam toho, jak vznikl plán `docs/zadanie-B-poznamky.md`. Tahle fáze proběhla v **claude.ai chatu**, ne v Claude Code, takže k ní neexistuje `/export`. Exporty z Claude Code začínají až od `session-01`.

- **Datum:** 9. 10. 2026
- **Nástroj:** claude.ai (chat), model Claude Opus 5.5, s webovým vyhledáváním
- **Tokeny / cena:** v chatu nejsou k dispozici (ccusage čte jen logy Claude Code). Měření tokenů začíná až v Claude Code (`ai-log/usage.md`).

---

## Průběh

### 1. Výběr zadání
- **Vstup:** screenshoty e-mailu se zadáním A (databáze investorů) a B (landing page).
- **Moje první pochopení:** A = hlavně backend + databáze, B = hlavně design.
- **AI opravila:** A je spíš sběr a ověřování dat (pravidla zařazení, zdroje, měření přesnosti, past na halucinace LLM), databáze je jen výstup. B je frontend + copywriting + konverzní marketing + měření funnelu + nasazení. Obě zadání hlavně testují práci s AI (README, `ai-log`).
- **Rozhodnutí:** B. Je ohraničenější (deadline týden při směnách), staví na JS/PHP, které umím, a výsledek je vidět na URL.

### 2. Co je landing page
- Ujasnění: není to homepage webu, ale samostatná stránka s jedním cílem (získat kontakt), bez navigace, navazující na reklamu.

### 3. Koncept obsahu
- **Můj nápad:** real-time srovnání výnosů, třeba S&P 500 vs bitcoin.
- **AI navrhla změnu:**
  - real-time nemá smysl pro horizont let, jen přidává riziko (API klíče, limity, výpadky) → historická data uložená jako JSON se zdrojem a datem
  - bitcoin vynechat: hlavní spot BTC ETF nejsou na NYSE, BTC grafy působí jako „zbohatni rychle“ a nesedí na opatrnou cílovku
- **Výsledek:** kalkulačka „kolik budu mít za X let“ v Kč, se srovnáním fondů a dopadem poplatků (TER).

### 4. Statistika „90 % traderů prodělá“
- **Můj nápad:** dát ji do patičky.
- **AI upozornila:**
  - číslo nemá jasný zdroj (zadání chce data se zdrojem)
  - patička je špatné místo, je to hlavní argument stránky
- **Náhrada:** SPIVA report (S&P Dow Jones Indices), kolik aktivních fondů zaostane za S&P 500. Umístění do sekce „Proč pasivně“.

### 5. Regulatorní háček (našla AI)
- Čeští retail investoři americké ETF z NYSE přes EU brokera nekoupí (PRIIPs, chybí KID).
- **Rozhodnutí:** porovnávat NYSE ETF (splňuje zadání), ale u každého ukázat UCITS ekvivalent, který jde reálně koupit.

### 6. Rešerše zdrojů (web search)
AI dohledala a ověřovala:
- podagenty v Claude Code (`.claude/agents/`, pole `model`) + nahlášený bug s `CLAUDE_CODE_SUBAGENT_MODEL=inherit`
- ccusage pro logování tokenů
- kurzy: ČNB (TXT za celý rok), Frankfurter (ECB, bez klíče)
- ceny ETF: Alpha Vantage, Yahoo Finance, Stooq
- měření: PostHog free tier, cookieless režim
- e-mail: Resend free tier; DB: Supabase
- SPIVA U.S. Year-End 2025
- PRIIPs / UCITS

### 7. Hosting – změna směru (můj návrh)
- **Původní plán AI:** Vercel + Supabase + PostHog.
- **Můj návrh:** vlastní infra – subdoména na Forpsi, HAProxy, webový server, vlastní MariaDB pro leady i měření.
- **AI doplnila:**
  - samostatná subdoména místo podstránky OpiceBotu (izolace od produkčního webu)
  - minimální práva DB uživatele, `.env` mimo document root
  - zkontrolovat, že ven je otevřený jen 443/80 (na LANu běží i MariaDB a LLM server)
  - vlastní first-party měření místo PostHogu, admin funnel za basic auth
- **Záloha:** nejdřív Vercel, nakonec **GitHub Pages** (můj návrh, stejné repo, bez další registrace). AI doplnila omezení: Pages umí jen statiku, takže je potřeba CORS na API a formulář při výpadku domácího serveru nefunguje.

### 8. Tajné údaje
- **Můj požadavek:** `.env` s údaji k DB, který nepůjde na GitHub.
- **AI doplnila:**
  - `.env.example` do repa, `.gitignore` vytvořit jako první
  - zakázat Claude Code čtení `.env` (`.claude/settings.json`), jinak hesla skončí v `/export` logu
  - commitnutý `.env` nejde smazat z historie → jediné řešení je změnit hesla

### 9. Export konverzací
- Ujasněno: `ai-log/` je povinná část. `/export` po každé session, před `/clear`, kontrola tajných údajů před commitem, nemazat chyby a slepé uličky.

---

## Kde jsem musel AI opravit nebo usměrnit
- **Hosting:** AI navrhla hotové cloudové služby. Vlastní infru jsem zvolil já. AI pak přizpůsobila celý plán (DB, měření, bezpečnost).
- **Záloha:** Vercel jsem vyřadil a nahradil GitHub Pages.

## Kde AI sama upozornila na nejistotu (k ověření v implementaci)
- **SPIVA:** čísla za 15 a 20 let pocházela ze sekundárního zdroje → ověřit v PDF reportu
- **Stooq:** protichůdné informace, jestli už vyžaduje API klíč
- **Alpha Vantage:** zdroje uvádějí různé denní limity free tieru
- **Frankfurter:** přesný formát URL ověřit v dokumentaci
- **Daně (časový test):** pravidla se od 2025 měnila → ověřit
- **Verze GitHub Actions:** ověřit aktuální verze

Tyhle body převezme `data-verifier` agent a výsledky se zapíšou do `ai-log/errors.md`.

## Co si z toho beru do implementace
- AI dobře dohledává a strukturuje, ale u čísel (limity API, statistiky) se pletou zdroje → každé číslo ověřit u primárního zdroje.
- Nejlepší výsledky vznikly, když jsem dal vlastní směr (hosting) a AI ho rozpracovala, ne když jsem jen převzal první návrh.
