# Zadání B – Konverzní landing page (ETF pro českého drobného investora)

Pracovní poznámky. Deadline: **16. 10. 2026** (odpověď na e-mail Mateje Lörince, Clientelo).

> Plánovací poznámky vytvořené v Claude chatu před začátkem implementace. Jak vznikly: `ai-log/00-planovani-claude-chat.md`.

---

## 1. Co zadání reálně chce (checklist)

**Odevzdává se:**
- [ ] Odkaz na veřejný GitHub repozitář
- [ ] URL nasazené stránky (vlastní infra, zrcadlo frontendu na GitHub Pages)
- [ ] V repu: obě verze reklamy, kód s **průběžnou historií commitů** (ne jeden mega commit na konci)
- [ ] Složka `ai-log/` s exportem konverzací z Claude Code (příkaz `/export`)
- [ ] README

**README musí obsahovat:**
- [ ] Jak jsem pracoval s AI: jaké pokyny dostali agenti, jak jsem kontroloval jejich výstup, **kde se spletli**
- [ ] Cílovou skupinu, co návštěvník dostane za kontakt a v jakém momentu o něj žádám
- [ ] Zdůvodnění pořadí sekcí
- [ ] Očekávanou konverzi (a z čeho odhad vychází)
- [ ] 3 hypotézy na A/B test seřazené podle očekávaného dopadu
- [ ] Rozhodnutí v nejasných bodech zadání + proč (NYSE vs UCITS, vlastní hosting místo Vercelu, vlastní měření)
- [ ] Co v řešení chybí (pokud něco nestihnu)

**Hlavní hodnoticí otázka:** „Mohli bychom na to zítra pustit reklamu?“
Takže: funguje na mobilu, rychle se načte, formulář reálně ukládá, po odeslání něco přijde, měření běží, stránka je dostupná, nic nevypadá jako generický Claude výstup.

---

## 2. Koncept stránky

### Cílovka
Český drobný investor, 25–40 let, má pár tisíc měsíčně navíc, slyšel o ETF, neví kde začít, bojí se poplatků a „nechci to podělat“. Přichází z reklamy na mobilu (IG/FB/TikTok), na stránce je pár sekund.

### Výměna hodnoty (lead magnet)
- **Zdarma bez e-mailu:** interaktivní kalkulačka „kolik budu mít za X let“ + srovnání fondů → hodnota je vidět **před** formulářem (zadání to přímo chce)
- **Za e-mail:** kompletní srovnání v PDF + „jak tyhle ETF koupit z ČR krok za krokem“ (broker, UCITS varianta, daně)

### Kritický háček: PRIIPs
Zadání chce **ETF obchodované na NYSE**. Jenže český retail investor US ETF (VOO, SPY, VT…) přes běžného EU brokera **koupit nemůže** – PRIIPs vyžaduje KID dokument a americké fondy ho nevydávají. Brokeři je retailu blokují.

**Řešení (zdůvodnit v README):** porovnávám NYSE ETF (splněno zadání, nejdelší historie dat), ale u každého ukážu **UCITS ekvivalent** (irský fond na evropské burze, např. S&P 500 → CSPX/VUAA), který si Čech reálně koupí.

> Pozor: NYSE vs NYSE Arca. Většina velkých ETF (SPY, VOO, VT) se obchoduje na **NYSE Arca**, což je burza skupiny NYSE. QQQ je na Nasdaqu → nebrat. V README napsat, že NYSE beru včetně NYSE Arca.

### Pořadí sekcí (návrh)
1. **Hero** – navazuje 1:1 na text reklamy + rovnou kalkulačka nebo její náhled (výsledek v první obrazovce)
2. **Kalkulačka** – měsíční vklad v Kč, horizont, výběr 2–3 fondů → graf + výsledná částka + **kolik sežerou poplatky**
3. **CTA #1** – „Pošli mi celé srovnání + návod na nákup z ČR“ (e-mail, 1 pole)
4. **Proč pasivně** – SPIVA statistika (viz níže), krátce
5. **Srovnávací tabulka/kartičky** – TER, co sleduje, výnos 5/10/20 let, akum./distrib., UCITS alternativa
6. **CTA #2** – stejný formulář
7. **Mini FAQ** – „můžu to koupit z ČR?“, „daně?“, „kolik minimálně?“
8. **Patička** – zdroje dat + datum, „minulé výnosy nezaručují budoucí“, není investiční doporučení, GDPR

