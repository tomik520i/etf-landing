<?php
declare(strict_types=1);

// Basic auth řeší Apache (deploy/INSTALL.md, krok 5). Tady jen hlavičky a čtení agregací.
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Content-Type: text/html; charset=utf-8');

require __DIR__ . '/../../config.php';
date_default_timezone_set('Europe/Prague');

function h(mixed $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
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

function pct(int $a, int $b): string
{
    return $b > 0 ? number_format($a / $b * 100, 1, ',', ' ') . ' %' : '–';
}

$today = new DateTimeImmutable('today');
$to = parse_date($_GET['to'] ?? null) ?? $today;
$from = parse_date($_GET['from'] ?? null) ?? $to->modify('-29 days');
if ($from > $to) {
    [$from, $to] = [$to, $from];
}
$fromSql = $from->format('Y-m-d 00:00:00');
$toSql = $to->modify('+1 day')->format('Y-m-d 00:00:00'); // exkluzivní horní mez

$steps = [
    'page_view' => 'Zobrazení stránky',
    'calc_interact' => 'Práce s kalkulačkou',
    'cta_click' => 'Klik na CTA',
    'form_submit' => 'Odeslání formuláře',
    'form_success' => 'Lead (úspěch)',
];
$cols = ['a' => 'Varianta A', 'b' => 'Varianta B', 'none' => 'Bez varianty', 'all' => 'Celkem'];

$error = null;
$funnel = [];
$leadsTotal = $leadsPeriod = $unsubPeriod = $unsubTotal = 0;
$leadsByVariant = $leadsBySource = $daily = [];
$days = [];

try {
    $pdo = db();
    $in = implode(',', array_fill(0, count($steps), '?'));
    $stepKeys = array_keys($steps);

    $stmt = $pdo->prepare(
        "SELECT ad_variant, event, COUNT(DISTINCT session_id) AS c FROM events
         WHERE created_at >= ? AND created_at < ? AND event IN ($in)
         GROUP BY ad_variant, event"
    );
    $stmt->execute([$fromSql, $toSql, ...$stepKeys]);
    foreach ($stmt as $r) {
        $k = $r['ad_variant'] === 'a' || $r['ad_variant'] === 'b' ? $r['ad_variant'] : 'none';
        $funnel[$k][$r['event']] = (int) $r['c'];
    }

    $stmt = $pdo->prepare(
        "SELECT event, COUNT(DISTINCT session_id) AS c FROM events
         WHERE created_at >= ? AND created_at < ? AND event IN ($in) GROUP BY event"
    );
    $stmt->execute([$fromSql, $toSql, ...$stepKeys]);
    foreach ($stmt as $r) {
        $funnel['all'][$r['event']] = (int) $r['c'];
    }

    $leadsTotal = (int) $pdo->query('SELECT COUNT(*) FROM leads')->fetchColumn();
    $unsubTotal = (int) $pdo->query('SELECT COUNT(*) FROM unsubscribes')->fetchColumn();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM leads WHERE created_at >= ? AND created_at < ?');
    $stmt->execute([$fromSql, $toSql]);
    $leadsPeriod = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM unsubscribes WHERE created_at >= ? AND created_at < ?');
    $stmt->execute([$fromSql, $toSql]);
    $unsubPeriod = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT ad_variant, COUNT(*) AS c FROM leads WHERE created_at >= ? AND created_at < ?
         GROUP BY ad_variant ORDER BY c DESC'
    );
    $stmt->execute([$fromSql, $toSql]);
    $leadsByVariant = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare(
        'SELECT utm_source, COUNT(*) AS c FROM leads WHERE created_at >= ? AND created_at < ?
         GROUP BY utm_source ORDER BY c DESC LIMIT 50'
    );
    $stmt->execute([$fromSql, $toSql]);
    $leadsBySource = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Eventy po dnech: posledních 14 dní (nezávisle na filtru).
    for ($i = 0; $i < 14; $i++) {
        $days[] = $today->modify("-$i days")->format('Y-m-d');
    }
    $stmt = $pdo->prepare(
        'SELECT DATE(created_at) AS d, event, COUNT(*) AS c FROM events
         WHERE created_at >= ? GROUP BY d, event'
    );
    $stmt->execute([$today->modify('-13 days')->format('Y-m-d 00:00:00')]);
    foreach ($stmt as $r) {
        $daily[$r['d']][$r['event']] = (int) $r['c'];
    }
} catch (Throwable $e) {
    error_log('admin: ' . get_class($e) . ': ' . $e->getMessage());
    $error = 'Data se nepodařilo načíst.';
}

