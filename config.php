<?php
// Načte .env (leží vedle tohoto souboru, MIMO document root public/).

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
        // created_at ve stejné zóně jako PHP (Europe/Prague); offset, protože MariaDB nemusí mít načtené tabulky zón
        $offset = (new DateTimeImmutable('now', new DateTimeZone('Europe/Prague')))->format('P');
        $pdo->exec("SET time_zone = '$offset'");
    }
    return $pdo;
}
