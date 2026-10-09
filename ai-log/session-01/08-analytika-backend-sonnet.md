# Session 01 – agent 08-analytika-backend-sonnet

Čitelný přepis exportu z Claude Code (desktopová aplikace, `/export` v ní není – export přes menu session). Výsledky nástrojů jsou zkrácené na 1500 znaků, obrázky a stažené PDF nejsou součástí. Bloky uvažování modelu nejsou součástí přepisu.

---

## 👤 Uživatel · 2026-10-09 19:11:52

Pracovní adresář: C:\Users\Administrator\Desktop\junior_ai_developer. Přečti CLAUDE.md, .claude/agents/backend.md (jsi agent backend), docs/zadanie-B-poznamky.md sekce 8 (měření – původní zadání), docs/design-a-rozhrani.md sekce 1 a 4, deploy/schema.sql, config.php a stávající public/admin/index.php. Nečti .env, necommituj. Na public/js a public/index.html nesahej (souběžně je upravuje hlavní session).

Úkol: přepiš public/admin/index.php na úplnou analytickou stránku „Analytika“ (zůstává za Apache basic auth, PHP 8.3, MariaDB 10.11, DB uživatel jen SELECT). Zachovej: noindex/no-store hlavičky, require config.php, htmlspecialchars na všechno, prepared statements, žádné e-maily nikde, při chybě DB jen obecná hláška + error_log.

Data: tabulky events (session_id, event, ad_variant, props JSON, created_at), leads (email – NIKDY nezobrazovat, consent, ad_variant, utm_source, utm_campaign, created_at), unsubscribes. Eventy: page_view (props utm_source, utm_campaign), scroll_50, scroll_90, calc_interact, calc_result_viewed, cta_click (props position: "hero" | 1 | 2), form_focus (position 1|2), form_submit (position), form_success (position), form_error (props reason: invalid_email|consent_required|rate_limited|server|network, position). Testovací návštěvy: session, která má v props KTERÉHOKOLI eventu klíč "test" (JSON_VALUE(props,'$.test') IS NOT NULL), plus session_id '00000000-0000-4000-8000-000000000000'.

Filtry (GET, validované): from, to (YYYY-MM-DD, default posledních 30 dní, to včetně), variant (all|a|b|none), test (0 = vyloučit testovací – default, 1 = jen testovací, 2 = vše). Filtr testů implementuj jednou CTE/poddotazem množiny testovacích session a aplikuj ho na všechny dotazy nad events. Formulář filtrů nahoře.

