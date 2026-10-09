# Session 01 – agent 05-backend-sonnet

Čitelný přepis exportu z Claude Code (desktopová aplikace, `/export` v ní není – export přes menu session). Výsledky nástrojů jsou zkrácené na 1500 znaků, obrázky a stažené PDF nejsou součástí. Bloky uvažování modelu nejsou součástí přepisu.

---

## 👤 Uživatel · 2026-10-09 18:16:41

Pracovní adresář: C:\Users\Administrator\Desktop\junior_ai_developer. Přečti CLAUDE.md, .claude/agents/backend.md (jsi agent backend a řídíš se jím), docs/design-a-rozhrani.md (sekce 4 a 5 jsou závazný kontrakt), config.php, deploy/schema.sql, .env.example. NIKDY nečti .env. Necommituj. Jiný agent souběžně píše content/texty.md – na content/ ani na public/index.html, public/css, public/js nesahej.

Cílové prostředí: Ubuntu, PHP 8.3 FPM za Apache za HAProxy (REMOTE_ADDR je už skutečná IP díky mod_remoteip), MariaDB 10.x/11.x, PHP rozšíření pdo_mysql, curl, mbstring. Bez Composeru.

Vytvoř:

1) public/api/_bootstrap.php – společné: require ../../config.php; funkce:
   - cors(): pokud HTTP_ORIGIN === $_ENV['CORS_ORIGIN'] → ACAO + Vary: Origin, Methods POST, OPTIONS, Headers Content-Type; OPTIONS → 204 a exit
   - json_out(int $code, array $data): hlavička application/json; charset=utf-8, Cache-Control: no-store
   - read_json_body(int $maxBytes): čte php://input (max velikost, jinak 413), json_decode, vrací array nebo null
   - rate_limit(string $bucket, int $max, int $windowSec): bool – souborový limiter v sys_get_temp_dir()/aijunior-rl/, klíč = hash_hmac('sha256', REMOTE_ADDR, APP_SECRET) (IP se nikam neukládá v čitelné podobě), flock, mazání starých záznamů
   - Ochrana: soubory s podtržítkem nesmí jít volat přímo – na začátku kontrola, že nejsou spuštěné jako hlavní skript (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME']) → 404).

2) public/api/lead.php – podle kontraktu v sekci 5:
   - jen POST (+ OPTIONS přes cors), jinak 405
   - honeypot `website` neprázdný → 200 {ok:true}, nic neukládat
   - rate limit 5 / 10 min → 429
   - validace: email trim, mb_strtolower, max 254, FILTER_VALIDATE_EMAIL → 400 invalid_email; consent === true → jinak 400 consent_required; ad_variant jen 'a'|'b'|null; utm_* ořezat na 100 znaků, jen tisknutelné znaky; position jen 1|2
   - INSERT do leads (prepared). Duplicita (SQLSTATE 23000 / kód 1062) → 200 ok, e-mail znovu NEposílat.
   - po úspěšném INSERT poslat e-mail přes Resend HTTP API: POST https://api.resend.com/emails, Authorization: Bearer RESEND_API_KEY, JSON {from: "MAIL_FROM_NAME <MAIL_FROM>", to: [email], subject, html, text, headers: {"List-Unsubscribe": "<unsubscribe_url>"}}. cURL s timeoutem 8 s. Selhání e-mailu zalogovat (error_log, bez e-mailové adresy v logu) – lead zůstává uložen, odpověď 200 ok.
   - Text e-mailu zatím načti z public/api/_mail_template.php (vytvoř ho: funkce mail_content(string $pdfUrl, string $unsubUrl): array{subject, html, text} s dočasným textem „TODO: text z content/texty.md sekce email“ – finální text doplní hlavní session). pdf_url = APP_URL . '/pdf/etf-srovnani.pdf'.
   - unsubscribe_url = APP_URL . '/api/unsubscribe.php?e=' . urlencode(email) . '&t=' . hash_hmac('sha256', email, APP_SECRET)
   - zapsat event form_success? NE – eventy posílá frontend.
   - výjimky: error_log + 500 {ok:false,error:"server"}

3) public/api/event.php – podle sekce 4:
   - jen POST; tělo čte jako text (sendBeacon posílá text/plain) max 4 KB, json_decode
   - session_id musí být UUID (regex), event jen z whitelistu: page_view, scroll_50, scroll_90, calc_interact, calc_result_viewed, cta_click, form_focus, form_submit, form_success, form_error
   - ad_variant 'a'|'b'|null; props: objekt, json_encode zpět max 1000 bajtů, jinak zahodit props
   - rate limit 300 / 10 min → 429
   - INSERT do events; odpověď 204 bez těla

