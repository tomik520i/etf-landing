<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    json_out(405, ['ok' => false, 'error' => 'method']);
}

const ALLOWED_EVENTS = [
    'page_view', 'scroll_50', 'scroll_90', 'calc_interact', 'calc_result_viewed',
    'cta_click', 'form_focus', 'form_submit', 'form_success', 'form_error',
];

try {
    if (!rate_limit('event', 300, 600)) {
        json_out(429, ['ok' => false, 'error' => 'rate_limited']);
    }

    // sendBeacon posílá text/plain; read_json_body čte php://input bez ohledu na Content-Type.
    $body = read_json_body(4096);
    if ($body === null) {
        json_out(400, ['ok' => false, 'error' => 'invalid']);
    }

    $sid = $body['session_id'] ?? null;
    $event = $body['event'] ?? null;
    if (
        !is_string($sid)
        || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $sid)
        || !is_string($event)
        || !in_array($event, ALLOWED_EVENTS, true)
    ) {
        json_out(400, ['ok' => false, 'error' => 'invalid']);
    }

    $adVariant = $body['ad_variant'] ?? null;
    if ($adVariant !== 'a' && $adVariant !== 'b') {
        $adVariant = null;
    }

    $props = null;
    if (isset($body['props']) && is_array($body['props']) && $body['props'] !== []) {
        $enc = json_encode($body['props'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($enc !== false && strlen($enc) <= 1000) {
            $props = $enc;
        }
    }

    $stmt = db()->prepare(
        'INSERT INTO events (session_id, event, ad_variant, props) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([strtolower($sid), $event, $adVariant, $props]);

    http_response_code(204);
    header('Cache-Control: no-store');
    exit;
} catch (Throwable $e) {
    error_log('event: ' . get_class($e) . ': ' . $e->getMessage());
    json_out(500, ['ok' => false, 'error' => 'server']);
}