Zdůvodnění pro README: návštěvník má pár sekund → hodnota hned (kalkulačka), CTA ve chvíli, kdy viděl svůj výsledek a je nejvíc „nahřátý“, důvěryhodnost (SPIVA, zdroje) až potom pro ty, kdo váhají.

### Dvě verze reklamy (nápady)
- **A – šok z poplatků:** „Kolik tě za 20 let stojí 1% poplatek? Spočítej si to za 10 vteřin.“
- **B – konkrétní příběh:** „2 000 Kč měsíčně do S&P 500 od roku 2010. Kolik by to bylo dnes?“
- Hero stránky má **dvě varianty textu** podle reklamy (`?ad=a` / `?ad=b` v URL).

### A/B hypotézy (návrh pořadí, finálně zdůvodnit)
1. **Výsledek kalkulačky zdarma vs. částečně zamčený za e-mail** – největší vliv na konverzi i kvalitu leadů
2. **Hero navazující na reklamu vs. obecný hero** – message match
3. **Jen e-mail vs. e-mail + jméno** – počet polí

### Očekávaná konverze
Neodhadovat z hlavy. Najít benchmark konverze lead-magnet landing pages z placeného sociálního provozu **se zdrojem**, uvést rozsah a proč čekám spodní/horní hranu (mobil, finance = nízká důvěra, studený provoz).

---

## 3. Data – kde je vzít zdarma

### Princip
**Žádné real-time API na stránce.** Data stáhnu jednou skriptem → uložím jako JSON do repa → stránka čte statický JSON. Rychlé, žádné API klíče ve frontendu, nic nespadne při hodnocení, u každého čísla je zdroj + datum stažení.

```
/public/data             # v public/, aby je servíroval web i GitHub Pages
  prices/VOO.json        # měsíční adjusted close
  prices/VT.json
  fx/usdczk.json         # měsíční kurz
  funds.json             # TER, popis, UCITS ekvivalent, zdroj, datum
  meta.json              # odkud a kdy stáhnuto
/scripts
  fetch-prices.js
  fetch-fx.js
```

Každý záznam:
```json
{ "ticker": "VOO", "ter": 0.03, "source": "https://investor.vanguard.com/...", "retrieved": "2026-10-09" }
```

### Ceny ETF (historie)
| Zdroj | Free | Poznámka |
|---|---|---|
| **Alpha Vantage** | ano, s klíčem, cca 25 req/den | Pro roky stačí **měsíční adjusted** endpoint = 1 request na fond. Ověř, že je ve free tieru. |
| **Yahoo Finance** (`yahoo-finance2` v Node) | ano, neoficiální | Nejpohodlnější, v README uvést Yahoo Finance + datum |
| **Stooq** | CSV ke stažení | Někde se uvádí, že už chce API klíč – ověřit |

**Důležité:** brát **adjusted close** (počítá s dividendami), jinak výnos podstřelíš. Kontrola přesnosti: porovnat výsledek s oficiálním výnosem emitenta (Vanguard/iShares/SPDR uvádí 1/5/10 let) → zároveň „jak jsem kontroloval AI“.

### TER a parametry fondů
- Oficiální stránky emitentů (Vanguard, iShares, SPDR) – factsheet
- **justETF** – UCITS ekvivalenty, TER, domicil
- Ručně ověřit, nespoléhat na to, co si AI „pamatuje“ (typická halucinace = zastaralý TER)

### Kurz USD/CZK
| Zdroj | Proč |
|---|---|
| **ČNB** (preferovat) | Oficiální kurz pro Čechy. Celý rok najednou: `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/rok.txt?rok=2015` (jeden request na rok). Denní: `.../denni_kurz.txt?date=DD.MM.RRRR` |
| **Frankfurter** (záloha) | Zdarma, bez klíče, ECB data od 1999, časové řady: `https://api.frankfurter.dev/v1/2010-01-01..?from=USD&to=CZK` (ověř formát URL v dokumentaci) |

Přepočet: měsíční vklad v Kč → převod kurzem daného měsíce → nákup podílů → hodnota dnes × dnešní kurz. Ukáže to i kurzové riziko (bonus, většina srovnávačů to nemá).