Sekce stránky (v tomto pořadí, karty dle designu: bg #0E1113, karta #161A1D, okraj #2A3035, text #ECE9E3, muted #9BA1A6, akcent #F2A541, fee/chyba #E8735A; systémové písmo; tabular-nums; responzivní, tabulky v overflow-x:auto):
1. KPI dlaždice: Návštěvy (unikátní session s page_view), Leady (unikátní session s form_success), Konverze návštěva→lead (%), Leady v DB za období (z tabulky leads, respektuje filtr variant; testy tu filtrovat nejde – poznámka), Odhlášení za období.
2. Funnel (hlavní graf zadání) – kroky: page_view → scroll_50 → calc_interact → calc_result_viewed → form_focus → form_submit → form_success. Pro každý krok: počet unikátních session, % z předchozího kroku, % z page_view, horizontální pruh (HTML/CSS, šířka = % z page_view). Session se do kroku počítá jen když má event (nezávisle na předchozích krocích – uveď to poznámkou).
3. A/B srovnání (varianta a vs b, sloupce): návštěvy, leady, konverze %, rozdíl konverzí v p.b., 95% interval spolehlivosti rozdílu (normální aproximace) a p-hodnota dvouvýběrového z-testu pro podíly (oboustranný; normální CDF implementuj sám, např. Abramowitz-Stegun aproximace erf). Pod tím verdikt česky: pokud některá varianta má < 100 návštěv → „Málo dat – zatím nerozhodovat“; jinak p < 0,05 → „Rozdíl je statisticky významný“ / jinak „Rozdíl zatím není průkazný“. Plus mezikroky A vs B: calc_interact %, form_focus %, form_submit % z návštěv.
4. Hloubka scrollu: % návštěv s scroll_50 a scroll_90 (podle variant).
5. CTA a formuláře podle pozice: tabulka řádky hero / 1 / 2 × sloupce cta_click, form_focus, form_submit, form_success (unikátní session; position z JSON_VALUE(props,'$.position') jako string).
6. Chyby formuláře: počet form_error podle reason (řádky) – počet eventů i unikátních session.
7. Zdroje návštěv: podle utm_source z page_view props (NULL → „(přímý / bez UTM)“): návštěvy, leady (session s form_success), konverze %. Limit 30 řádků.
8. Trend po dnech: pro každý den období návštěvy a leady – jednoduchý inline SVG sloupcový graf (návštěvy muted, leady akcent) + tabulka pod ním. Max 90 dní, při delším období agregace po týdnech.
9. Kvalita dat: celkem eventů v období, unikátních session, průměr eventů na session, počet vyloučených testovacích session, datum posledního eventu.

Technické: všechny dotazy přes PDO prepared statements; seznamy hodnot (eventy) přes placeholdery; JSON_VALUE je v MariaDB 10.11 dostupné. created_at je v zóně Europe/Prague (config.php nastavuje time_zone). Kód rozděl do malých funkcí (q(), pct(), ztest()), bez knihoven. Pod nadpisem malý odkaz „Popis metrik“ s rozbalovacím <details>, kde je 1 věta ke každé sekci (co měří, jak číst).

Ověření: PHP lokálně není – kód pečlivě zkontroluj očima, hlavně SQL (GROUP BY, aliasy, počet placeholderů vs parametrů) a escapování. Vrať: seznam změn, SQL dotazy, které považuješ za rizikové, a co má hlavní session otestovat na serveru.

---

## 👤 Uživatel · 2026-10-09 19:11:52

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
10	- E-mail: **Resend HTTP API** (cURL, bez Composeru); PDF jako odkaz, ne příloha
11	- Specifikace designu a rozhraní: `docs/design-a-rozhrani.md`
12	- Zrcadlo statiky: GitHub Pages, API přes CORS na aijunior.opicebot.cz
13	- Design: moderní **tmavý** styl, obsah v kartách se **scroll-reveal** animací
14	- Jazyk webu: čeština, **tykání**
15	
16	## Struktura
17	'''
18	public/        document root (index.html, css/, js/, data/, api/*.php, admin/)
19	config.php     načítá .env – leží MIMO public/
20	scripts/       Node skripty pro stažení dat → public/data/*.json
21	deploy/        Apache vhost, HAProxy snippet, schema.sql, INSTALL.md
22	ai-log/        exporty session, errors.md, usage.md
23	docs/          plánovací poznámky
24	.claude/agents definice podagentů
25	'''
26	
27	## Tvrdá pravidla
28	1. **Tajné údaje:** `.env` nikdy nečti, nevypisuj, necommituj. H
… [zkráceno, celkem 3410 znaků]
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\.claude\\agents\\backend.md"
}
```

<details><summary>výsledek nástroje</summary>

```
1	---
2	name: backend
3	description: Píše PHP endpointy (public/api/), admin funnel (public/admin/) a SQL (deploy/schema.sql). Použij pro jakoukoli serverovou logiku a databázi.
4	model: sonnet
5	tools: Read, Write, Edit, Glob, Grep, Bash
6	---
7	Jsi PHP vývojář. PHP 8.x bez Composeru, PDO + MariaDB.
8	
9	Pravidla:
10	- `.env` nikdy nečti ani nevypisuj. Konfiguraci ber z `config.php` (`require __DIR__ . '/../../config.php'`), proměnné viz `.env.example`.
11	- Vždy prepared statements, `ATTR_EMULATE_PREPARES=false`. Žádné skládání SQL ze vstupu.
12	- Validace: `filter_var(..., FILTER_VALIDATE_EMAIL)`, délky polí, whitelist hodnot (`ad_variant` jen a/b, `event` jen ze seznamu).
13	- `lead.php`: honeypot, jednoduchý rate limit, duplicitní e-mail vrátí OK (UNIQUE), e-mail s PDF přes Resend SMTP.
14	- `event.php`: čte `php://input` (`text/plain` z `sendBeacon`), `json_decode`, ukládá bez IP a bez cookies.
15	- CORS jen pro origin z `CORS_ORIGIN`, obsluha `OPTIONS` → 204.
16	- Odpovědi JSON `{ "ok": bool }`; výjimky loguj přes `error_log`, uživateli nikdy nevypisuj detaily.
17	- Admin za basic auth, zobrazuje agregace funnelu; seznam e-mailů nikdy veřejně.
18	- DB uživatel má jen SELECT, INSERT – nepoužívej UPDATE/DELETE.
19	
20	Vrať seznam souborů a stručně, jak endpoint otestovat (curl).
21	
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\deploy\\schema.sql"
}
```

<details><summary>výsledek nástroje</summary>

```
1	-- Schéma databáze etf_lp. Spustit jako root MariaDB: sudo mariadb < schema.sql
2	-- Uživatele s heslem vytváří INSTALL.md (krok 3) – heslo nepatří do souboru v gitu.
3	
4	CREATE DATABASE IF NOT EXISTS etf_lp CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci;
5	USE etf_lp;
6	
7	CREATE TABLE IF NOT EXISTS leads (
8	  id INT AUTO_INCREMENT PRIMARY KEY,
9	  email VARCHAR(255) NOT NULL,
10	  consent TINYINT(1) NOT NULL,
11	  ad_variant CHAR(1),
12	  utm_source VARCHAR(100),
13	  utm_campaign VARCHAR(100),
14	  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
15	  UNIQUE KEY uq_email (email)
16	) ENGINE=InnoDB;
17	
18	-- Odhlášení: DB uživatel smí jen SELECT/INSERT, proto se odhlášení zapisuje jako nový řádek
19	CREATE TABLE IF NOT EXISTS unsubscribes (
20	  id INT AUTO_INCREMENT PRIMARY KEY,
21	  email VARCHAR(255) NOT NULL,
22	  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
23	  UNIQUE KEY uq_unsub_email (email)
24	) ENGINE=InnoDB;
25	
26	CREATE TABLE IF NOT EXISTS events (
27	  id BIGINT AUTO_INCREMENT PRIMARY KEY,
28	  session_id CHAR(36) NOT NULL,
29	  event VARCHAR(50) NOT NULL,
30	  ad_variant CHAR(1),
31	  props JSON,
32	  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
33	  INDEX idx_event_time (event, created_at),
34	  INDEX idx_session (session_id)
35	) ENGINE=InnoDB;
36	
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\config.php"
}
```

<details><summary>výsledek nástroje</summary>

```
1	<?php
2	// Načte .env (leží vedle tohoto souboru, MIMO document root public/).
3	
4	function loadEnv(string $path): void {
5	    if (!is_readable($path)) {
6	        throw new RuntimeException('.env nenalezen');
7	    }
8	    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
9	        $line = trim($line);
10	        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
11	        [$key, $value] = explode('=', $line, 2);
12	        $_ENV[trim($key)] = trim($value, " \t\"'");
13	    }
14	}
15	
16	loadEnv(__DIR__ . '/.env');
17	
18	function db(): PDO {
19	    static $pdo = null;
20	    if ($pdo === null) {
21	        $pdo = new PDO(
22	            "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4",
23	            $_ENV['DB_USER'],
24	            $_ENV['DB_PASS'],
25	            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
26	        );
27	        // created_at ve stejné zóně jako PHP (Europe/Prague); offset, protože MariaDB nemusí mít načtené tabulky zón
28	        $offset = (new DateTimeImmutable('now', new DateTimeZone('Europe/Prague')))->format('P');
29	        $pdo->exec("SET time_zone = '$offset'");
30	    }
31	    return $pdo;
32	}
33	
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\admin\\index.php"
}
```

<details><summary>výsledek nástroje</summary>

```
1	<?php
2	declare(strict_types=1);
3	
4	// Basic auth řeší Apache (deploy/INSTALL.md, krok 5). Tady jen hlavičky a čtení agregací.
5	header('X-Robots-Tag: noindex, nofollow');
6	header('Cache-Control: no-store');
7	header('Content-Type: text/html; charset=utf-8');
8	
9	require __DIR__ . '/../../config.php';
10	date_default_timezone_set('Europe/Prague');
11	
12	function h(mixed $s): string
13	{
14	    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
15	}
16	
17	function parse_date(mixed $v): ?DateTimeImmutable
18	{
19	    if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
20	        return null;
21	    }
22	    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v);
23	    $err = DateTimeImmutable::getLastErrors();
24	    if ($d === false || ($err !== false && ($err['warning_count'] > 0 || $err['error_count'] > 0))) {
25	        return null;
26	    }
27	    return $d;
28	}
29	
30	function pct(int $a, int $b): string
31	{
32	    return $b > 0 ? number_format($a / $b * 100, 1, ',', ' ') . ' %' : '–';
33	}
34	
35	$today = new DateTimeImmutable('today');
36	$to = parse_date($_GET['to'] ?? null) ?? $today;
37	$from = parse_date($_GET['from'] ?? null) ?? $to->modify('-29 days');
38	if ($from > $to) {
39	    [$from, $to] = [$to, $from];
40	}
41	$fromSql = $from->format('Y-m-d 00:00:00');
42	$toSql = $to->modify('+1 day')->format('Y-m-d 00:00:00'); // exkluzivní horní mez
43	
44	$steps = [
45	    'page_view' => 'Zobrazení stránky',
46	    'calc_interact' => 'P
… [zkráceno, celkem 9671 znaků]
```
</details>

**→ Grep**

```
{
 "pattern": "^#+ ",
 "path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\docs",
 "output_mode": "content"
}
```

<details><summary>výsledek nástroje</summary>

```
docs\overeni-fakta.md:1:# Ověření faktů (data-verifier, 2026-10-09)
docs\overeni-fakta.md:5:## 1. PRIIPs / KID – proč běžný retail investor v EU/ČR nekoupí US ETF
docs\overeni-fakta.md:19:## 2. Daně z prodeje cenných papírů v ČR (fyzické osoby, nepodnikatelé)
docs\overeni-fakta.md:47:## 3. Burza SPY / VOO / VT
docs\overeni-fakta.md:59:## 4. SPIVA U.S. Year-End 2025
docs\zadanie-B-poznamky.md:1:# Zadání B – Konverzní landing page (ETF pro českého drobného investora)
docs\zadanie-B-poznamky.md:9:## 1. Co zadání reálně chce (checklist)
docs\zadanie-B-poznamky.md:32:## 2. Koncept stránky
docs\zadanie-B-poznamky.md:34:### Cílovka
docs\zadanie-B-poznamky.md:37:### Výměna hodnoty (lead magnet)
docs\zadanie-B-poznamky.md:41:### Kritický háček: PRIIPs
docs\zadanie-B-poznamky.md:48:### Pořadí sekcí (návrh)
docs\zadanie-B-poznamky.md:60:### Dvě verze reklamy (nápady)
docs\zadanie-B-poznamky.md:65:### A/B hypotézy (návrh pořadí, finálně zdůvodnit)
docs\zadanie-B-poznamky.md:70:### Očekávaná konverze
docs\zadanie-B-poznamky.md:75:## 3. Data – kde je vzít zdarma
docs\zadanie-B-poznamky.md:77:### Princip
docs\zadanie-B-poznamky.md:97:### Ceny ETF (historie)
docs\zadanie-B-poznamky.md:106:### TER a parametry fondů
docs\zadanie-B-poznamky.md:111:### Kurz USD/CZK
docs\zadanie-B-poznamky.md:119:### SPIVA (argument „proč pasivně“)
docs\zadanie-B-poznamky.md:127:## 4. Hosting – vlastní infra + zrcadlo na GitHub Pages
docs\zadanie-B-poznamky.md:129:### Proč vlastní infra (do README)
docs\zadanie-B
… [zkráceno, celkem 4388 znaků]
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\docs\\zadanie-B-poznamky.md",
 "offset": 411,
 "limit": 38
}
```

<details><summary>výsledek nástroje</summary>

```
411	## 8. Měření celé cesty (funnel) – vlastní, do MariaDB
412	
413	Místo PostHogu vlastní first-party měření → neblokují ho adblockery, data u mě, žádná cookie lišta. Silnější ukázka skillu.
414	(Záloha, kdybych nestíhal: PostHog free – 1M eventů/měsíc, cookieless režim, funnely.)
415	
416	### Eventy
417	| Event | Kdy |
418	|---|---|
419	| `page_view` + `ad_variant` (a/b), `utm_*` | příchod |
420	| `scroll_50`, `scroll_90` | zájem |
421	| `calc_interact` | první změna v kalkulačce |
422	| `calc_result_viewed` | uviděl výsledek |
423	| `cta_click` + `position` (1/2) | klik na CTA |
424	| `form_focus` | začal vyplňovat |
425	| `form_submit` | odeslal |
426	| `form_success` / `form_error` | výsledek |
427	
428	Frontend posílá přes `navigator.sendBeacon('/api/event.php', ...)` (nespadne ani při zavření stránky).
429	
430	### Admin / vyhodnocení (`public/admin/`, basic auth)
431	- Funnel: `page_view → calc_interact → cta_click → form_submit → form_success` s počty a % přechodu
432	- Rozpad podle `ad_variant` (A vs B) = podklad pro A/B
433	- Veřejně maximálně agregáty, **seznam e-mailů nikdy veřejně**
434	- Screenshot funnelu (i s testovacími daty) do README
435	
436	Ukázkový dotaz na funnel:
437	'''sql
438	SELECT ad_variant,
439	  COUNT(DISTINCT CASE WHEN event='page_view'     THEN session_id END) AS views,
440	  COUNT(DISTINCT CASE WHEN event='calc_interact' THEN session_id END) AS calc,
441	  COUNT(DISTINCT CASE WHEN event='cta_click'     THEN session_id END) AS cta,
442	  COUN
… [zkráceno, celkem 1639 znaků]
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\docs\\design-a-rozhrani.md",
 "limit": 52
}
```

<details><summary>výsledek nástroje</summary>

```
1	# Design a rozhraní (zadání pro agenty frontend a backend)
2	
3	Rozhodnutí hlavní session. Agenti se jich drží, odchylku nejdřív nahlásí.
4	
5	## 1. Vizuální styl
6	
7	**Charakter:** klidný tmavý „finanční nástroj“, ne kryptoweb. Hlavní je velké číslo výsledku. Dekorace jen tam, kde nese informaci.
8	
9	### Barvy (CSS proměnné na `:root`)
10	| Token | Hodnota | Použití |
11	|---|---|---|
12	| `--bg` | `#0E1113` | pozadí stránky (grafit) |
13	| `--surface` | `#161A1D` | karty |
14	| `--surface-2` | `#1D2226` | vstupy, vnořené bloky |
15	| `--border` | `#2A3035` | 1px okraje karet |
16	| `--text` | `#ECE9E3` | text (teplá lomená bílá) |
17	| `--muted` | `#9BA1A6` | popisky, poznámky |
18	| `--accent` | `#F2A541` | peníze, výsledek, hlavní CTA (jantarová) |
19	| `--accent-ink` | `#1A1205` | text na jantarovém tlačítku |
20	| `--fee` | `#E8735A` | „kolik sežerou poplatky“ |
21	| `--invested` | `#6F7C85` | vložená částka v grafu |
22	
23	Kontrast textu vůči pozadí musí splnit WCAG AA. Žádné gradienty přes celou plochu, žádný glassmorphism ani neon.
24	
25	### Typografie
26	- Nadpisy a velká čísla: **Bricolage Grotesque** (Google Fonts, `latin-ext` kvůli češtině, `display=swap`, jen váhy 600 a 800).
27	- Text: systémový stack `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (rychlost).
28	- Čísla vždy `font-variant-numeric: tabular-nums`, formát `Intl.NumberFormat('cs-CZ')`, „1 608 004 Kč“.
29	- Výsledek kalkulačky: `clamp(2.5rem, 9vw, 4.5rem)`.
30	
31	### Layout
32	- M
… [zkráceno, celkem 2753 znaků]
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\docs\\design-a-rozhrani.md",
 "offset": 83,
 "limit": 13
}
```

<details><summary>výsledek nástroje</summary>

```
83	## 4. Měření – `js/track.js`
84	'''js
85	track(event, props = {})   // globální funkce
86	'''
87	- `session_id`: `crypto.randomUUID()` v `sessionStorage` (klíč `lp_sid`), žádné cookies.
88	- `ad_variant`: `a` / `b` / `null` z `?ad=`; `utm_source`, `utm_campaign` z URL (uložit do `sessionStorage`).
89	- Odeslání: `navigator.sendBeacon(API_BASE + '/api/event.php', new Blob([JSON.stringify(payload)], { type: 'text/plain' }))`.
90	- Payload: `{ session_id, event, ad_variant, props }`.
91	- `API_BASE`: `''` na vlastní doméně, `'https://aijunior.opicebot.cz'` když `location.hostname.endsWith('github.io')`.
92	
93	Eventy: `page_view` (props: utm), `scroll_50`, `scroll_90`, `calc_interact` (jen první změna), `calc_result_viewed` (výsledek ve viewportu po interakci, jednou), `cta_click` (`{position: 1|2}`), `form_focus` (jednou na formulář), `form_submit`, `form_success`, `form_error` (`{reason}`).
94	
95	## 5. Formulář ⇄ `api/lead.php`
```
</details>

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\admin\\index.php",
 "content": "<?php\ndeclare(strict_types=1);\n\n// Analytika. Basic auth řeší Apache (deploy/INSTALL.md, krok 5). Tady jen hlavičky a čtení agregací (jen SELECT).\nheader('X-Robots-Tag: noindex, nofollow');\nheader('Cache-Control: no-store');\nheader('Content-Type: text/html; charset=utf-8');\n\nrequire __DIR__ . '/../../config.php';\ndate_default_timezone_set('Europe/Prague');\n\nconst NIL_SESSION = '00000000-0000-4000-8000-000000000000';\nconst MIN_VISITS = 100;\nconst MAX_RANGE_DAYS = 730;\n\n// ---------------------------------------------------------------- pomocné funkce\n\nfunction h(mixed $s): string\n{\n    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');\n}\n\nfunction num(int|float $n, int $dec = 0): string\n{\n    return number_format($n, $dec, ',', \"\\u{00A0}\");\n}\n\nfunction parse_date(mixed $v): ?DateTimeImmutable\n{\n    if (!is_string($v) || !preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $v)) {\n        return null;\n    }\n    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v);\n    $err = DateTimeImmutable::getLastErrors();\n    if ($d === false || ($err !== false && ($err['warning_count'] > 0 || $err['error_count'] > 0))) {\n        return null;\n    }\n    return $d;\n}\n\n/** Podíl v procentech jako číslo (0 při dělení nulou). */\nfunction pctf(int|float $a, int|float $b): float\n{\n    return $b > 0 ? $a / $b * 100 : 0.0;\n}\n\n/** Podíl v proce
… [zkráceno, celkem 29102 znaků]
```

<details><summary>výsledek nástroje</summary>

```
The file C:\Users\Administrator\Desktop\junior_ai_developer\public\admin\index.php has been updated successfully. (file state is current in your context — no need to Read it back)
```
</details>

### 🤖 claude-sonnet-5-5 · 2026-10-09 19:15:11

Úplná stránka „Analytika“ je přepsaná v `C:\Users\Administrator\Desktop\junior_ai_developer\public\admin\index.php`. PHP tu lokálně není, takže kód jsem jen pečlivě prošel očima, nic jsem nespouštěl. Kontroloval jsem hlavně počet a pořadí placeholderů a aliasy v `GROUP BY`. `.env`, `public/js` a `public/index.html` jsem nečetl ani neměnil, nic jsem necommitoval.

## Seznam změn
- **Zachováno:**
  - hlavičky noindex a no-store,
  - `require config.php`,
  - `h()` na každém výstupu,
  - prepared statements,
  - žádné e-maily (tabulka `leads` se čte jen přes `COUNT(*)`),
  - při chybě DB jen obecná hláška „Data se nepodařilo načíst.“ a `error_log`.
- **Funkce:** `q()`, `q_plain()`, `ev_cte()`, `pct()`/`pctf()`, `ztest()` s vlastním `erf` (Abramowitz–Stegun 7.1.26) a `norm_cdf()`, `trend_svg()`, `cnt()` a `placeholders()`.
- **Filtry:**
  - `from`/`to` jsou validované, výchozí rozsah je posledních 30 dní a `to` platí včetně.
  - `variant` je whitelist (all/a/b/none) a `test` je 0/1/2 (výchozí 0).
  - Prohozené datumy se otočí. Období je navíc zkrácené na 730 dní, což jsem přidal já a při zkrácení se zobrazí poznámka.
- **Testovací návštěvy:** množinu testovacích session (JSON_VALUE `$.test` nebo nulová session) určuje jedna CTE `ts`, ze které vychází `ev`. Všechny dotazy nad `events` čtou z `ev`.
- **Sekce 1–9** jsou v požadovaném pořadí:
  - **KPI dlaždice:** poznámka u „Leady v DB“, že filtr testů tu nejde.
  - **Funnel:** 7 kroků s pruhem a poznámkou o nezávislosti kroků.
  - **A/B:** rozdíl B − A, 95% CI, p-hodnota a verdikt (pod 100 návštěvami „Málo dat – zatím nerozhodovat“).
  - **Scroll, CTA podle pozice, chyby formuláře, zdroje, trend a kvalita dat.**
  - Nad sekcemi je rozbalovací „Popis metrik“ s jednou větou ke každé z nich.
- **Odchylky od zadání:**
  - Sekce A/B a scroll záměrně ignorují filtr varianty, jinak by při filtru „a“ byla varianta B prázdná. Je to uvedené v nadpisech.
  - Řádky pozic jsou vždy hero, 1 a 2. Nečekané hodnoty `position` se přidají jako další řádky.
  - Trend nad 90 dní jde po týdnech (bucket je pondělí týdne, počítané v SQL).
  - Dlaždice „Leady“ jsou unikátní session s `form_success`, takže jejich počet se může lišit od „Leady v DB“.

## Rizikové SQL (ověřit na serveru jako první)
1. **Prefix CTE:** `WITH ts AS (SELECT session_id FROM events WHERE JSON_VALUE(props,'$.test') IS NOT NULL UNION SELECT '0000…'), ev AS (SELECT … FROM events WHERE created_at>=? AND created_at<? [AND ad_variant=?|IS NULL] [AND session_id [NOT] IN (SELECT session_id FROM ts)])`. Je v každém dotazu, jde o CTE s placeholdery přes `ATTR_EMULATE_PREPARES=false`. Parametry CTE jdou vždy první, pak parametry dotazu.
2. **Zdroje:** podselect `pv` s `MIN(JSON_VALUE(props,'$.utm_source'))` na session, `LEFT JOIN` na `SELECT DISTINCT session_id … 'form_success'` a `SUM(fs.session_id IS NOT NULL)`. `GROUP BY` používá alias `source_label` (inner sloupec jsem pojmenoval `utm`, aby se aliasy nepletly). `ev` se v dotazu čte dvakrát.
3. **Trend:** `GROUP BY bucket`, kde bucket je `DATE(created_at - INTERVAL WEEKDAY(created_at) DAY)` pro týdny. Výraz vybírá PHP jako konstantu.
4. **CTA podle pozice a chyby:** `GROUP BY event, pos` a `GROUP BY reason` přes alias z `JSON_VALUE` a `COALESCE`.
5. **JSON_VALUE:** `"test": false` nebo `0` by se počítalo jako testovací session, protože výsledek není NULL (přesně podle zadání). Při `"test": null` se session za testovací nepočítá.

## Co otestovat na serveru
- Stránku načíst bez parametrů a s `?test=0|1|2`, `?variant=a|b|none` a neplatnými hodnotami (`?variant=x&from=blbost&test=9` musí spadnout na výchozí hodnoty). Žádný warning a žádná hláška „Data se nepodařilo načíst“. Při chybě se podívat do `error_log`.
- Odeslat testovací event s `props.test` a ověřit, že při `test=0` zmizí a při `test=1` jako jediný zůstane. Totéž pro nulovou session.
- Zkontrolovat, že součty funnelu sedí na `SELECT COUNT(DISTINCT session_id) … WHERE event='page_view'` v konzoli.
- Zkontrolovat, že A/B ztest vychází jako v ručním výpočtu (například 10/200 vs 20/200 dá p ≈ 0,05), a že verdikt pod 100 návštěvami hlásí „Málo dat“.
- Období přes 90 dní, aby se trend přepnul na týdny a SVG se vykreslilo (na mobilu by mělo jít posouvat).
- Zdroje: `NULL` a prázdný `utm_source` mají skončit v „(přímý / bez UTM)“.
- Ve zdroji stránky se nesmí objevit žádný e-mail. Odhlášení a leady se čtou jen jako `COUNT(*)`.

---

## 👤 Uživatel · 2026-10-09 19:15:11

[handback-send-enforce] Your report has not been delivered. Call SubagentHandback({message: <your full report>}) now; the call ends your run.

**→ SubagentHandback**

```
{
 "message": "Stránka „Analytika“ je přepsaná v C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\admin\\index.php. PHP tu lokálně není, takže kód jsem jen pečlivě prošel očima, nic jsem nespouštěl. Kontroloval jsem hlavně počet a pořadí placeholderů a aliasy v GROUP BY. Nečetl jsem .env, nesahal jsem na public/js ani public/index.html a nic jsem necommitoval.\n\n## Změny\n- Zachováno: hlavičky noindex a no-store, require config.php, h() na všem výstupu, prepared statements. Žádné e-maily nikde, tabulka leads se čte jen přes COUNT(*). Při chybě DB jen obecná hláška „Data se nepodařilo načíst.“ a error_log.\n- Funkce: q(), q_plain(), ev_cte(), pct()/pctf(), ztest() s vlastním erf (Abramowitz–Stegun 7.1.26) a norm_cdf(), trend_svg(), cnt(), placeholders().\n- Filtry (GET, validované):\n  - from a to ve formátu YYYY-MM-DD, výchozí posledních 30 dní, to včetně. Prohozené datumy se otočí.\n  - variant je whitelist all/a/b/none, test je 0/1/2 s výchozí 0.\n  - Období jsem navíc zkrátil na max. 730 dní (moje přidání) a při zkrácení se zobrazí poznámka.\n- Testovací návštěvy: jedna CTE `ts` (session s JSON_VALUE(props,'$.test') IS NOT NULL plus nulová session) a z ní odvozená CTE `ev`. Všechny dotazy nad events čtou z `ev`.\n- Sekce 1–9 jsou v požadovaném pořadí:\n  - Dlaždice KPI, u „Leady v DB“ je poznámka, že filtr testů tu nejde.\n  - Funnel o 7 krocích s pruhem a poznámkou o nezávislosti kroků.\n  - A/B: rozdíl B−A, 95% CI, p-hodnota a verdikt (pod 100 návštěv „Má
… [zkráceno, celkem 4188 znaků]
```

<details><summary>výsledek nástroje</summary>

```
{"success":true,"message":"Report delivered to your caller."}
```
</details>

