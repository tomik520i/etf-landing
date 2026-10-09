<?php
declare(strict_types=1);

// GET  = potvrzovací stránka s tlačítkem (prefetch/skenery odkazů nikoho neodhlásí)
// POST = odhlášení; funguje i jako one-click podle RFC 8058 (List-Unsubscribe-Post)

require __DIR__ . '/_bootstrap.php';

header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

function page(int $code, string $title, string $text, string $formHtml = ''): void
{
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    $t = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    $p = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    echo '<!doctype html><html lang="cs"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . $t . '</title>'
        . '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;'
        . 'background:#0E1113;color:#ECE9E3;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px}'
        . 'main{max-width:480px}h1{font-size:1.75rem;margin:0 0 12px}p{line-height:1.5;margin:0 0 20px}'
        . 'button{background:#F2A541;color:#1A1205;border:0;border-radius:10px;padding:14px 22px;font:inherit;font-weight:700;cursor:pointer;min-height:44px}'
        . 'button:focus-visible{outline:3px solid #F2A541;outline-offset:3px}</style>'
        . '</head><body><main><h1>' . $t . '</h1><p>' . $p . '</p>' . $formHtml . '</main></body></html>';
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    page(405, 'Nepodporovaná metoda', 'Tuhle adresu otevři v prohlížeči jako odkaz z e-mailu.');
}

// e a t jsou vždy v URL (i u one-click POST z mailového klienta)
$e = $_GET['e'] ?? null;
$t = $_GET['t'] ?? null;
if (!is_string($e) || !is_string($t) || $e === '' || strlen($e) > 254
    || !hash_equals(hash_hmac('sha256', $e, $_ENV['APP_SECRET'] ?? ''), $t)) {
    page(400, 'Odkaz je neplatný', 'Odkaz je neplatný. Odhlásit se můžeš odkazem z posledního e-mailu.');
}

if ($method === 'GET') {
    $action = htmlspecialchars('?e=' . urlencode($e) . '&t=' . urlencode($t), ENT_QUOTES, 'UTF-8');
    page(200, 'Odhlásit e-maily?', 'Po potvrzení ti už nepošleme žádný e-mail.',
        '<form method="post" action="' . $action . '"><button type="submit">Ano, odhlásit</button></form>');
}

try {
    $stmt = db()->prepare('INSERT IGNORE INTO unsubscribes (email) VALUES (?)');
    $stmt->execute([$e]);
} catch (Throwable $ex) {
    error_log('unsubscribe: ' . get_class($ex) . ': ' . $ex->getMessage());
    page(500, 'Něco se nepovedlo', 'Zkus to prosím za chvíli znovu.');
}

page(200, 'Odhlášeno', 'Už ti nebudeme posílat žádné e-maily.');