### SPIVA (argument „proč pasivně“)
- S&P Dow Jones Indices, **SPIVA U.S. Year-End 2025**: https://www.spglobal.com/spdji/en/spiva/article/spiva-us/
- Za rok 2025: 79 % aktivních large-cap fondů zaostalo za S&P 500
- Za 15 let cca 90 %, za 20 let cca 93 % → **čísla ověřit přímo v PDF reportu**
- Do patičky NE, patří do sekce „Proč pasivně“

---

## 4. Hosting – vlastní infra + zrcadlo na GitHub Pages

### Proč vlastní infra (do README)
Zadání říká „napríklad Vercel“ → vlastní řešení je OK, jen zdůvodnit:
- kontrola nad daty (leady zůstávají u mě, GDPR)
- first-party měření bez třetích stran a cookie lišty
- žádné vendor limity
- ukazuje DevOps skill (DNS, reverse proxy, TLS, DB)

**Riziko:** dostupnost domácí infry (proud, restart Hyper-V, IP). **Řešení:** statický frontend zrcadlit na **GitHub Pages** (zdarma, stejné repo, žádná další registrace). V README uvést obě URL.

**Omezení GitHub Pages:** jen statika, PHP tam neběží. Stránka i kalkulačka fungují, ale formulář a eventy musí posílat na API na vlastní infře → potřeba CORS. Když spadne domácí server, na zrcadle funguje kalkulačka, ale formulář ne (zapsat do README jako známé omezení).

#### API adresa ve frontendu
```js
// na vlastní doméně relativní cesta, na GitHub Pages absolutní
const API_BASE = location.hostname.endsWith('github.io')
  ? 'https://etf.opicebot.cz'
  : '';

fetch(`${API_BASE}/api/lead.php`, { method: 'POST', body: JSON.stringify(data) });
```

#### CORS v PHP (začátek `lead.php` a `event.php`)
```php
<?php
$allowed = ['https://UZIVATEL.github.io'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
```
Pozor: `navigator.sendBeacon` posílá cross-origin bez preflightu jen s „jednoduchým“ content-type → eventy posílat jako `text/plain` a v PHP číst `file_get_contents('php://input')` + `json_decode`.

#### Deploy na Pages – `.github/workflows/pages.yml`
Nasadí jen statiku z `public/`, bez `api/` a `admin/` (PHP soubory by se jinak zobrazily jako text).
```yaml
name: Deploy GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/checkout@v4
      - run: rsync -a --exclude api --exclude admin public/ _site/
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - uses: actions/deploy-pages@v4
```
V nastavení repa: Settings → Pages → Source: **GitHub Actions**. Verze actions ověřit v jejich repozitářích.

### Architektura
```
Internet
  → Forpsi DNS (A záznam etf.opicebot.cz → veřejná IP)
  → router (jen 443 + 80 kvůli certifikátu) → HAProxy 192.168.1.200 (TLS, Let's Encrypt)
  → routing podle Host hlavičky → web 192.168.1.175 (nginx + PHP)
  → MariaDB (localhost na .175)
```

- **Samostatná subdoména** `etf.opicebot.cz`, NE podstránka OpiceBotu → nesahám do produkčního webu, žádný mix brandů
- **Ověřit statickou veřejnou IP**, jinak DDNS

### HAProxy (.200)
Do stávajícího frontendu:
```
    acl host_etf hdr(host) -i etf.opicebot.cz
    use_backend etf_backend if host_etf

backend etf_backend
    server etf1 192.168.1.175:80 check
```

### nginx vhost (.175)
Document root = `public/`, `.env` leží o úroveň výš.
```nginx
server {
    listen 80;
    server_name etf.opicebot.cz;
    root /var/www/etf-landing/public;
    index index.html;

    # pojistka: nikdy neservírovat dotfiles (.env, .git)
    location ~ /\. {
        deny all;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;   # ověř cestu k socketu
    }
}
```

### Bezpečnost při otevření ven
- Router forwarduje **jen 443 (a 80 kvůli certifikátu) na HAProxy**, nic jiného
- MariaDB je na LANu (bind-address změněný) a llama-server běží na `0.0.0.0:8080` → nesmí být dostupné zvenku, HAProxy na ně nesmí routovat
- Admin stránka za basic auth

---

## 5. Databáze (MariaDB) – leady + eventy

Vlastní databáze a uživatel s minimem práv, ne root ani OpiceBot uživatel:

