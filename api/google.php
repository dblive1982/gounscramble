<?php
require __DIR__ . '/_boot.php';
$c = config();
$cid = $c['google_client_id'] ?? '';
if (!$cid) out(404, ['error' => 'Google sign-in is not set up.']);
$in = read_post();
$tok = (string)($in['credential'] ?? '');
if ($tok === '' || strlen($tok) > 4000 || !preg_match('/^[A-Za-z0-9_\-.]+$/', $tok)) out(422, ['error' => 'Google sign-in failed. Please try again.']);
throttle('google', 20, 15);
note_attempt('google');
// Ask Google to verify the signed token for us.
$ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
$raw = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($tok), false, $ctx);
$g = $raw ? json_decode($raw, true) : null;
if (!is_array($g) || ($g['aud'] ?? '') !== $cid || !in_array($g['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true)
    || ($g['email_verified'] ?? '') !== 'true' || (int)($g['exp'] ?? 0) < time() || empty($g['sub']) || empty($g['email'])) {
    out(401, ['error' => 'Google sign-in could not be verified. Please try again.']);
}
$sub = substr((string)$g['sub'], 0, 64);
$email = clean_email((string)$g['email']);
$name = trim((string)($g['name'] ?? '')) ?: strstr($email, '@', true);
$name = mb_substr($name, 0, 60);
$pdo = db();
$s = $pdo->prepare('SELECT id, name, email, google_sub FROM users WHERE google_sub=? OR email=? LIMIT 1');
$s->execute([$sub, $email]);
$u = $s->fetch();
if ($u) {
    if (!$u['google_sub']) $pdo->prepare('UPDATE users SET google_sub=? WHERE id=?')->execute([$sub, $u['id']]);
    $pdo->prepare('UPDATE users SET last_login=NOW() WHERE id=?')->execute([$u['id']]);
    $id = (int)$u['id']; $name = $u['name']; $email = $u['email'];
} else {
    $pdo->prepare('INSERT INTO users (email, name, pass_hash, google_sub, created_at, last_login) VALUES (?,?,NULL,?,NOW(),NOW())')
        ->execute([$email, $name, $sub]);
    $id = (int)$pdo->lastInsertId();
}
start_session();
session_regenerate_id(true);
$_SESSION['uid'] = $id;
out(200, ['user' => ['name' => $name, 'email' => $email]]);
