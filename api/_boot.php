<?php
// Shared setup for the account API. Files starting with _ are blocked from the web by .htaccess.
// Database details live in gu-config.php, one folder ABOVE public_html, so they are never in Git.
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function config(): ?array {
    $file = dirname(__DIR__, 2) . '/gu-config.php';
    if (!is_file($file)) return null;
    $c = require $file;
    return is_array($c) ? $c : null;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = config();
    if (!$c) out(503, ['error' => 'Accounts are not switched on yet. Please check back soon.']);
    try {
        $pdo = new PDO(
            'mysql:host=' . ($c['db_host'] ?? '127.0.0.1') . ';dbname=' . $c['db_name'] . ';charset=utf8mb4',
            $c['db_user'], $c['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
        );
    } catch (Throwable $e) {
        out(503, ['error' => 'Accounts are not available right now. Please try again later.']);
    }
    ensure_schema($pdo);
    return $pdo;
}

function ensure_schema(PDO $pdo): void {
    $pdo->exec('CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(190) NOT NULL UNIQUE,
        name VARCHAR(60) NOT NULL,
        pass_hash VARCHAR(255) NULL,
        google_sub VARCHAR(64) NULL UNIQUE,
        created_at DATETIME NOT NULL,
        last_login DATETIME NULL
    ) CHARACTER SET utf8mb4');
    $pdo->exec('CREATE TABLE IF NOT EXISTS profiles (
        user_id INT UNSIGNED PRIMARY KEY,
        bio VARCHAR(280) NOT NULL DEFAULT "",
        location VARCHAR(80) NOT NULL DEFAULT "",
        fav VARCHAR(40) NOT NULL DEFAULT "",
        avatar MEDIUMTEXT NULL,
        updated_at DATETIME NOT NULL
    ) CHARACTER SET utf8mb4');
    $pdo->exec('CREATE TABLE IF NOT EXISTS resets (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used TINYINT NOT NULL DEFAULT 0
    ) CHARACTER SET utf8mb4');
    $pdo->exec('CREATE TABLE IF NOT EXISTS progress (
        user_id INT UNSIGNED NOT NULL PRIMARY KEY,
        data MEDIUMTEXT NOT NULL,
        updated_at DATETIME NOT NULL
    ) CHARACTER SET utf8mb4');
    $pdo->exec('CREATE TABLE IF NOT EXISTS attempts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ip_hash CHAR(64) NOT NULL,
        kind VARCHAR(12) NOT NULL,
        ts DATETIME NOT NULL,
        KEY k (ip_hash, kind, ts)
    ) CHARACTER SET utf8mb4');
}

function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
    session_name('gu_sess');
    session_start();
}

// Posts must come from our own pages: needs the custom header (browsers block it cross-site) and a JSON body.
function read_post(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['error' => 'Method not allowed.']);
    if (($_SERVER['HTTP_X_GU'] ?? '') !== '1') out(400, ['error' => 'Bad request.']);
    $d = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($d) ? $d : [];
}

function client_hash(): string {
    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|gu');
}

// Allow at most $max attempts of $kind from one address in $mins minutes.
function throttle(string $kind, int $max, int $mins): void {
    $pdo = db();
    $h = client_hash();
    $pdo->prepare('DELETE FROM attempts WHERE ts < (NOW() - INTERVAL 1 DAY)')->execute();
    $s = $pdo->prepare('SELECT COUNT(*) FROM attempts WHERE ip_hash=? AND kind=? AND ts > (NOW() - INTERVAL ' . (int)$mins . ' MINUTE)');
    $s->execute([$h, $kind]);
    if ((int)$s->fetchColumn() >= $max) out(429, ['error' => 'Too many tries. Please wait a few minutes and try again.']);
}

function note_attempt(string $kind): void {
    db()->prepare('INSERT INTO attempts (ip_hash, kind, ts) VALUES (?,?,NOW())')->execute([client_hash(), $kind]);
}

function clean_email(string $e): string { return strtolower(trim($e)); }
function valid_email(string $e): bool { return strlen($e) <= 190 && filter_var($e, FILTER_VALIDATE_EMAIL) !== false; }

function public_user(array $u): array {
    return ['name' => $u['name'], 'email' => $u['email']];
}
