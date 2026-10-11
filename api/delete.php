<?php
// Deletes the signed-in account and everything stored with it.
require __DIR__ . '/_boot.php';
if (!config()) out(200, ['user' => null]);
$in = read_post();
start_session();
$uid = (int)($_SESSION['uid'] ?? 0);
if ($uid <= 0) out(401, ['error' => 'Please sign in first.']);
if (($in['confirm'] ?? '') !== 'DELETE') out(422, ['error' => 'Type DELETE to confirm.']);
throttle('delete', 6, 15);
$pdo = db();
$s = $pdo->prepare('SELECT id, pass_hash FROM users WHERE id=?');
$s->execute([$uid]);
$u = $s->fetch();
if (!$u) out(404, ['error' => 'Account not found.']);
if (!empty($u['pass_hash'])) {
    if (!password_verify((string)($in['password'] ?? ''), $u['pass_hash'])) {
        note_attempt('delete');
        out(401, ['error' => 'That password is not right.']);
    }
}
$pdo->beginTransaction();
foreach (['resets', 'progress', 'profiles'] as $t) $pdo->prepare("DELETE FROM $t WHERE user_id=?")->execute([$uid]);
$pdo->prepare('DELETE FROM users WHERE id=?')->execute([$uid]);
$pdo->commit();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], true, true);
}
session_destroy();
out(200, ['ok' => true]);