4) public/api/unsubscribe.php – GET e, t; hash_equals ověření HMAC; INSERT IGNORE do unsubscribes; jednoduchá HTML stránka „Odhlášeno“ (česky, tykání, tmavé pozadí #0E1113, text #ECE9E3), při neplatném tokenu 400 se stejnou stránkou a textem „Odkaz je neplatný“.

5) public/admin/index.php – basic auth dělá Apache (nic v PHP), přesto pošli X-Robots-Tag: noindex a Cache-Control: no-store. Zobraz (HTML, tmavé jednoduché styly inline, česky):
   - Funnel podle ad_variant (a, b, bez varianty, celkem): unikátní session pro page_view → calc_interact → cta_click → form_submit → form_success, s % přechodu mezi kroky a celkovou konverzí page_view → form_success
   - Filtr období přes ?from=YYYY-MM-DD&to=YYYY-MM-DD (validace, default posledních 30 dní)
   - Počet leadů celkem a podle ad_variant a utm_source (jen počty, ŽÁDNÉ e-maily), počet odhlášení
   - Eventy po dnech (posledních 14 dní) – tabulka
   - Všechny výstupy htmlspecialchars.

6) deploy/test-api.sh – curl příkazy pro ruční test na serveru (lead OK, honeypot, neplatný e-mail, bez souhlasu, duplicita, OPTIONS z povoleného originu, event OK, event neplatný, unsubscribe se špatným tokenem), proti proměnné BASE (default http://127.0.0.1:8081 s hlavičkou Host: aijunior.opicebot.cz).

Pravidla: PHP 8.3, declare(strict_types=1), PDO prepared statements, žádné UPDATE/DELETE (DB uživatel má jen SELECT, INSERT – INSERT IGNORE je OK), nevypisovat výjimky uživateli. Pokud máš lokálně php (`php -v`), spusť `php -l` na všechny soubory; když php není, napiš to.

Vrať: seznam souborů, výsledek php -l (nebo že php chybí), a vše, kde ses odchýlil od kontraktu nebo kde je potřeba rozhodnutí hlavní session.

---

## 👤 Uživatel · 2026-10-09 18:16:41

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
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\docs\\design-a-rozhrani.md"
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
… [zkráceno, celkem 6251 znaků]
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
27	    }
28	    return $pdo;
29	}
30	
```
</details>

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\deploy\\schema.sql"
}
```

**→ Read**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\.env.example"
}
```

<details><summary>výsledek nástroje</summary>

```
1	# Vzor konfigurace. Zkopíruj na .env (mimo document root) a vyplň.
2	# .env se NIKDY necommituje.
3	
4	# MariaDB (na serveru .200, jen localhost)
5	DB_HOST=127.0.0.1
6	DB_NAME=etf_lp
7	DB_USER=etf_lp
8	DB_PASS=
9	
10	# Resend (HTTP API, https://resend.com/docs/api-reference/emails/send-email)
11	# API klíč = totéž, co Resend ukazuje jako SMTP heslo
12	RESEND_API_KEY=
13	MAIL_FROM=
14	MAIL_FROM_NAME=
15	
16	# Veřejná adresa webu (odkazy v e-mailu)
17	APP_URL=https://aijunior.opicebot.cz
18	# Náhodný řetězec pro podpis odhlašovacích odkazů: openssl rand -hex 32
19	APP_SECRET=
20	
21	# Admin funnel chrání basic auth v Apache (deploy/INSTALL.md, krok 5), ne PHP.
22	
23	# CORS – origin GitHub Pages zrcadla
24	CORS_ORIGIN=https://UZIVATEL.github.io
25	
```
</details>

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

**→ Bash**

```
{
 "command": "cd C:/Users/Administrator/Desktop/junior_ai_developer; php -v 2>&1 | head -1; ls public public/api public/admin deploy 2>&1"
}
```

<details><summary>výsledek nástroje</summary>

```
/usr/bin/bash: line 1: php: command not found
deploy:
INSTALL.md
apache-vhost.conf
haproxy-snippet.cfg
schema.sql

public:
admin
api
css
data
js

public/admin:

