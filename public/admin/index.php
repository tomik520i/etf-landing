<?php
declare(strict_types=1);

// Analytika. Basic auth řeší Apache (deploy/INSTALL.md, krok 5). Tady jen hlavičky a čtení agregací (jen SELECT).
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Content-Type: text/html; charset=utf-8');

require __DIR__ . '/../../config.php';
date_default_timezone_set('Europe/Prague');

const NIL_SESSION = '00000000-0000-4000-8000-000000000000';
const MIN_VISITS = 100;
const MAX_RANGE_DAYS = 730;

// ---------------------------------------------------------------- pomocné funkce

function h(mixed $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function num(int|float $n, int $dec = 0): string
{
    return number_format($n, $dec, ',', "\u{00A0}");
}

function parse_date(mixed $v): ?DateTimeImmutable
{
    if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
        return null;
    }
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v);
    $err = DateTimeImmutable::getLastErrors();
    if ($d === false || ($err !== false && ($err['warning_count'] > 0 || $err['error_count'] > 0))) {
        return null;
    }
    return $d;
}

/** Podíl v procentech jako číslo (0 při dělení nulou). */
function pctf(int|float $a, int|float $b): float
{
    return $b > 0 ? $a / $b * 100 : 0.0;
}

/** Podíl v procentech jako text. */
function pct(int|float $a, int|float $b): string
{
    return $b > 0 ? num($a / $b * 100, 1) . ' %' : '–';
}

/** Rozdíl v procentních bodech se znaménkem. */
function pp(float $v): string
{
    return ($v > 0 ? '+' : ($v < 0 ? '−' : '')) . num(abs($v), 2) . ' p. b.';
}

/** Chybová funkce erf – Abramowitz–Stegun 7.1.26 (chyba < 1,5e-7). */
function erf_as(float $x): float
{
    $sign = $x < 0 ? -1.0 : 1.0;
    $x = abs($x);
    $t = 1.0 / (1.0 + 0.3275911 * $x);
    $y = 1.0 - ((((1.061405429 * $t - 1.453152027) * $t + 1.421413741) * $t - 0.284496736) * $t + 0.254829592)
        * $t * exp(-$x * $x);
    return $sign * $y;
}

function norm_cdf(float $z): float
{
    return 0.5 * (1.0 + erf_as($z / M_SQRT2));
}

/**
 * Dvouvýběrový z-test pro podíly (oboustranný) + 95% CI rozdílu (B − A, normální aproximace).
 * Vrací null, když některý výběr nemá návštěvy.
 * @return array{diff:float,lo:float,hi:float,z:float,p:float}|null  rozdíl a meze v p. b.
 */
function ztest(int $xa, int $na, int $xb, int $nb): ?array
{
    if ($na <= 0 || $nb <= 0) {
        return null;
    }
    $pa = $xa / $na;
    $pb = $xb / $nb;
    $diff = $pb - $pa;
    $se = sqrt($pa * (1 - $pa) / $na + $pb * (1 - $pb) / $nb);
    $pool = ($xa + $xb) / ($na + $nb);
    $se0 = sqrt($pool * (1 - $pool) * (1 / $na + 1 / $nb));
    if ($se0 > 0) {
        $z = $diff / $se0;
        $p = min(1.0, max(0.0, 2 * (1 - norm_cdf(abs($z)))));
    } else {
        $z = 0.0;
        $p = 1.0;
    }
    return [
        'diff' => $diff * 100,
        'lo' => ($diff - 1.96 * $se) * 100,
        'hi' => ($diff + 1.96 * $se) * 100,
        'z' => $z,
        'p' => $p,
    ];
}

/**
 * Společný úvod dotazů: CTE ts = množina testovacích session, ev = eventy v období
 * po aplikaci filtrů varianty a testů. Dotazy čtou z "ev".
 * @return array{0:string,1:array}  [sql prefix, parametry prefixu]
 */
function ev_cte(array $f, bool $anyVariant, ?int $testMode): array
{
    $sql = 'WITH ts AS (SELECT session_id FROM events WHERE JSON_VALUE(props, \'$.test\') IS NOT NULL '
        . 'UNION SELECT \'' . NIL_SESSION . '\'), '
        . 'ev AS (SELECT session_id, event, ad_variant, props, created_at FROM events '
        . 'WHERE created_at >= ? AND created_at < ?';
    $params = [$f['fromSql'], $f['toSql']];
    if (!$anyVariant) {
        if ($f['variant'] === 'a' || $f['variant'] === 'b') {
            $sql .= ' AND ad_variant = ?';
            $params[] = $f['variant'];
        } elseif ($f['variant'] === 'none') {
            $sql .= ' AND ad_variant IS NULL';
        }
    }
    $mode = $testMode ?? $f['test'];
    if ($mode === 0) {
        $sql .= ' AND session_id NOT IN (SELECT session_id FROM ts)';
    } elseif ($mode === 1) {
        $sql .= ' AND session_id IN (SELECT session_id FROM ts)';
    }
    return [$sql . ') ', $params];
}