```sql
CREATE DATABASE etf_lp CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci;

CREATE USER 'etf_lp'@'localhost' IDENTIFIED BY 'SILNE_HESLO';
GRANT SELECT, INSERT ON etf_lp.* TO 'etf_lp'@'localhost';

USE etf_lp;

CREATE TABLE leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  consent TINYINT(1) NOT NULL,
  ad_variant CHAR(1),
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_email (email)
);

CREATE TABLE events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  event VARCHAR(50) NOT NULL,
  ad_variant CHAR(1),
  props JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_time (event, created_at),
  INDEX idx_session (session_id)
);
```

- `session_id` generovat ve frontendu (`crypto.randomUUID()`), držet v `sessionStorage` → **žádná cookie, žádné IP** → bez cookie lišty
- Heslo `SILNE_HESLO` jen do `.env`, nikam jinam

---

## 6. Backend (PHP) a formulář

PHP s PDO a prepared statements – můj jazyk, u pohovoru obhájím každý řádek.

Endpointy:
- `public/api/lead.php` – uloží e-mail, pošle e-mail s PDF
- `public/api/event.php` – uloží event z funnelu
- `public/admin/` – vyhodnocení (za basic auth)

Ochrana:
- validace e-mailu (`filter_var(..., FILTER_VALIDATE_EMAIL)`)
- **honeypot** pole (skryté, bot ho vyplní → zahodit)
- jednoduchý rate limit
- `UNIQUE` na e-mail → duplicitní odeslání nespadne, jen vrátí OK

Formulář:
- 1 pole: e-mail + souhlas se zpracováním (GDPR) + odkaz na krátké zásady
- Po odeslání děkovací stav **na stejné stránce** + „PDF je na cestě do schránky“ + co dál

**E-mail s PDF:** SMTP schránka na Forpsi (je k doméně), nebo Resend (free ~3 000/měsíc, 100/den).

---

## 7. `.env` a tajné údaje

### Struktura projektu
```
etf-landing/
  .env              # skutečné údaje, NIKDY do gitu
  .env.example      # vzor s prázdnými hodnotami, do gitu jde
  .gitignore
  .claude/
    settings.json   # zákaz čtení .env pro Claude Code
    agents/         # definice podagentů
  config.php        # načte .env (mimo public/)
  public/           # document root – jen tohle je vidět z webu
    index.html
    api/
      lead.php
      event.php
    admin/
    data/           # JSON s daty (servíruje se)
  scripts/
  .github/
    workflows/
      pages.yml     # deploy zrcadla na GitHub Pages
  ai-log/
  docs/
    zadanie-B-poznamky.md   # tento plán
  README.md
```

**`.env` musí ležet mimo document root.** Kdyby byl vedle `index.html`, kdokoli si ho stáhne přes `https://etf.opicebot.cz/.env`.

### `.gitignore` (vytvořit ÚPLNĚ PRVNÍ, před prvním commitem)
```
.env
.env.*
!.env.example
```

### `.env.example`
```
DB_HOST=localhost
DB_NAME=etf_lp
DB_USER=etf_lp
DB_PASS=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
ADMIN_USER=
ADMIN_PASS=
```

### `config.php` (bez Composeru)
```php
<?php
function loadEnv(string $path): void {
    if (!is_readable($path)) {
        throw new RuntimeException('.env nenalezen');
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value, " \t\"'");
    }
}

loadEnv(__DIR__ . '/.env');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4",
            $_ENV['DB_USER'],
            $_ENV['DB_PASS'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
        );
    }
    return $pdo;
}
```

V `public/api/lead.php`: `require __DIR__ . '/../../config.php';`

### Claude Code nesmí číst `.env`
Jinak hesla skončí v `/export` logu na GitHubu. `.claude/settings.json` (commitnout – hodnotitel uvidí, že na to myslím):
```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```

### Kdyby `.env` přece jen skončil v commitu
Smazání v dalším commitu **nepomůže**, zůstane v historii. Jediné řešení: **změnit heslo v DB** (a SMTP).

Do README jedna věta: „Konfigurace v `.env` (vzor v `.env.example`), mimo document root, Claude Code má čtení `.env` zakázané.“

---

## 8. Měření celé cesty (funnel) – vlastní, do MariaDB

Místo PostHogu vlastní first-party měření → neblokují ho adblockery, data u mě, žádná cookie lišta. Silnější ukázka skillu.
(Záloha, kdybych nestíhal: PostHog free – 1M eventů/měsíc, cookieless režim, funnely.)