public/api:
```
</details>

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\api\\_bootstrap.php",
 "content": "<?php\ndeclare(strict_types=1);\n\n// Přímé volání (https://.../api/_bootstrap.php) = 404.\nif (isset($_SERVER['SCRIPT_FILENAME']) && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {\n    http_response_code(404);\n    exit;\n}\n\nrequire __DIR__ . '/../../config.php';\n\ndate_default_timezone_set('Europe/Prague');\n\nfunction cors(): void\n{\n    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';\n    $allowed = $_ENV['CORS_ORIGIN'] ?? '';\n    if ($origin !== '' && $allowed !== '' && $origin === $allowed) {\n        header('Access-Control-Allow-Origin: ' . $allowed);\n        header('Vary: Origin');\n        header('Access-Control-Allow-Methods: POST, OPTIONS');\n        header('Access-Control-Allow-Headers: Content-Type');\n        header('Access-Control-Max-Age: 600');\n    }\n    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {\n        http_response_code(204);\n        exit;\n    }\n}\n\nfunction json_out(int $code, array $data, bool $exit = true): void\n{\n    http_response_code($code);\n    header('Content-Type: application/json; charset=utf-8');\n    header('Cache-Control: no-store');\n    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);\n    if ($exit) {\n        exit;\n    }\n}\n\n/** Vrací dekódované pole, nebo null při neplatném JSONu. Při překročení velikosti ukončí s 413. */\nfunction read_json_body(int $maxByte
… [zkráceno, celkem 3524 znaků]
```

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\api\\_mail_template.php",
 "content": "<?php\ndeclare(strict_types=1);\n\nif (isset($_SERVER['SCRIPT_FILENAME']) && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {\n    http_response_code(404);\n    exit;\n}\n\n/**\n * Obsah e-mailu s odkazem na PDF.\n * @return array{subject: string, html: string, text: string}\n */\nfunction mail_content(string $pdfUrl, string $unsubUrl): array\n{\n    $h = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');\n\n    // TODO: text z content/texty.md sekce email (doplní hlavní session)\n    $subject = 'TODO: text z content/texty.md sekce email';\n    $text = \"TODO: text z content/texty.md sekce email\\n\\nPDF: {$pdfUrl}\\n\\nOdhlásit odběr: {$unsubUrl}\\n\";\n    $html = '<p>TODO: text z content/texty.md sekce email</p>'\n        . '<p><a href=\"' . $h($pdfUrl) . '\">Stáhnout PDF</a></p>'\n        . '<p style=\"font-size:12px;color:#666\"><a href=\"' . $h($unsubUrl) . '\">Odhlásit odběr</a></p>';\n\n    return ['subject' => $subject, 'html' => $html, 'text' => $text];\n}\n"
}
```

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\api\\lead.php",
 "content": "<?php\ndeclare(strict_types=1);\n\nrequire __DIR__ . '/_bootstrap.php';\nrequire __DIR__ . '/_mail_template.php';\n\ncors();\n\nif (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {\n    header('Allow: POST, OPTIONS');\n    json_out(405, ['ok' => false, 'error' => 'method']);\n}\n\n/** Ořízne na 100 znaků, odstraní řídicí znaky; prázdné = null. */\nfunction clean_utm(mixed $v): ?string\n{\n    if (!is_string($v) || !mb_check_encoding($v, 'UTF-8')) {\n        return null;\n    }\n    $v = preg_replace('/\\p{C}+/u', '', $v) ?? '';\n    $v = trim(mb_substr($v, 0, 100));\n    return $v === '' ? null : $v;\n}\n\n/** @return bool true při úspěchu */\nfunction send_resend_mail(string $email, array $content, string $unsubUrl): bool\n{\n    $from = ($_ENV['MAIL_FROM_NAME'] ?? '') . ' <' . ($_ENV['MAIL_FROM'] ?? '') . '>';\n    $payload = json_encode([\n        'from' => $from,\n        'to' => [$email],\n        'subject' => $content['subject'],\n        'html' => $content['html'],\n        'text' => $content['text'],\n        'headers' => ['List-Unsubscribe' => '<' . $unsubUrl . '>'],\n    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);\n    if ($payload === false) {\n        error_log('lead: mail payload encode failed');\n        return false;\n    }\n\n    $ch = curl_init('https://api.resend.com/emails');\n    curl_setopt_array($ch, [\n        CURLOPT_POST => true,\n   
… [zkráceno, celkem 5053 znaků]
```

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\api\\event.php",
 "content": "<?php\ndeclare(strict_types=1);\n\nrequire __DIR__ . '/_bootstrap.php';\n\ncors();\n\nif (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {\n    header('Allow: POST, OPTIONS');\n    json_out(405, ['ok' => false, 'error' => 'method']);\n}\n\nconst ALLOWED_EVENTS = [\n    'page_view', 'scroll_50', 'scroll_90', 'calc_interact', 'calc_result_viewed',\n    'cta_click', 'form_focus', 'form_submit', 'form_success', 'form_error',\n];\n\ntry {\n    if (!rate_limit('event', 300, 600)) {\n        json_out(429, ['ok' => false, 'error' => 'rate_limited']);\n    }\n\n    // sendBeacon posílá text/plain; read_json_body čte php://input bez ohledu na Content-Type.\n    $body = read_json_body(4096);\n    if ($body === null) {\n        json_out(400, ['ok' => false, 'error' => 'invalid']);\n    }\n\n    $sid = $body['session_id'] ?? null;\n    $event = $body['event'] ?? null;\n    if (\n        !is_string($sid)\n        || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $sid)\n        || !is_string($event)\n        || !in_array($event, ALLOWED_EVENTS, true)\n    ) {\n        json_out(400, ['ok' => false, 'error' => 'invalid']);\n    }\n\n    $adVariant = $body['ad_variant'] ?? null;\n    if ($adVariant !== 'a' && $adVariant !== 'b') {\n        $adVariant = null;\n    }\n\n    $props = null;\n    if (isset($body['props']) && is_array($body['props']) && $bo
