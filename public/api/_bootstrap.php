<?php
declare(strict_types=1);

// Přímé volání (https://.../api/_bootstrap.php) = 404.
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../../config.php';

date_default_timezone_set('Europe/Prague');

function cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = $_ENV['CORS_ORIGIN'] ?? '';
    if ($origin !== '' && $allowed !== '' && $origin === $allowed) {
        header('Access-Control-Allow-Origin: ' . $allowed);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Max-Age: 600');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_out(int $code, array $data, bool $exit = true): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($exit) {
        exit;
    }
}

/** Vrací dekódované pole, nebo null při neplatném JSONu. Při překročení velikosti ukončí s 413. */
function read_json_body(int $maxBytes): ?array
{
    $fh = fopen('php://input', 'rb');
    $raw = $fh === false ? '' : (string) stream_get_contents($fh, $maxBytes + 1);
    if ($fh !== false) {
        fclose($fh);
    }
    if (strlen($raw) > $maxBytes) {
        json_out(413, ['ok' => false, 'error' => 'too_large']);
    }
    if ($raw === '') {
        return null;
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

/** true = povoleno, false = limit překročen. Při chybě souborového systému povolí (fail open). */
function rate_limit(string $bucket, int $max, int $windowSec): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $key = hash_hmac('sha256', $ip, $_ENV['APP_SECRET'] ?? '');
    $dir = sys_get_temp_dir() . '/aijunior-rl';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return true;
    }
    $safeBucket = preg_replace('/[^a-z0-9_-]/i', '', $bucket);
    $file = $dir . '/' . $safeBucket . '-' . substr($key, 0, 40);

    $fh = @fopen($file, 'c+');
    if ($fh === false) {
        return true;
    }
    $allowed = true;
    if (flock($fh, LOCK_EX)) {
        $now = time();
        $stamps = [];
        foreach (explode("\n", (string) stream_get_contents($fh)) as $line) {
            $ts = (int) $line;
            if ($ts > $now - $windowSec) {
                $stamps[] = $ts;
            }
        }
        if (count($stamps) >= $max) {
            $allowed = false;
        } else {
            $stamps[] = $now;
        }
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, implode("\n", $stamps));
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);

    // Občasný úklid starých záznamů (nic starší než 1 den).
    if (random_int(1, 100) === 1) {
        foreach (glob($dir . '/*') ?: [] as $f) {
            if (is_file($f) && filemtime($f) < time() - 86400) {
                @unlink($f);
            }
        }
    }
    return $allowed;
}
