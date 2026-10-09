<?php
declare(strict_types=1);

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(404);
    exit;
}

/**
 * Obsah e-mailu s odkazem na PDF (text: content/texty.md, sekce email).
 * @return array{subject: string, html: string, text: string}
 */
function mail_content(string $pdfUrl, string $unsubUrl): array
{
    $h = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    $appUrl = rtrim($_ENV['APP_URL'] ?? '', '/');
    $signature = $_ENV['MAIL_FROM_NAME'] ?? '';

    $subject = 'Tvoje PDF: srovnání ETF a nákup z ČR';

    $text = "Ahoj,\n\n"
        . "díky za zájem o PDF. Tady ho máš: {$pdfUrl}\n\n"
        . "Uvnitř najdeš srovnání SPY, VOO a VT, jejich UCITS ekvivalenty, které jde koupit z Česka, "
        . "a postup nákupu krok za krokem. Čísla jsou historická data k 09/2026 a nejde o investiční doporučení.\n\n"
        . "Až budeš chtít, vrať se na kalkulačku a zkus jinou částku nebo jiný fond: {$appUrl}\n\n"
        . "Další e-maily nechceš? Odhlásíš se jedním klikem: {$unsubUrl}\n\n"
        . $signature . "\n";

    $p = 'style="margin:0 0 16px;line-height:1.55"';
    $html = '<!doctype html><html lang="cs"><body style="margin:0;padding:24px;background:#ffffff;color:#1A1D1F;'
        . 'font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px">'
        . '<div style="max-width:560px;margin:0 auto">'
        . "<p $p>Ahoj,</p>"
        . "<p $p>díky za zájem o PDF. Tady ho máš:</p>"
        . '<p style="margin:0 0 24px"><a href="' . $h($pdfUrl) . '" style="display:inline-block;background:#F2A541;'
        . 'color:#1A1205;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">Stáhnout PDF</a></p>'
        . "<p $p>Uvnitř najdeš srovnání SPY, VOO a VT, jejich UCITS ekvivalenty, které jde koupit z Česka, "
        . 'a postup nákupu krok za krokem. Čísla jsou historická data k 09/2026 a nejde o investiční doporučení.</p>'
        . "<p $p>Až budeš chtít, vrať se na <a href=\"" . $h($appUrl) . '" style="color:#B8741A">kalkulačku</a> '
        . 'a zkus jinou částku nebo jiný fond.</p>'
        . "<p $p>" . $h($signature) . '</p>'
        . '<p style="margin:24px 0 0;font-size:13px;color:#6B7378">Další e-maily nechceš? '
        . '<a href="' . $h($unsubUrl) . '" style="color:#6B7378">Odhlásíš se jedním klikem</a>.</p>'
        . '</div></body></html>';

    return ['subject' => $subject, 'html' => $html, 'text' => $text];
}