### Eventy
| Event | Kdy |
|---|---|
| `page_view` + `ad_variant` (a/b), `utm_*` | příchod |
| `scroll_50`, `scroll_90` | zájem |
| `calc_interact` | první změna v kalkulačce |
| `calc_result_viewed` | uviděl výsledek |
| `cta_click` + `position` (1/2) | klik na CTA |
| `form_focus` | začal vyplňovat |
| `form_submit` | odeslal |
| `form_success` / `form_error` | výsledek |

Frontend posílá přes `navigator.sendBeacon('/api/event.php', ...)` (nespadne ani při zavření stránky).

### Admin / vyhodnocení (`public/admin/`, basic auth)
- Funnel: `page_view → calc_interact → cta_click → form_submit → form_success` s počty a % přechodu
- Rozpad podle `ad_variant` (A vs B) = podklad pro A/B
- Veřejně maximálně agregáty, **seznam e-mailů nikdy veřejně**
- Screenshot funnelu (i s testovacími daty) do README

Ukázkový dotaz na funnel:
```sql
SELECT ad_variant,
  COUNT(DISTINCT CASE WHEN event='page_view'     THEN session_id END) AS views,
  COUNT(DISTINCT CASE WHEN event='calc_interact' THEN session_id END) AS calc,
  COUNT(DISTINCT CASE WHEN event='cta_click'     THEN session_id END) AS cta,
  COUNT(DISTINCT CASE WHEN event='form_success'  THEN session_id END) AS leads
FROM events
GROUP BY ad_variant;
```

---

## 9. AI workflow (hlavní věc, kterou hodnotí)

### Orchestrátor + podagenti v Claude Code
Hlavní session = velký model (Opus) jako **vedoucí**: plánuje, rozděluje práci, reviewuje. Menší modely dělají konkrétní úkoly.

Agenti v `.claude/agents/*.md` (commitnout → hodnotitel vidí přesné pokyny):

| Agent | Model | Úkol |
|---|---|---|
| `data-fetcher` | haiku | napsat a spustit fetch skripty, uložit JSON |
| `data-verifier` | sonnet | porovnat výnosy s oficiálními čísly emitentů, nahlásit odchylky |
| `copywriter` | sonnet | texty v češtině pro cílovku, 2 verze reklamy |
| `frontend` | sonnet | HTML/CSS/JS, mobile-first |
| `backend` | sonnet | PHP endpointy, SQL |
| `reviewer` | opus (nebo hlavní session) | kontrola proti checklistu ze sekce 1 + bezpečnost |

Příklad `.claude/agents/data-verifier.md`:
```markdown
---
name: data-verifier
description: Ověřuje finanční data proti oficiálním zdrojům. Použij po každém stažení dat.
model: sonnet
tools: Read, Bash, WebFetch
---
Jsi kontrolor dat. U každého fondu v /data:
1. Spočítej výnos za 5 a 10 let z /data/prices.
2. Porovnej s oficiálním výnosem na webu emitenta.
3. Odchylka > 0,5 p.b. = chyba, zapiš do ai-log/errors.md.
Nikdy si čísla nevymýšlej. Když zdroj nenajdeš, napiš NENALEZENO.
```

> **Pozor na bug:** s env proměnnou `CLAUDE_CODE_SUBAGENT_MODEL=inherit` můžou podagenti ignorovat `model:` a běžet na drahém Opusu. Nenastavovat. Po prvním běhu ověřit v logu (`~/.claude/projects/<projekt>/...` → grep `"model"`), že haiku agent běžel na Haiku.

### Logování tokenů a ceny
- **ccusage** (CLI, čte lokální logy Claude Code): `npx ccusage@latest session --json` → tokeny + odhad ceny v USD po sessions a modelech
- V Claude Code taky `/cost`
- Na konci každé fáze zapsat do `ai-log/usage.md`:

```markdown
| Fáze | Agent/model | Input tok | Output tok | Cache | Odhad USD | Poznámka |
|---|---|---|---|---|---|---|
| Data | data-fetcher / haiku | ... | ... | ... | ... | 1 retry kvůli formátu ČNB |
```

- Na předplatném (Pro/Max) napsat, že USD je **odhad ekvivalentu API ceny**, ne reálně zaplacená částka
- V README shrnutí: kolik celkem, kolik % na který model, jestli se rozdělení na menší modely vyplatilo

### Export konverzací (`ai-log/`) – POVINNÉ
Zadání chce v `ai-log/` export konverzací s Claude Code přes `/export`.