… [zkráceno, celkem 2156 znaků]
```

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\api\\unsubscribe.php",
 "content": "<?php\ndeclare(strict_types=1);\n\nrequire __DIR__ . '/_bootstrap.php';\n\nheader('X-Robots-Tag: noindex');\nheader('Cache-Control: no-store');\n\nfunction page(int $code, string $title, string $text): void\n{\n    http_response_code($code);\n    header('Content-Type: text/html; charset=utf-8');\n    $t = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');\n    $p = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');\n    echo '<!doctype html><html lang=\"cs\"><head><meta charset=\"utf-8\">'\n        . '<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">'\n        . '<meta name=\"robots\" content=\"noindex\"><title>' . $t . '</title>'\n        . '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;'\n        . 'background:#0E1113;color:#ECE9E3;font-family:system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;padding:16px}'\n        . 'main{max-width:480px}h1{font-size:1.75rem;margin:0 0 12px}p{color:#ECE9E3;line-height:1.5;margin:0}</style>'\n        . '</head><body><main><h1>' . $t . '</h1><p>' . $p . '</p></main></body></html>';\n    exit;\n}\n\nif (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {\n    header('Allow: GET');\n    page(405, 'Nepodporovaná metoda', 'Tuhle adresu otevři v prohlížeči jako odkaz z e-mailu.');\n}\n\n$e = $_GET['e'] ?? null;\n$t = $_GET['t'] ?? null;\nif (!is_string($e) || !is_string(
… [zkráceno, celkem 2232 znaků]
```

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\public\api\_bootstrap.php (file state is current in your context — no need to Read it back)
```
</details>

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\public\api\_mail_template.php (file state is current in your context — no need to Read it back)
```
</details>

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\public\api\lead.php (file state is current in your context — no need to Read it back)
```
</details>

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\public\api\event.php (file state is current in your context — no need to Read it back)
```
</details>

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\public\api\unsubscribe.php (file state is current in your context — no need to Read it back)
```
</details>

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\public\\admin\\index.php",
 "content": "<?php\ndeclare(strict_types=1);\n\n// Basic auth řeší Apache (deploy/INSTALL.md, krok 5). Tady jen hlavičky a čtení agregací.\nheader('X-Robots-Tag: noindex, nofollow');\nheader('Cache-Control: no-store');\nheader('Content-Type: text/html; charset=utf-8');\n\nrequire __DIR__ . '/../../config.php';\ndate_default_timezone_set('Europe/Prague');\n\nfunction h(mixed $s): string\n{\n    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');\n}\n\nfunction parse_date(mixed $v): ?DateTimeImmutable\n{\n    if (!is_string($v) || !preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $v)) {\n        return null;\n    }\n    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v);\n    $err = DateTimeImmutable::getLastErrors();\n    if ($d === false || ($err !== false && ($err['warning_count'] > 0 || $err['error_count'] > 0))) {\n        return null;\n    }\n    return $d;\n}\n\nfunction pct(int $a, int $b): string\n{\n    return $b > 0 ? number_format($a / $b * 100, 1, ',', ' ') . ' %' : '–';\n}\n\n$today = new DateTimeImmutable('today');\n$to = parse_date($_GET['to'] ?? null) ?? $today;\n$from = parse_date($_GET['from'] ?? null) ?? $to->modify('-29 days');\nif ($from > $to) {\n    [$from, $to] = [$to, $from];\n}\n$fromSql = $from->format('Y-m-d 00:00:00');\n$toSql = $to->modify('+1 day')->format('Y-m-d 00:00:00'); // exkluzivní horní mez\n\n$steps = [\n    'page_view' => 'Zobrazení strá
… [zkráceno, celkem 9288 znaků]
```