$allEvents = ['page_view', 'scroll_50', 'scroll_90', 'calc_interact', 'calc_result_viewed',
    'cta_click', 'form_focus', 'form_submit', 'form_success', 'form_error'];
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Admin – funnel</title>
<style>
body{margin:0;background:#0E1113;color:#ECE9E3;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px}
main{max-width:1100px;margin:0 auto}
h1{font-size:1.5rem;margin:0 0 16px}h2{font-size:1.1rem;margin:0 0 12px}
.card{background:#161A1D;border:1px solid #2A3035;border-radius:16px;padding:20px;margin-bottom:16px;overflow-x:auto}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th,td{padding:8px 10px;text-align:right;border-bottom:1px solid #2A3035;white-space:nowrap}
th:first-child,td:first-child{text-align:left}
th{color:#9BA1A6;font-weight:600}
.m{color:#9BA1A6;font-size:13px}.acc{color:#F2A541;font-weight:700}
form{display:flex;gap:12px;flex-wrap:wrap;align-items:end}
label{display:flex;flex-direction:column;gap:4px;color:#9BA1A6;font-size:13px}
input,button{background:#1D2226;color:#ECE9E3;border:1px solid #2A3035;border-radius:8px;padding:8px 10px;font:inherit}
button{background:#F2A541;color:#1A1205;border:0;font-weight:700;cursor:pointer}
.err{color:#E8735A}
</style>
</head>
<body>
<main>
<h1>Funnel – aijunior</h1>
<div class="card">
  <form method="get">
    <label>Od <input type="date" name="from" value="<?= h($from->format('Y-m-d')) ?>"></label>
    <label>Do <input type="date" name="to" value="<?= h($to->format('Y-m-d')) ?>"></label>
    <button type="submit">Zobrazit</button>
  </form>
</div>
<?php if ($error !== null): ?>
<div class="card err"><?= h($error) ?></div>
<?php else: ?>
<div class="card">
  <h2>Funnel (unikátní session) <span class="m"><?= h($from->format('j. n. Y')) ?> – <?= h($to->format('j. n. Y')) ?></span></h2>
  <table>
    <thead><tr><th>Krok</th><?php foreach ($cols as $label): ?><th><?= h($label) ?></th><?php endforeach; ?></tr></thead>
    <tbody>
    <?php $prevKey = null; foreach ($steps as $key => $label): ?>
      <tr><td><?= h($label) ?></td>
      <?php foreach (array_keys($cols) as $c):
          $n = $funnel[$c][$key] ?? 0;
          $prev = $prevKey !== null ? ($funnel[$c][$prevKey] ?? 0) : null; ?>
        <td><?= h(number_format($n, 0, ',', ' ')) ?><?php if ($prev !== null): ?> <span class="m">(<?= h(pct($n, $prev)) ?>)</span><?php endif; ?></td>
      <?php endforeach; ?></tr>
    <?php $prevKey = $key; endforeach; ?>
      <tr><td><strong>Celková konverze</strong><br><span class="m">zobrazení → lead</span></td>
      <?php foreach (array_keys($cols) as $c): ?>
        <td class="acc"><?= h(pct($funnel[$c]['form_success'] ?? 0, $funnel[$c]['page_view'] ?? 0)) ?></td>
      <?php endforeach; ?></tr>
    </tbody>
  </table>
  <p class="m">V závorce: přechod z předchozího kroku.</p>
</div>

<div class="card">
  <h2>Leady a odhlášení</h2>
  <p>Leadů za období: <strong><?= h($leadsPeriod) ?></strong> <span class="m">(celkem od začátku: <?= h($leadsTotal) ?>)</span><br>
  Odhlášení za období: <strong><?= h($unsubPeriod) ?></strong> <span class="m">(celkem od začátku: <?= h($unsubTotal) ?>)</span></p>
  <table style="max-width:420px">
    <thead><tr><th>Varianta</th><th>Leady</th></tr></thead><tbody>
    <?php foreach ($leadsByVariant as $r): ?>
      <tr><td><?= h($r['ad_variant'] === null ? 'bez varianty' : strtoupper((string) $r['ad_variant'])) ?></td><td><?= h($r['c']) ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <br>
  <table style="max-width:420px">
    <thead><tr><th>utm_source</th><th>Leady</th></tr></thead><tbody>
    <?php foreach ($leadsBySource as $r): ?>
      <tr><td><?= h($r['utm_source'] ?? '(žádný)') ?></td><td><?= h($r['c']) ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>

<div class="card">
  <h2>Eventy po dnech <span class="m">posledních 14 dní, počet řádků</span></h2>
  <table>
    <thead><tr><th>Den</th><?php foreach ($allEvents as $ev): ?><th><?= h($ev) ?></th><?php endforeach; ?></tr></thead>
    <tbody>
    <?php foreach ($days as $d): ?>
      <tr><td><?= h($d) ?></td>
      <?php foreach ($allEvents as $ev): ?><td><?= h($daily[$d][$ev] ?? 0) ?></td><?php endforeach; ?></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>
</main>
</body>
</html>