- Na konci každé session: `/export ai-log/session-01-plan.txt`
- Exportovat **vždy před `/clear`** nebo zavřením session
- Pojmenovat podle fází: `session-01-plan`, `session-02-data`, `session-03-kalkulacka`…
- Když zapomenu: surové logy zůstávají v `~/.claude/projects/<projekt>/` jako JSONL
- **Před commitem projet export, jestli v něm nejsou hesla/klíče** (DB, SMTP)
- Nemazat slepé uličky a chyby – hledají právě „kde se AI spletla“
- Commitovat logy průběžně s kódem

```
ai-log/
  session-01-plan.txt     # /export z Claude Code
  session-02-data.txt
  ...
  usage.md                # tokeny a cena (ccusage)
  errors.md               # KDE SE AI SPLETLA – průběžně!
```

### `errors.md` – psát průběžně
Formát: co agent udělal → jak jsem to poznal → jak opraveno. Typické věci:
- vymyšlený nebo zastaralý TER
- výnos z neadjustované ceny (bez dividend)
- špatný ticker nebo burza (QQQ není NYSE)
- SQL bez prepared statements, `.env` v document rootu
- generický „AI“ design / texty
- tvrzení bez zdroje

### Commity
Po každém hotovém kroku s jasnou zprávou (`feat: kalkulačka – výpočet v CZK`, `fix: adjusted close místo close`). Historie má ukazovat postup.

---

## 10. Design – aby to nevypadalo jako „základní výstup od Claude“
- Žádné fialové gradienty, glassmorphism, emoji v nadpisech
- Vlastní paleta + 1 výrazný font (Google Fonts)
- Česky; tykání vs vykání rozhodnout a držet (cílovka 25–40 z reklamy → spíš tykání, zdůvodnit)
- Čísla velká a čitelná, graf jednoduchý (Chart.js nebo uPlot)
- Testovat na reálném telefonu + Lighthouse (rychlost = konverze)

---

## 11. Právní / důvěryhodnost minimum
- „Minulé výnosy nezaručují budoucí výnosy“
- „Nejedná se o investiční doporučení, informace mají vzdělávací charakter“
- Zdroj + datum u každého čísla
- GDPR souhlas u formuláře + kdo je správce dat (ukázkový, napsat do README)
- Daně (časový test 3 roky) – **ověřit aktuální pravidla**, od 2025 se měnila

---

## 12. Stack
- Frontend: statické HTML/CSS + vanilla JS (případně Vite), Chart.js / uPlot
- Backend: PHP + PDO
- DB: MariaDB (`etf_lp`)
- Web: nginx na 192.168.1.175, HAProxy na 192.168.1.200, Let's Encrypt
- DNS: Forpsi, subdoména `etf.opicebot.cz`
- E-mail: SMTP Forpsi / Resend
- Zrcadlo frontendu: GitHub Pages (jen statika, API běží na vlastní infře)
- Fetch skripty: Node

---

## 13. Plán po dnech (do 16. 10.)
| Den | Co |
|---|---|
| 1 | `.gitignore` jako první, repo, `.claude/settings.json`, agenti, CLAUDE.md s pravidly, plán v README |
| 2 | Fetch skripty, data + ověření proti emitentům, `errors.md` |
| 3 | Kalkulačka + výpočet v CZK |
| 4 | Texty, 2 reklamy, design, layout sekcí |
| 5 | DNS + HAProxy + vhost + TLS, MariaDB, `lead.php`, e-mail s PDF |
| 6 | `event.php`, frontend eventy, admin funnel, GitHub Pages zrcadlo + CORS, test na mobilu |
| 7 | README, usage.md, export logů, kontrola tajných údajů v logu, odeslat |

Rezerva: když nestihnu, priorita = funkční stránka + formulář + měření + README. Vlastní měření lze nahradit PostHogem. V README napsat, co chybí.

---

## Zdroje k ověření
- PRIIPs / US ETF pro EU retail: justETF, oficiální KID požadavky
- SPIVA: https://www.spglobal.com/spdji/en/spiva/article/spiva-us/
- ČNB kurzy: https://www.cnb.cz/cs/casto-kladene-dotazy/Kurzy-devizoveho-trhu-na-www-strankach-CNB
- Frankfurter: https://frankfurter.dev
- Claude Code subagenti: https://code.claude.com/docs/en/subagents
- ccusage: https://www.npmjs.com/package/ccusage
- PostHog (záloha): https://posthog.com/faq