**→ Write**

```
{
 "file_path": "C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\deploy\\test-api.sh",
 "content": "#!/usr/bin/env bash\n# Ruční test API na serveru. Spouští se ručně, po potvrzení.\n# Použití: BASE=http://127.0.0.1:8081 ORIGIN=https://uzivatel.github.io ./deploy/test-api.sh\n# Pozor: první lead s platným formátem e-mailu zkusí poslat skutečný e-mail přes Resend\n# (na @example.com selže a zaloguje se – lead zůstane uložen). Rate limit leadu: 5 / 10 min / IP.\nBASE=\"${BASE:-http://127.0.0.1:8081}\"\nHOSTH=\"${HOSTH:-aijunior.opicebot.cz}\"\nORIGIN=\"${ORIGIN:-https://UZIVATEL.github.io}\"   # musí být shodný s CORS_ORIGIN v .env\nEMAIL=\"${EMAIL:-test+$(date +%s)@example.com}\"\nSID=\"${SID:-3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b}\"\n\nc() { curl -sS -i -H \"Host: $HOSTH\" \"$@\"; echo; echo \"-----\"; }\nJSON='Content-Type: application/json'\n\necho \"### 1) lead OK (očekávám 200 {ok:true})\"\nc -X POST \"$BASE/api/lead.php\" -H \"$JSON\" \\\n  -d \"{\\\"email\\\":\\\"$EMAIL\\\",\\\"consent\\\":true,\\\"website\\\":\\\"\\\",\\\"position\\\":1,\\\"ad_variant\\\":\\\"a\\\",\\\"utm_source\\\":\\\"test\\\",\\\"utm_campaign\\\":\\\"manual\\\"}\"\n\necho \"### 2) honeypot (200 {ok:true}, nic se neuloží)\"\nc -X POST \"$BASE/api/lead.php\" -H \"$JSON\" \\\n  -d '{\"email\":\"bot@example.com\",\"consent\":true,\"website\":\"http://spam.example\"}'\n\necho \"### 3) neplatný e-mail (400 invalid_email)\"\nc -X POST \"$BASE/api/lead.php\" -H \"$JSON\" \\\n  -d '{\"email\":\"neni-
… [zkráceno, celkem 3600 znaků]
```

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\public\admin\index.php (file state is current in your context — no need to Read it back)
```
</details>

<details><summary>výsledek nástroje</summary>

```
File created successfully at: C:\Users\Administrator\Desktop\junior_ai_developer\deploy\test-api.sh (file state is current in your context — no need to Read it back)
```
</details>

**→ SubagentHandback**

```
{
 "message": "Všech 7 souborů je napsaných, ale nic z toho jsem nespustil. Lokálně není `php` (`php -v` → command not found), takže `php -l` neproběhl a kód je netestovaný. Spusť `php -l` na serveru nebo tam, kde PHP je.\n\n**Soubory (vše pod C:\\Users\\Administrator\\Desktop\\junior_ai_developer\\):**\n- `public/api/_bootstrap.php`\n- `public/api/_mail_template.php` (dočasný text „TODO: text z content/texty.md sekce email“)\n- `public/api/lead.php`\n- `public/api/event.php`\n- `public/api/unsubscribe.php`\n- `public/admin/index.php`\n- `deploy/test-api.sh`\n\nNa `content/`, `public/index.html`, `public/css` ani `public/js` jsem nesahal, `.env` jsem nečetl a necommitoval jsem.\n\n**Odchylky od kontraktu a drobná rozhodnutí:**\n1. **`position`** se v `lead.php` validuje (1|2, jinak null), ale nikam se neukládá, protože tabulka `leads` nemá sloupec. Pokud ho chceš v DB, je potřeba změnit schéma.\n2. **`json_out()`** má navíc třetí parametr `bool $exit = true`. `lead.php` ho používá k tomu, aby se odpověď 200 odeslala hned a e-mail se posílal po `fastcgi_finish_request()`. Bez FPM se e-mail posílá synchronně.\n3. **`event.php`**:\n   - Neplatný vstup (špatný event, `session_id` nebo JSON) vrací `400 {ok:false,error:\"invalid\"}`. Kontrakt to neřeší.\n   - Rate limit se kontroluje před čtením těla.\n   - Props, které jsou prázdné, nejsou objekt nebo mají po `json_encode` přes 1000 B, se uloží jako NULL.\n   - Nevalidní `ad_variant` se tiše změní na null (v `lead.php` i `event.ph
… [zkráceno, celkem 3665 znaků]
```

<details><summary>výsledek nástroje</summary>

```
{"success":true,"message":"Report delivered to your caller."}
```
</details>

