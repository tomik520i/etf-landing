<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_mail_template.php';

cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    json_out(405, ['ok' => false, 'error' => 'method']);
}

/** Ořízne na 100 znaků, odstraní řídicí znaky; prázdné = null. */
function clean_utm(mixed $v): ?string
{
    if (!is_string($v) || !mb_check_encoding($v, 'UTF-8')) {
        return null;
    }
    $v = preg_replace('/\p{C}+/u', '', $v) ?? '';
    $v = trim(mb_substr($v, 0, 100));
    return $v === '' ? null : $v;
}

/** @return bool true při úspěchu */
function send_resend_mail(string $email, array $content, string $unsubUrl): bool
{
    $from = ($_ENV['MAIL_FROM_NAME'] ?? '') . ' <' . ($_ENV['MAIL_FROM'] ?? '') . '>';
    $mail = [
        'from' => $from,
        'to' => [$email],
        'subject' => $content['subject'],
        'html' => $content['html'],
        'text' => $content['text'],
        // Bez hlaviček List-Unsubscribe: jde o jeden vyžádaný (transakční) e-mail, ne newsletter.
        // S nimi ho Seznam řadí do „Hromadné“. Odhlašovací odkaz zůstává v textu e-mailu.
    ];
    // Odesílací adresa nemá schránku – odpovědi jdou na skutečný kontakt
    if (!empty($_ENV['MAIL_REPLY_TO'])) {
        $mail['reply_to'] = $_ENV['MAIL_REPLY_TO'];
    }
    $payload = json_encode($mail, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        error_log('lead: mail payload encode failed');
        return false;
    }

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . ($_ENV['RESEND_API_KEY'] ?? ''),
            'Content-Type: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 8,
    ]);
    $resp = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_errno($ch);
    curl_close($ch);

    if ($resp === false || $status < 200 || $status >= 300) {
        // Bez e-mailové adresy a bez těla odpovědi.
        error_log('lead: Resend selhal (http ' . $status . ', curl ' . $err . ')');
        return false;
    }
    return true;
}

try {
    $body = read_json_body(4096);
    if ($body === null) {
        json_out(400, ['ok' => false, 'error' => 'invalid_email']);
    }

    // Honeypot: tváříme se, že vše proběhlo.
    if (isset($body['website']) && $body['website'] !== '' && $body['website'] !== null) {
        json_out(200, ['ok' => true]);
    }

    if (!rate_limit('lead', 5, 600)) {
        json_out(429, ['ok' => false, 'error' => 'rate_limited']);
    }

    $email = $body['email'] ?? null;
    if (!is_string($email)) {
        json_out(400, ['ok' => false, 'error' => 'invalid_email']);
    }
    $email = mb_strtolower(trim($email));
    if ($email === '' || strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        json_out(400, ['ok' => false, 'error' => 'invalid_email']);
    }

    if (($body['consent'] ?? null) !== true) {
        json_out(400, ['ok' => false, 'error' => 'consent_required']);
    }

    $adVariant = $body['ad_variant'] ?? null;
    if ($adVariant !== 'a' && $adVariant !== 'b') {
        $adVariant = null;
    }
    $utmSource = clean_utm($body['utm_source'] ?? null);
    $utmCampaign = clean_utm($body['utm_campaign'] ?? null);
    // position (1|2) se validuje, ale schéma leads pro něj nemá sloupec – eventy nese frontend.
    $position = $body['position'] ?? null;
    if ($position !== 1 && $position !== 2) {
        $position = null;
    }

    try {
        $stmt = db()->prepare(
            'INSERT INTO leads (email, consent, ad_variant, utm_source, utm_campaign) VALUES (?, 1, ?, ?, ?)'
        );
        $stmt->execute([$email, $adVariant, $utmSource, $utmCampaign]);
    } catch (PDOException $e) {
        // jen duplicitní klíč (1062), ne jakékoli porušení integrity (SQLSTATE 23000)
        if (($e->errorInfo[1] ?? null) === 1062) {
            json_out(200, ['ok' => true]); // duplicita, e-mail se neposílá znovu
        }
        throw $e;
    }

    // Odpověď odešleme hned, e-mail doběhne po uzavření spojení (pokud FPM).
    json_out(200, ['ok' => true], false);
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }

    $appUrl = rtrim($_ENV['APP_URL'] ?? '', '/');
    $pdfUrl = $appUrl . '/pdf/etf-srovnani.pdf';
    $unsubUrl = $appUrl . '/api/unsubscribe.php?e=' . urlencode($email)
        . '&t=' . hash_hmac('sha256', $email, $_ENV['APP_SECRET'] ?? '');

    try {
        send_resend_mail($email, mail_content($pdfUrl, $unsubUrl), $unsubUrl);
    } catch (Throwable $e) {
        error_log('lead: chyba při odesílání e-mailu: ' . get_class($e));
    }
    exit;
} catch (Throwable $e) {
    error_log('lead: ' . get_class($e) . ': ' . $e->getMessage());
    if (!headers_sent()) {
        json_out(500, ['ok' => false, 'error' => 'server']);
    }
    exit;
}