/**
 * Spustí dotaz nad CTE "ev" (prepared statement). $params = parametry vlastního dotazu.
 * @return list<array<string,mixed>>
 */
function q(PDO $pdo, array $f, string $sql, array $params = [], bool $anyVariant = false, ?int $testMode = null): array
{
    [$prefix, $pre] = ev_cte($f, $anyVariant, $testMode);
    $stmt = $pdo->prepare($prefix . $sql);
    $stmt->execute(array_merge($pre, $params));
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/** Spustí dotaz bez CTE (tabulky leads / unsubscribes). */
function q_plain(PDO $pdo, string $sql, array $params): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function placeholders(array $items): string
{
    return implode(',', array_fill(0, count($items), '?'));
}

function cnt(array $byV, string $variant, string $event): int
{
    return (int) ($byV[$variant][$event] ?? 0);
}

/** Inline SVG sloupcový graf: návštěvy (muted) a leady (akcent) po bucketech. */
function trend_svg(array $buckets, array $rows, bool $weekly): string
{
    $n = count($buckets);
    if ($n === 0) {
        return '';
    }
    $W = max(640, $n * 16);
    $H = 220;
    $padL = 40;
    $padB = 28;
    $padT = 10;
    $plotW = $W - $padL - 6;
    $plotH = $H - $padB - $padT;
    $max = 1;
    foreach ($buckets as $b) {
        $max = max($max, (int) ($rows[$b]['v'] ?? 0));
    }
    $slot = $plotW / $n;
    $bw = max(2.0, $slot * 0.38);
    $f = static fn(float $x): string => number_format($x, 1, '.', '');
    $svg = '<svg viewBox="0 0 ' . $W . ' ' . $H . '" width="100%" role="img" aria-label="Sloupcový graf návštěv a leadů po '
        . ($weekly ? 'týdnech' : 'dnech') . '" style="display:block;min-width:' . min($W, 640) . 'px">';
    $svg .= '<line x1="' . $padL . '" y1="' . ($padT + $plotH) . '" x2="' . ($W - 6) . '" y2="' . ($padT + $plotH)
        . '" stroke="#2A3035"/>';
    $svg .= '<text x="' . ($padL - 6) . '" y="' . ($padT + 10) . '" text-anchor="end" fill="#9BA1A6" font-size="11">'
        . h($max) . '</text>';
    $svg .= '<text x="' . ($padL - 6) . '" y="' . ($padT + $plotH) . '" text-anchor="end" fill="#9BA1A6" font-size="11">0</text>';
    foreach ($buckets as $i => $b) {
        $v = (int) ($rows[$b]['v'] ?? 0);
        $l = (int) ($rows[$b]['l'] ?? 0);
        $x = $padL + $i * $slot + ($slot - 2 * $bw - 1) / 2;
        $hv = $v / $max * $plotH;
        $hl = $l / $max * $plotH;
        $label = ($weekly ? 'týden od ' : '') . $b . ': návštěvy ' . $v . ', leady ' . $l;
        $svg .= '<g><title>' . h($label) . '</title>';
        $svg .= '<rect x="' . $f($x) . '" y="' . $f($padT + $plotH - $hv) . '" width="' . $f($bw) . '" height="' . $f($hv)
            . '" fill="#9BA1A6"/>';
        $svg .= '<rect x="' . $f($x + $bw + 1) . '" y="' . $f($padT + $plotH - $hl) . '" width="' . $f($bw) . '" height="' . $f($hl)
            . '" fill="#F2A541"/></g>';
    }
    $idx = array_values(array_unique([0, intdiv($n - 1, 2), $n - 1]));
    foreach ($idx as $i) {
        $cx = $padL + $i * $slot + $slot / 2;
        $anchor = $i === 0 ? 'start' : ($i === $n - 1 ? 'end' : 'middle');
        $svg .= '<text x="' . $f($cx) . '" y="' . ($H - 8) . '" text-anchor="' . $anchor . '" fill="#9BA1A6" font-size="11">'
            . h($buckets[$i]) . '</text>';
    }
    return $svg . '</svg>';
}

// ---------------------------------------------------------------- filtry (GET, validované)

$today = new DateTimeImmutable('today');
$to = parse_date($_GET['to'] ?? null) ?? $today;
$from = parse_date($_GET['from'] ?? null) ?? $to->modify('-29 days');
if ($from > $to) {
    [$from, $to] = [$to, $from];
}
$clamped = false;
if ($from < $to->modify('-' . MAX_RANGE_DAYS . ' days')) {
    $from = $to->modify('-' . MAX_RANGE_DAYS . ' days');
    $clamped = true;
}
$variant = is_string($_GET['variant'] ?? null) && in_array($_GET['variant'], ['all', 'a', 'b', 'none'], true)
    ? $_GET['variant'] : 'all';
// Výchozí = vše: počítá se každá návštěva; vyloučení testovacích je volitelné
$testRaw = is_string($_GET['test'] ?? null) ? $_GET['test'] : '2';
$test = in_array($testRaw, ['0', '1', '2'], true) ? (int) $testRaw : 2;

$f = [
    'fromSql' => $from->format('Y-m-d 00:00:00'),
    'toSql' => $to->modify('+1 day')->format('Y-m-d 00:00:00'), // exkluzivní horní mez
    'variant' => $variant,
    'test' => $test,
];

$variantLabels = ['all' => 'Všechny', 'a' => 'Varianta A', 'b' => 'Varianta B', 'none' => 'Bez varianty'];
$testLabels = ['2' => 'Vše', '0' => 'Vyloučit testovací (?test=1)', '1' => 'Jen testovací'];

$steps = [
    'page_view' => 'Zobrazení stránky',
    'scroll_50' => 'Scroll 50 %',
    'calc_interact' => 'Práce s kalkulačkou',
    'calc_result_viewed' => 'Zobrazený výsledek',
    'form_focus' => 'Začátek vyplňování formuláře',
    'form_submit' => 'Odeslání formuláře',
    'form_success' => 'Lead (úspěch)',
];
$countEvents = array_values(array_unique(array_merge(array_keys($steps), ['scroll_90'])));

// ---------------------------------------------------------------- data

$error = null;
$D = [];
$days = ($to->diff($from)->days ?? 0) + 1;
$weekly = $days > 90;

try {
    $pdo = db();

    // Unikátní session podle eventu (celkově, respektuje všechny filtry).
    $tot = [];
    foreach (q($pdo, $f, 'SELECT event, COUNT(DISTINCT session_id) AS c FROM ev WHERE event IN (' . placeholders($countEvents)
        . ') GROUP BY event', $countEvents) as $r) {
        $tot[$r['event']] = (int) $r['c'];
    }
    $D['tot'] = $tot;

    // Podle variant (filtr varianty se zde ignoruje, aby šlo srovnat A a B).
    $abEvents = ['page_view', 'scroll_50', 'scroll_90', 'calc_interact', 'form_focus', 'form_submit', 'form_success'];
    $byV = [];
    foreach (q($pdo, $f, 'SELECT ad_variant, event, COUNT(DISTINCT session_id) AS c FROM ev WHERE event IN ('
        . placeholders($abEvents) . ') GROUP BY ad_variant, event', $abEvents, true) as $r) {
        $k = $r['ad_variant'] === 'a' || $r['ad_variant'] === 'b' ? $r['ad_variant'] : 'none';
        $byV[$k][$r['event']] = (int) $r['c'];
    }
    $D['byV'] = $byV;

    // CTA a formuláře podle pozice.
    $posEvents = ['cta_click', 'form_focus', 'form_submit', 'form_success'];
    $pos = [];
    foreach (q($pdo, $f, 'SELECT event, JSON_VALUE(props, \'$.position\') AS pos, COUNT(DISTINCT session_id) AS c FROM ev WHERE event IN ('
        . placeholders($posEvents) . ') GROUP BY event, pos', $posEvents) as $r) {
        $pos[(string) ($r['pos'] ?? '(neuvedeno)')][$r['event']] = (int) $r['c'];
    }
    $D['pos'] = $pos;

    // Chyby formuláře.
    $D['errors'] = q($pdo, $f, 'SELECT COALESCE(JSON_VALUE(props, \'$.reason\'), \'(neuvedeno)\') AS reason, '
        . 'COUNT(*) AS n, COUNT(DISTINCT session_id) AS s FROM ev WHERE event = ? GROUP BY reason ORDER BY n DESC', ['form_error']);

    // Zdroje návštěv (utm_source z page_view; leady = session s form_success).
    $D['sources'] = q($pdo, $f, 'SELECT COALESCE(NULLIF(pv.utm, \'\'), \'(přímý / bez UTM)\') AS source_label, '
        . 'COUNT(*) AS visits, SUM(fs.session_id IS NOT NULL) AS leads '
        . 'FROM (SELECT session_id, MIN(JSON_VALUE(props, \'$.utm_source\')) AS utm FROM ev WHERE event = ? GROUP BY session_id) pv '
        . 'LEFT JOIN (SELECT DISTINCT session_id FROM ev WHERE event = ?) fs ON fs.session_id = pv.session_id '
        . 'GROUP BY source_label ORDER BY visits DESC, source_label ASC LIMIT 30', ['page_view', 'form_success']);

    // Trend po dnech / týdnech (bucket = datum dne nebo pondělí týdne; výraz je konstanta, ne vstup).
    $bucketExpr = $weekly ? 'DATE(created_at - INTERVAL WEEKDAY(created_at) DAY)' : 'DATE(created_at)';
    $trend = [];
    foreach (q($pdo, $f, "SELECT $bucketExpr AS bucket, "
        . 'COUNT(DISTINCT CASE WHEN event = ? THEN session_id END) AS v, '
        . 'COUNT(DISTINCT CASE WHEN event = ? THEN session_id END) AS l '
        . 'FROM ev GROUP BY bucket ORDER BY bucket', ['page_view', 'form_success']) as $r) {
        $trend[(string) $r['bucket']] = ['v' => (int) $r['v'], 'l' => (int) $r['l']];
    }
    $D['trend'] = $trend;

    // Kvalita dat.
    $qr = q($pdo, $f, 'SELECT COUNT(*) AS n, COUNT(DISTINCT session_id) AS s, MAX(created_at) AS last_at FROM ev');
    $D['quality'] = $qr[0] ?? ['n' => 0, 's' => 0, 'last_at' => null];
    $tr = q($pdo, $f, 'SELECT COUNT(DISTINCT session_id) AS s FROM ev', [], true, 1);
    $D['testSessions'] = (int) ($tr[0]['s'] ?? 0);

    // Leady a odhlášení v DB (filtr testů tu nejde použít – tabulky nemají session_id).
    $sqlL = 'SELECT COUNT(*) AS c FROM leads WHERE created_at >= ? AND created_at < ?';
    $pl = [$f['fromSql'], $f['toSql']];
    if ($variant === 'a' || $variant === 'b') {
        $sqlL .= ' AND ad_variant = ?';
        $pl[] = $variant;
    } elseif ($variant === 'none') {
        $sqlL .= ' AND ad_variant IS NULL';
    }
    $D['leadsDb'] = (int) (q_plain($pdo, $sqlL, $pl)[0]['c'] ?? 0);
    $D['unsub'] = (int) (q_plain($pdo, 'SELECT COUNT(*) AS c FROM unsubscribes WHERE created_at >= ? AND created_at < ?',
        [$f['fromSql'], $f['toSql']])[0]['c'] ?? 0);
} catch (Throwable $e) {
    error_log('admin: ' . get_class($e) . ': ' . $e->getMessage());
    $error = 'Data se nepodařilo načíst.';
}

// ---------------------------------------------------------------- odvozené hodnoty

$visits = $leads = 0;
$buckets = [];
$ab = null;
if ($error === null) {
    $visits = $D['tot']['page_view'] ?? 0;
    $leads = $D['tot']['form_success'] ?? 0;

    $cur = $weekly ? $from->modify('monday this week') : $from;
    while ($cur <= $to) {
        $buckets[] = $cur->format('Y-m-d');
        $cur = $cur->modify($weekly ? '+7 days' : '+1 day');
    }

    $na = cnt($D['byV'], 'a', 'page_view');
    $nb = cnt($D['byV'], 'b', 'page_view');
    $xa = cnt($D['byV'], 'a', 'form_success');
    $xb = cnt($D['byV'], 'b', 'form_success');
    $z = ztest($xa, $na, $xb, $nb);
    if ($na < MIN_VISITS || $nb < MIN_VISITS) {
        $verdict = 'Málo dat – zatím nerozhodovat';
    } elseif ($z !== null && $z['p'] < 0.05) {
        $verdict = 'Rozdíl je statisticky významný';
    } else {
        $verdict = 'Rozdíl zatím není průkazný';
    }
    $ab = compact('na', 'nb', 'xa', 'xb', 'z', 'verdict');
}
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Analytika</title>
<style>
:root{--bg:#0E1113;--surface:#161A1D;--surface-2:#1D2226;--border:#2A3035;--text:#ECE9E3;--muted:#9BA1A6;--accent:#F2A541;--accent-ink:#1A1205;--fee:#E8735A}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px;font-variant-numeric:tabular-nums}
main{max-width:1100px;margin:0 auto}
h1{font-size:1.6rem;margin:0 0 4px}h2{font-size:1.1rem;margin:0 0 12px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;overflow-x:auto}
.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th,td{padding:8px 10px;text-align:right;border-bottom:1px solid var(--border);white-space:nowrap}
th:first-child,td:first-child{text-align:left}
th{color:var(--muted);font-weight:600}
.m{color:var(--muted);font-size:13px}.acc{color:var(--accent);font-weight:700}.bad{color:var(--fee)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px}
.kpi .v{font-size:1.9rem;font-weight:800;line-height:1.2}.kpi .l{color:var(--muted);font-size:13px}
form.filters{display:flex;gap:12px;flex-wrap:wrap;align-items:end}
label{display:flex;flex-direction:column;gap:4px;color:var(--muted);font-size:13px}
input,select,button{background:var(--surface-2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:8px 10px;font:inherit}
button{background:var(--accent);color:var(--accent-ink);border:0;font-weight:700;cursor:pointer}
details{margin:6px 0 16px}summary{cursor:pointer;color:var(--muted);font-size:13px}
details ul{margin:8px 0 0;padding-left:20px;color:var(--muted);font-size:13px}
.bar{background:var(--surface-2);border-radius:6px;height:14px;min-width:160px;width:100%}
.bar i{display:block;height:100%;background:var(--accent);border-radius:6px}
.verdict{font-size:1.1rem;font-weight:700;margin:12px 0 0}
.legend{display:flex;gap:16px;margin-top:8px;color:var(--muted);font-size:13px}
.legend b{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
.err{color:var(--fee)}
/* Liquid market — visual layer only; queries and metrics stay unchanged. */
:root{color-scheme:dark;--bg:#080f14;--surface:#14232c;--surface-2:#1b3039;--border:#344b55;--text:#f0f6f6;--muted:#adbec6;--accent:#9bf4cf;--accent-ink:#09251d;--fee:#f3b493}
body{padding:32px 20px;background-image:radial-gradient(ellipse at 90% 0,#296c6040,transparent 40%),linear-gradient(#a1d5d306 1px,transparent 1px),linear-gradient(90deg,#a1d5d306 1px,transparent 1px);background-size:auto,64px 64px,64px 64px}
main{max-width:1240px;min-width:0}
h1{font-size:clamp(2rem,5vw,3.2rem);letter-spacing:-.055em;line-height:1.1;margin-bottom:10px}
h2{font-size:1.2rem;letter-spacing:-.025em;margin-bottom:22px;display:flex;flex-wrap:wrap;align-items:baseline;gap:10px}
.card,.kpi{background:linear-gradient(140deg,#ffffff0e,#ffffff02 50%,#a7e8ff08),#11212bea;border:1px solid #a9d6e12e;box-shadow:inset 0 1px 0 #ffffff21,0 16px 40px #0003;border-radius:24px}
.card{padding:26px;margin-bottom:22px}
.kpis{gap:14px;margin:26px 0}
.kpi{padding:22px;min-width:0}
.kpi .v{font-size:2.25rem;letter-spacing:-.05em;margin-top:12px}
.kpi:nth-child(2){background:linear-gradient(135deg,#9bf4cf20,#11212b);border-color:#9bf4cf55}
.kpi .l{min-height:40px}
form.filters{gap:16px}
.filters label{flex:1;min-width:140px;gap:8px}
input,select,button{min-height:46px;border-radius:12px;max-width:100%}
input,select{background:#08141c;color:var(--text);border-color:#9cc4cf38}
button{padding:10px 26px;border:1px solid #d1ffeb;background:linear-gradient(160deg,#c2ffe6,#8cebc4);border-radius:999px;box-shadow:inset 0 1px 0 #fff8}
th,td{padding:14px 12px;border-bottom-color:#b4d8e31c}
th{font-size:12px;background:#06121a40}
tbody tr:hover{background:#b8f2dd06}
td:first-child .m{display:block;font-size:11px}
.bar{height:9px;background:#b4d3e015}
.bar i{background:linear-gradient(90deg,#4f9c8b,#bafadd);box-shadow:inset 0 1px 0 #fff5}
summary{min-height:44px;display:flex;align-items:center;width:fit-content}
details{margin:10px 0 20px}
.legend b[style*="#F2A541"]{background:var(--accent)!important}
svg rect[fill="#F2A541"]{fill:var(--accent)}
svg rect[fill="#9BA1A6"]{fill:#6f8d9b}
:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
@media(max-width:600px){body{padding:24px 14px}.card{padding:20px 16px;border-radius:20px}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi{padding:16px}.kpi .v{font-size:1.8rem}.filters button{width:100%}}
</style>
<link rel="stylesheet" href="../css/liquid-glass.css?v=20261010-2">
<script type="module" src="../js/glass.js?v=20261010-2"></script>
</head>
<body>
<main>
<h1>Analytika</h1>
<p class="m" style="margin:0">aijunior – měření návštěv a konverzí</p>
<details>
  <summary>Popis metrik</summary>
  <ul>
    <li><strong>Dlaždice:</strong> návštěva = unikátní session s page_view, lead = unikátní session s form_success; konverze je jejich podíl.</li>
    <li><strong>Funnel:</strong> kolik unikátních session dosáhlo každého kroku; čti pruh jako podíl z návštěv a % z předchozího kroku jako místo, kde lidé odpadají.</li>
    <li><strong>A/B srovnání:</strong> porovnává konverzi variant A a B (rozdíl B − A, 95% interval a z-test); p &lt; 0,05 je průkazný rozdíl, při méně než 100 návštěvách varianty nerozhoduj.</li>
    <li><strong>Hloubka scrollu:</strong> podíl návštěv, které dojely do 50 % a 90 % stránky; nízké číslo značí slabý úvod nebo dlouhou stránku.</li>
    <li><strong>CTA a formuláře:</strong> kolik session kliklo na tlačítko, začalo a odeslalo formulář podle jeho umístění; porovnej, které umístění funguje.</li>
    <li><strong>Chyby formuláře:</strong> kolikrát a u kolika session formulář skončil chybou podle důvodu; vysoké hodnoty u server/network značí technický problém.</li>
    <li><strong>Zdroje návštěv:</strong> návštěvy, leady a konverze podle utm_source z příchodu na stránku; hledej zdroje s dobrou konverzí, ne jen s velkým provozem.</li>
    <li><strong>Trend:</strong> návštěvy a leady po dnech (u období nad 90 dní po týdnech); slouží k odhalení výpadků a dopadu kampaní.</li>
    <li><strong>Kvalita dat:</strong> objem měření a počet vyloučených testovacích session; málo eventů na session značí chybějící měření.</li>
  </ul>
</details>

<div class="card">
  <form method="get" class="filters">
    <label>Od <input type="date" name="from" value="<?= h($from->format('Y-m-d')) ?>"></label>
    <label>Do <input type="date" name="to" value="<?= h($to->format('Y-m-d')) ?>"></label>
    <label>Varianta
      <select name="variant">
        <?php foreach ($variantLabels as $k => $lbl): ?>
        <option value="<?= h($k) ?>"<?= $variant === $k ? ' selected' : '' ?>><?= h($lbl) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <label>Testovací návštěvy
      <select name="test">
        <?php foreach ($testLabels as $k => $lbl): ?>
        <option value="<?= h($k) ?>"<?= (string) $test === (string) $k ? ' selected' : '' ?>><?= h($lbl) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <button type="submit">Zobrazit</button>
  </form>
  <?php if ($clamped): ?><p class="m">Období zkráceno na maximálně <?= h(MAX_RANGE_DAYS) ?> dní.</p><?php endif; ?>
</div>

<?php if ($error !== null): ?>
<div class="card err"><?= h($error) ?></div>
<?php else: ?>

<!-- 1. KPI -->
<div class="kpis">
  <div class="kpi"><div class="l">Návštěvy</div><div class="v"><?= h(num($visits)) ?></div></div>
  <div class="kpi"><div class="l">Leady (session)</div><div class="v acc"><?= h(num($leads)) ?></div></div>
  <div class="kpi"><div class="l">Konverze návštěva → lead</div><div class="v"><?= h(pct($leads, $visits)) ?></div></div>
  <div class="kpi"><div class="l">Leady v DB za období</div><div class="v"><?= h(num($D['leadsDb'])) ?></div>
    <div class="m">Filtr testů se zde neuplatní.</div></div>
  <div class="kpi"><div class="l">Odhlášení za období</div><div class="v"><?= h(num($D['unsub'])) ?></div></div>
</div>

<!-- 2. Funnel -->
<div class="card">
  <h2>Funnel <span class="m"><?= h($from->format('j. n. Y')) ?> – <?= h($to->format('j. n. Y')) ?></span></h2>
  <table>
    <thead><tr><th>Krok</th><th>Session</th><th>% z předchozího</th><th>% z page_view</th><th style="text-align:left;width:40%">Podíl z návštěv</th></tr></thead>
    <tbody>
    <?php $prev = null; foreach ($steps as $key => $label):
        $c = $D['tot'][$key] ?? 0;
        $w = min(100.0, pctf($c, $visits)); ?>
      <tr>
        <td><?= h($label) ?> <span class="m"><?= h($key) ?></span></td>
        <td><?= h(num($c)) ?></td>
        <td><?= $prev === null ? '–' : h(pct($c, $prev)) ?></td>
        <td><?= h(pct($c, $visits)) ?></td>
        <td style="text-align:left"><div class="bar"><i style="width:<?= h(number_format($w, 1, '.', '')) ?>%"></i></div></td>
      </tr>
    <?php $prev = $c; endforeach; ?>
    </tbody>
  </table>
  <p class="m">Session se do kroku počítá, jakmile má daný event – nezávisle na předchozích krocích, proto může být krok občas větší než ten předchozí.</p>
</div>

<!-- 3. A/B -->
<div class="card">
  <h2>A/B srovnání <span class="m">filtr varianty se tu ignoruje</span></h2>
  <table>
    <thead><tr><th>Metrika</th><th>Varianta A</th><th>Varianta B</th></tr></thead>
    <tbody>
      <tr><td>Návštěvy</td><td><?= h(num($ab['na'])) ?></td><td><?= h(num($ab['nb'])) ?></td></tr>
      <tr><td>Leady</td><td><?= h(num($ab['xa'])) ?></td><td><?= h(num($ab['xb'])) ?></td></tr>
      <tr><td><strong>Konverze</strong></td><td class="acc"><?= h(pct($ab['xa'], $ab['na'])) ?></td><td class="acc"><?= h(pct($ab['xb'], $ab['nb'])) ?></td></tr>
      <?php foreach (['calc_interact' => 'Práce s kalkulačkou', 'form_focus' => 'Začátek vyplňování', 'form_submit' => 'Odeslání formuláře'] as $ev => $lbl): ?>
      <tr><td><?= h($lbl) ?> <span class="m">% z návštěv</span></td>
        <td><?= h(pct(cnt($D['byV'], 'a', $ev), $ab['na'])) ?></td>
        <td><?= h(pct(cnt($D['byV'], 'b', $ev), $ab['nb'])) ?></td></tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php if ($ab['z'] !== null): ?>
  <p style="margin:12px 0 0">Rozdíl konverzí (B − A): <strong><?= h(pp($ab['z']['diff'])) ?></strong><br>
    95% interval spolehlivosti rozdílu: <strong><?= h(pp($ab['z']['lo'])) ?></strong> až <strong><?= h(pp($ab['z']['hi'])) ?></strong><br>
    p-hodnota (dvouvýběrový z-test, oboustranný): <strong><?= h(num($ab['z']['p'], 4)) ?></strong></p>
  <?php else: ?>
  <p class="m" style="margin:12px 0 0">Rozdíl nelze spočítat – některá varianta nemá žádné návštěvy.</p>
  <?php endif; ?>
  <p class="verdict <?= $ab['verdict'] === 'Rozdíl je statisticky významný' ? 'acc' : '' ?>"><?= h($ab['verdict']) ?></p>
  <p class="m">Normální aproximace; platí při dostatečném počtu leadů v obou variantách. Hranice pro rozhodnutí: <?= h(MIN_VISITS) ?> návštěv na variantu.</p>
</div>

<!-- 4. Scroll -->
<div class="card">
  <h2>Hloubka scrollu <span class="m">filtr varianty se tu ignoruje</span></h2>
  <table>
    <thead><tr><th>Varianta</th><th>Návštěvy</th><th>scroll 50 %</th><th>% návštěv</th><th>scroll 90 %</th><th>% návštěv</th></tr></thead>
    <tbody>
    <?php
    $scrollRows = ['a' => 'Varianta A', 'b' => 'Varianta B', 'none' => 'Bez varianty'];
    $sum = ['page_view' => 0, 'scroll_50' => 0, 'scroll_90' => 0];
    foreach ($scrollRows as $k => $lbl):
        $pv = cnt($D['byV'], $k, 'page_view'); $s5 = cnt($D['byV'], $k, 'scroll_50'); $s9 = cnt($D['byV'], $k, 'scroll_90');
        $sum['page_view'] += $pv; $sum['scroll_50'] += $s5; $sum['scroll_90'] += $s9; ?>
      <tr><td><?= h($lbl) ?></td><td><?= h(num($pv)) ?></td><td><?= h(num($s5)) ?></td><td><?= h(pct($s5, $pv)) ?></td><td><?= h(num($s9)) ?></td><td><?= h(pct($s9, $pv)) ?></td></tr>
    <?php endforeach; ?>
      <tr><td><strong>Celkem</strong></td><td><?= h(num($sum['page_view'])) ?></td><td><?= h(num($sum['scroll_50'])) ?></td><td class="acc"><?= h(pct($sum['scroll_50'], $sum['page_view'])) ?></td><td><?= h(num($sum['scroll_90'])) ?></td><td class="acc"><?= h(pct($sum['scroll_90'], $sum['page_view'])) ?></td></tr>
    </tbody>
  </table>
</div>

<!-- 5. CTA a formuláře -->
<div class="card">
  <h2>CTA a formuláře podle pozice</h2>
  <?php
  $posRows = ['hero', '1', '2'];
  foreach (array_keys($D['pos']) as $k) {
      if (!in_array((string) $k, $posRows, true)) {
          $posRows[] = (string) $k;
      }
  }
  $posCols = ['cta_click' => 'cta_click', 'form_focus' => 'form_focus', 'form_submit' => 'form_submit', 'form_success' => 'form_success'];
  ?>
  <table>
    <thead><tr><th>Pozice</th><?php foreach ($posCols as $lbl): ?><th><?= h($lbl) ?></th><?php endforeach; ?></tr></thead>
    <tbody>
    <?php foreach ($posRows as $p): ?>
      <tr><td><?= h($p) ?></td><?php foreach (array_keys($posCols) as $ev): ?><td><?= h(num((int) ($D['pos'][$p][$ev] ?? 0))) ?></td><?php endforeach; ?></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <p class="m">Unikátní session. Pozice „hero“ = tlačítko v úvodu, 1 a 2 = první a druhý formulář / CTA.</p>
</div>

<!-- 6. Chyby formuláře -->
<div class="card">
  <h2>Chyby formuláře</h2>
  <table>
    <thead><tr><th>Důvod</th><th>Eventy</th><th>Unikátní session</th></tr></thead>
    <tbody>
    <?php foreach ($D['errors'] as $r): ?>
      <tr><td class="bad"><?= h($r['reason']) ?></td><td><?= h(num((int) $r['n'])) ?></td><td><?= h(num((int) $r['s'])) ?></td></tr>
    <?php endforeach; ?>
    <?php if (!$D['errors']): ?><tr><td colspan="3" class="m">Žádné chyby v tomto období.</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>

<!-- 7. Zdroje -->
<div class="card">
  <h2>Zdroje návštěv <span class="m">utm_source, max. 30 řádků</span></h2>
  <table>
    <thead><tr><th>Zdroj</th><th>Návštěvy</th><th>Leady</th><th>Konverze</th></tr></thead>
    <tbody>
    <?php foreach ($D['sources'] as $r): ?>
      <tr><td><?= h($r['source_label']) ?></td><td><?= h(num((int) $r['visits'])) ?></td><td><?= h(num((int) $r['leads'])) ?></td><td><?= h(pct((int) $r['leads'], (int) $r['visits'])) ?></td></tr>
    <?php endforeach; ?>
    <?php if (!$D['sources']): ?><tr><td colspan="4" class="m">Žádná data.</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>

<!-- 8. Trend -->
<div class="card">
  <h2>Trend po <?= $weekly ? 'týdnech' : 'dnech' ?> <span class="m"><?= $weekly ? 'období přes 90 dní, týden začíná v pondělí' : 'návštěvy a leady' ?></span></h2>
  <div class="scroll"><?= trend_svg($buckets, $D['trend'], $weekly) ?></div>
  <div class="legend"><span><b style="background:#9BA1A6"></b>Návštěvy</span><span><b style="background:#F2A541"></b>Leady</span></div>
  <div class="scroll" style="margin-top:12px">
  <table>
    <thead><tr><th><?= $weekly ? 'Týden od' : 'Den' ?></th><th>Návštěvy</th><th>Leady</th><th>Konverze</th></tr></thead>
    <tbody>
    <?php foreach (array_reverse($buckets) as $b):
        $v = (int) ($D['trend'][$b]['v'] ?? 0); $l = (int) ($D['trend'][$b]['l'] ?? 0); ?>
      <tr><td><?= h($b) ?></td><td><?= h(num($v)) ?></td><td><?= h(num($l)) ?></td><td><?= h(pct($l, $v)) ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  </div>
</div>

<!-- 9. Kvalita dat -->
<div class="card">
  <h2>Kvalita dat</h2>
  <?php $qn = (int) $D['quality']['n']; $qs = (int) $D['quality']['s']; ?>
  <table style="max-width:560px">
    <tbody>
      <tr><td>Eventů v období</td><td><?= h(num($qn)) ?></td></tr>
      <tr><td>Unikátních session</td><td><?= h(num($qs)) ?></td></tr>
      <tr><td>Průměr eventů na session</td><td><?= $qs > 0 ? h(num($qn / $qs, 1)) : '–' ?></td></tr>
      <tr><td>Testovací session v období <span class="m">(označené ?test=1; vyloučit je jde filtrem nahoře)</span></td><td><?= h(num($D['testSessions'])) ?></td></tr>
      <tr><td>Poslední event (dle filtru)</td><td><?= $D['quality']['last_at'] !== null ? h($D['quality']['last_at']) : '–' ?></td></tr>
    </tbody>
  </table>
</div>
<?php endif; ?>
</main>
</body>
</html>
